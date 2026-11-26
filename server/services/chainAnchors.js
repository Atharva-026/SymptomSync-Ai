// server/services/chainAnchors.js
//
// The only blockchain API controllers need.
//
//   WRITE side (recordUploaded, familyGranted, ...): queue an event. They never
//   throw - a blockchain problem must not break uploading or sharing.
//
//   READ side (gate): a second check before a file is served. MongoDB stays the
//   primary source of truth; the chain adds tamper evidence and a second opinion.
//
// gate() decision table
//   chain off, or record not anchored yet ........ allow (MongoDB check only)
//   chain unreachable ............................ allow (MongoDB check only) + warning
//   chain says yes (access + hash match) ......... allow
//   chain says no, but events are still queued ... allow (chain not caught up yet)
//   chain says hash differs ...................... DENY 409 (file was altered)
//   chain says no access ......................... DENY 403

const blockchain = require('./blockchainService');
const outbox = require('./chainOutbox');
const ChainEvent = require('../models/ChainEvent');

const unix = (date) => (date ? String(Math.floor(new Date(date).getTime() / 1000)) : blockchain.NO_EXPIRY);

/** Run a queueing step; log (never throw) if it fails. */
async function safely(label, fn) {
  if (!blockchain.isEnabled()) return;
  try {
    await fn();
  } catch (err) {
    console.error(`⛓️ Could not queue "${label}":`, err.message);
  }
}

// ------------------------------------------------------------------ writes

/** A new encrypted record: register its hash and owner. */
const recordUploaded = (record) =>
  safely('register record', () =>
    outbox.enqueue('register', {
      recordRef: record._id,
      patientRef: record.patient,
      args: {
        recordId: blockchain.recordKey(record._id),
        patientId: blockchain.userKey(record.patient),
        fileHash: '0x' + record.fileHash,
      },
    })
  );

/** Family member may view ALL of the patient's records (one grant, one revoke). */
const familyGranted = (patientId, memberId) =>
  safely('grant family access', () =>
    outbox.enqueue('grantPatient', {
      patientRef: patientId,
      args: {
        patientId: blockchain.userKey(patientId),
        userId: blockchain.userKey(memberId),
        expiry: blockchain.NO_EXPIRY,
      },
    })
  );

const familyRevoked = (patientId, memberId) =>
  safely('revoke family access', () =>
    outbox.enqueue('revokePatient', {
      patientRef: patientId,
      args: {
        patientId: blockchain.userKey(patientId),
        userId: blockchain.userKey(memberId),
      },
    })
  );

/** A doctor may open one record until `expiresAt`. */
const doctorGranted = (record, doctorId, expiresAt) =>
  safely('grant doctor access', () =>
    outbox.enqueue('grantRecord', {
      recordRef: record._id,
      patientRef: record.patient,
      args: {
        recordId: blockchain.recordKey(record._id),
        userId: blockchain.userKey(doctorId),
        expiry: unix(expiresAt),
      },
    })
  );

/** A QR link may open one record until `expiresAt` - enforced by the contract itself. */
const linkCreated = (record, tokenHash, expiresAt) =>
  safely('grant QR link', () =>
    outbox.enqueue('grantRecord', {
      recordRef: record._id,
      patientRef: record.patient,
      args: {
        recordId: blockchain.recordKey(record._id),
        userId: blockchain.linkKey(tokenHash),
        expiry: unix(expiresAt),
      },
    })
  );

const linksRevoked = (record, tokenHashes) =>
  safely('revoke QR links', async () => {
    for (const tokenHash of tokenHashes) {
      await outbox.enqueue('revokeRecord', {
        recordRef: record._id,
        patientRef: record.patient,
        args: {
          recordId: blockchain.recordKey(record._id),
          userId: blockchain.linkKey(tokenHash),
        },
      });
    }
  });

/** Optional on-chain audit entry for a view/download. Off unless CHAIN_LOG_VIEWS=true. */
const accessLogged = (record, subject, action) => {
  if (process.env.CHAIN_LOG_VIEWS !== 'true') return Promise.resolve();
  return safely('log access', () =>
    outbox.enqueue('logAccess', {
      recordRef: record._id,
      patientRef: record.patient,
      args: {
        recordId: blockchain.recordKey(record._id),
        userId: subject.link ? blockchain.linkKey(subject.link) : blockchain.userKey(subject.user),
        action: blockchain.actionKey(action),
      },
    })
  );
};

// ------------------------------------------------------------------- reads

/** Are there chain writes for this record/patient that have not landed yet? */
const hasUnsyncedEvents = async (record) =>
  Boolean(
    await ChainEvent.exists({
      status: { $in: ['pending', 'failed'] },
      $or: [{ recordRef: record._id }, { patientRef: record.patient }],
    })
  );

/**
 * Second gate before serving a file.
 * @param record   MedicalRecord document
 * @param subject  { user: mongoUserId } or { link: shareTokenHash }
 * @returns {{ok:true, source:string} | {ok:false, status:number, reason:string}}
 */
async function gate(record, subject) {
  if (!blockchain.isEnabled()) return { ok: true, source: 'chain-disabled' };
  // Not registered yet (uploaded before the chain was switched on, or still queued)
  if (!record.chain || !record.chain.txHash) return { ok: true, source: 'not-anchored' };

  const subjectKey = subject.link ? blockchain.linkKey(subject.link) : blockchain.userKey(subject.user);

  let result;
  try {
    result = await blockchain.checkAccess(blockchain.recordKey(record._id), subjectKey, record.fileHash);
  } catch (err) {
    console.warn('⛓️ Chain unreachable - using the MongoDB check only:', err.shortMessage || err.message);
    return { ok: true, source: 'mongo-fallback' };
  }

  if (result.access && result.hashMatches) return { ok: true, source: 'chain' };

  // The chain disagrees. If our own writes have not landed yet, that is expected.
  if (await hasUnsyncedEvents(record)) return { ok: true, source: 'mongo-unsynced' };

  if (!result.hashMatches) {
    return {
      ok: false,
      status: 409,
      reason: 'Integrity check failed: the file does not match its blockchain record',
    };
  }
  return { ok: false, status: 403, reason: 'Access is not confirmed on the blockchain' };
}

/** For the owner's "verify on blockchain" endpoint. */
async function verifyRecord(record, ownerId) {
  const base = { enabled: blockchain.isEnabled(), anchored: Boolean(record.chain && record.chain.txHash) };
  if (!base.enabled) return { ...base, message: 'Blockchain layer is turned off' };

  const status = {
    ...base,
    txHash: record.chain && record.chain.txHash,
    anchoredAt: record.chain && record.chain.anchoredAt,
    queuedEvents: await hasUnsyncedEvents(record),
  };
  if (!base.anchored) return { ...status, message: 'Not registered on the blockchain yet' };

  try {
    const result = await blockchain.checkAccess(
      blockchain.recordKey(record._id),
      blockchain.userKey(ownerId),
      record.fileHash
    );
    return { ...status, hashMatchesChain: result.hashMatches, ownerRecognised: result.access, chainReachable: true };
  } catch (err) {
    return { ...status, chainReachable: false, message: 'Blockchain node is not reachable right now' };
  }
}

module.exports = {
  recordUploaded,
  familyGranted,
  familyRevoked,
  doctorGranted,
  linkCreated,
  linksRevoked,
  accessLogged,
  gate,
  verifyRecord,
};
