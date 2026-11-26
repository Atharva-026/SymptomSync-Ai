// Run from the repo root:  node server/scripts/verify-chain-logic.js
//
// Tests the backend's blockchain logic (identifiers, retry queue, ordering,
// fallback, the access gate) with NO packages installed: ethers, MongoDB and
// the contract are replaced by small in-memory fakes. The fake contract copies
// the rules of MedicalRecordRegistry.sol, so this checks the BACKEND's
// behaviour - the contract itself is tested by `npx hardhat test` in /blockchain.

const path = require('path');
const Module = require('module');
const crypto = require('crypto');

const SERVER = path.resolve(__dirname, '..');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

process.env.BLOCKCHAIN_ENABLED = 'true';
process.env.RPC_URL = 'http://127.0.0.1:8545';
process.env.CHAIN_ID = '31337';
process.env.CONTRACT_ADDRESS = '0x' + '1'.repeat(40);
process.env.OPERATOR_PRIVATE_KEY = '0x' + '2'.repeat(64);
process.env.CHAIN_ID_SALT = crypto.randomBytes(32).toString('hex');
delete process.env.CHAIN_LOG_VIEWS;

// ------------------------------------------------------------ fake chain
const S = { records: new Map(), recAccess: new Map(), patAccess: new Map(), down: false, paused: false, clock: 0, txCount: 0 };
const now = () => Math.floor(Date.now() / 1000) + S.clock;
const revert = (name) => Object.assign(new Error(`execution reverted: ${name}`), { code: 'CALL_EXCEPTION', revert: { name } });
const netErr = () => Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:8545'), { code: 'NETWORK_ERROR' });
const tx = () => { const hash = '0xtx' + ++S.txCount; return { hash, wait: async () => ({ hash }) }; };
const up = () => { if (S.down) throw netErr(); };
const writable = () => { up(); if (S.paused) throw revert('EnforcedPause'); };
const live = (exp) => exp !== undefined && Number(exp) > now();

class FakeContract {
  async registerRecord(rid, pid, hash) { writable(); if (S.records.has(rid)) throw revert('RecordExists'); S.records.set(rid, { pid, hash }); return tx(); }
  async grantRecordAccess(rid, uid, exp) { writable(); if (!S.records.has(rid)) throw revert('RecordNotFound'); if (Number(exp) <= now()) throw revert('BadExpiry'); S.recAccess.set(rid + uid, exp); return tx(); }
  async revokeRecordAccess(rid, uid) { up(); S.recAccess.delete(rid + uid); return tx(); } // allowed while paused
  async grantPatientAccess(pid, uid, exp) { writable(); if (Number(exp) <= now()) throw revert('BadExpiry'); S.patAccess.set(pid + uid, exp); return tx(); }
  async revokePatientAccess(pid, uid) { up(); S.patAccess.delete(pid + uid); return tx(); } // allowed while paused
  async logAccess(rid) { writable(); if (!S.records.has(rid)) throw revert('RecordNotFound'); return tx(); }
  async checkAccess(rid, uid, hash) {
    up();
    const r = S.records.get(rid);
    if (!r) return [false, false];
    const access = r.pid === uid || live(S.recAccess.get(rid + uid)) || live(S.patAccess.get(r.pid + uid));
    return [access, r.hash === hash];
  }
}
// ethers v6 exposes its API as `require('ethers').ethers` (the service destructures it)
const fakeEthers = {
  ethers: {
    FetchRequest: class { constructor(url) { this.url = url; } },
    JsonRpcProvider: class {},
    Wallet: class {},
    Contract: FakeContract,
  },
};
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  return request === 'ethers' ? fakeEthers : originalLoad.call(this, request, ...rest);
};

// --------------------------------------------------- fake MongoDB models
const events = [];
let seq = 0;
const stub = (rel, exports) => {
  const file = path.join(SERVER, rel);
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('models/ChainEvent.js', {
  create: async (doc) => {
    const e = { _id: String(++seq).padStart(6, '0'), status: 'pending', attempts: 0, ...doc, save: async function () { return this; } };
    events.push(e);
    return e;
  },
  findOne: (f) => ({ sort: async () => events.filter((e) => e.status === f.status)[0] || null }),
  exists: async (f) =>
    events.some(
      (e) =>
        f.status.$in.includes(e.status) &&
        f.$or.some((c) => ('recordRef' in c && String(e.recordRef) === String(c.recordRef)) || ('patientRef' in c && String(e.patientRef) === String(c.patientRef)))
    ),
  countDocuments: async (f) => events.filter((e) => e.status === f.status).length,
});
const store = new Map();
stub('models/MedicalRecord.js', {
  updateOne: async (filter, update) => {
    const doc = store.get(filter._id);
    if (!doc) return { matchedCount: 0 };
    if (filter['chain.txHash'] && filter['chain.txHash'].$exists === false && doc.chain && doc.chain.txHash) return { matchedCount: 0 };
    doc.chain = { ...(doc.chain || {}), txHash: update.$set['chain.txHash'], anchoredAt: update.$set['chain.anchoredAt'] };
    return { matchedCount: 1 };
  },
});

const bc = require(path.join(SERVER, 'services/blockchainService.js'));
const outbox = require(path.join(SERVER, 'services/chainOutbox.js'));
const chain = require(path.join(SERVER, 'services/chainAnchors.js'));

// --------------------------------------------------------------- harness
let passed = 0, failed = 0;
const check = (name, ok) => { ok ? passed++ : failed++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`); };
const section = (t) => console.log('\n' + t);
const quiet = { warn: console.warn, error: console.error };
console.warn = () => {}; console.error = () => {};

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await outbox.processPending();
    if (!events.some((e) => e.status === 'pending') || S.down || S.paused) return;
  }
};
const newRecord = (n, patient) => {
  const r = { _id: 'rec' + String(n).padStart(21, '0'), patient, fileHash: sha('cipher-' + n) };
  store.set(r._id, r);
  return r;
};
const inOneHour = () => new Date((now() + 3600) * 1000);

const P = 'aaaa00000000000000000001', F = 'ffff00000000000000000001', F2 = 'ffff00000000000000000002';
const F3 = 'ffff00000000000000000003', D = 'dddd00000000000000000001', X = 'xxxx00000000000000000001';

(async () => {
  // ---------------------------------------------------------------- ids
  section('on-chain identifiers');
  const hex32 = /^0x[0-9a-f]{64}$/;
  check('record/user/link keys are 32-byte hex', [bc.recordKey(P), bc.userKey(P), bc.linkKey('h')].every((k) => hex32.test(k)));
  check('same input -> same key (deterministic)', bc.userKey(P) === bc.userKey(P));
  check('record, user and link namespaces never collide', new Set([bc.recordKey(P), bc.userKey(P), bc.linkKey(P)]).size === 3);
  const saltBefore = process.env.CHAIN_ID_SALT;
  const k1 = bc.userKey(P);
  process.env.CHAIN_ID_SALT = crypto.randomBytes(32).toString('hex');
  check('a different secret salt gives different ids (cannot be linked without it)', bc.userKey(P) !== k1);
  process.env.CHAIN_ID_SALT = saltBefore;
  check("action keys encode the word, zero padded to 32 bytes", bc.actionKey('download') === '0x' + Buffer.from('download').toString('hex').padEnd(64, '0'));
  check('missing settings are reported clearly', (() => { const v = process.env.RPC_URL; delete process.env.RPC_URL; try { bc.assertConfigured(); return false; } catch (e) { return /RPC_URL/.test(e.message); } finally { process.env.RPC_URL = v; } })());

  // --------------------------------------------------------- feature flags
  section('when the chain is off or the record is not anchored yet');
  const R = newRecord(1, P);
  check('record without a chain registration -> MongoDB check only', (await chain.gate(R, { user: P })).source === 'not-anchored');
  process.env.BLOCKCHAIN_ENABLED = 'false';
  const off = await chain.gate(R, { user: P });
  await chain.recordUploaded(R);
  check('BLOCKCHAIN_ENABLED=false -> allowed, nothing queued', off.ok && off.source === 'chain-disabled' && events.length === 0);
  process.env.BLOCKCHAIN_ENABLED = 'true';

  // ----------------------------------------------------------- upload flow
  section('upload -> registered on-chain');
  await chain.recordUploaded(R);
  await settle();
  check('register event was sent and marked done', events[0].type === 'register' && events[0].status === 'done');
  check('record now carries its transaction hash', Boolean(R.chain && /^0xtx/.test(R.chain.txHash)));
  check('owner passes the gate via the chain', (await chain.gate(R, { user: P })).source === 'chain');
  const stranger = await chain.gate(R, { user: X });
  check('stranger is denied (403)', !stranger.ok && stranger.status === 403);
  const tampered = await chain.gate({ ...R, fileHash: sha('something-else') }, { user: P });
  check('file whose hash differs from the chain is rejected (409)', !tampered.ok && tampered.status === 409);

  // ------------------------------------------------------------ family
  section('family access (one grant covers all records)');
  await chain.familyGranted(P, F);
  await settle();
  check('family member passes the gate', (await chain.gate(R, { user: F })).source === 'chain');
  const R2 = newRecord(2, P);
  await chain.recordUploaded(R2);
  await settle();
  check('...and also sees a record uploaded later, with no new grant', (await chain.gate(R2, { user: F })).ok);
  const R_other = newRecord(3, 'oooo00000000000000000001');
  await chain.recordUploaded(R_other);
  await settle();
  check("...but not another patient's record", !(await chain.gate(R_other, { user: F })).ok);
  await chain.familyRevoked(P, F);
  await settle();
  const afterRevoke = await chain.gate(R, { user: F });
  check('after revoke the family member is denied on every record', !afterRevoke.ok && !(await chain.gate(R2, { user: F })).ok);

  // ------------------------------------------------------------- doctor
  section('doctor share expires on its own');
  await chain.doctorGranted(R, D, inOneHour());
  await settle();
  check('doctor can open the shared record', (await chain.gate(R, { user: D })).ok);
  check('...but not a different record of that patient', !(await chain.gate(R2, { user: D })).ok);
  S.clock = 4000;
  check('after the expiry time passes the chain denies the doctor (no server action needed)', !(await chain.gate(R, { user: D })).ok);
  S.clock = 0;

  // ---------------------------------------------------------------- QR
  section('QR link is its own identity');
  await chain.linkCreated(R, 'tokenhash-A', inOneHour());
  await settle();
  check('valid link passes', (await chain.gate(R, { link: 'tokenhash-A' })).source === 'chain');
  check('a different token is denied', !(await chain.gate(R, { link: 'tokenhash-B' })).ok);
  await chain.linksRevoked(R, ['tokenhash-A']);
  await settle();
  check('revoked link is denied', !(await chain.gate(R, { link: 'tokenhash-A' })).ok);

  // -------------------------------------------------------------- outage
  section('chain outage: fall back to MongoDB, lose nothing');
  S.down = true;
  const during = await chain.gate(R, { user: P });
  check('chain unreachable -> request still allowed, marked mongo-fallback', during.ok && during.source === 'mongo-fallback');
  await chain.familyGranted(P, F2);
  await settle();
  const queued = events[events.length - 1];
  check('grant made during the outage stays queued (not lost, not failed)', queued.status === 'pending' && queued.attempts >= 1 && /ECONNREFUSED/.test(queued.lastError));
  S.down = false;
  const unsynced = await chain.gate(R, { user: F2 });
  check('chain back but queue not flushed yet -> allowed as mongo-unsynced (no false lock-out)', unsynced.ok && unsynced.source === 'mongo-unsynced');
  await settle();
  check('queue flushes automatically; the chain now confirms the grant', queued.status === 'done' && (await chain.gate(R, { user: F2 })).source === 'chain');

  // ------------------------------------------------------------ ordering
  section('events are applied strictly in order');
  S.down = true;
  await chain.familyGranted(P, F3);
  await chain.familyRevoked(P, F3);
  S.down = false;
  await settle();
  check('grant then revoke (queued offline) -> ends REVOKED', !(await chain.gate(R, { user: F3 })).ok);
  S.down = true;
  await chain.familyRevoked(P, F3);
  await chain.familyGranted(P, F3);
  S.down = false;
  await settle();
  check('revoke then grant (queued offline) -> ends GRANTED', (await chain.gate(R, { user: F3 })).ok);

  // ------------------------------------------------------- failure types
  section('permanent vs temporary failures');
  const before = events.length;
  await require(path.join(SERVER, 'services/chainOutbox.js')).enqueue('grantRecord', {
    recordRef: 'ghost00000000000000000001', patientRef: P,
    args: { recordId: bc.recordKey('ghost'), userId: bc.userKey(D), expiry: String(now() + 3600) },
  });
  await chain.familyGranted(P, 'ffff00000000000000000009');
  await settle();
  const ghost = events[before];
  check('a call the contract rejects (unknown record) is marked FAILED, not retried forever', ghost.status === 'failed');
  check('...and does not block the events queued after it', events[before + 1].status === 'done');
  const withFailure = await chain.gate(R, { user: X });
  check('a failed event makes that patient fall back to MongoDB (safe default) instead of locking people out', withFailure.ok && withFailure.source === 'mongo-unsynced');
  ghost.status = 'done'; // operator fixed it
  check('once the failed event is cleared the chain is authoritative again', !(await chain.gate(R, { user: X })).ok);

  S.paused = true;
  await chain.familyGranted(P, 'ffff00000000000000000008');
  await settle();
  const pausedEvent = events[events.length - 1];
  check('a PAUSED contract is treated as temporary: event waits, is not failed', pausedEvent.status === 'pending');
  S.paused = false;
  await settle();
  check('...and goes through after unpause', pausedEvent.status === 'done');

  // -------------------------------------------------------- idempotency
  section('safe to repeat');
  const R4 = newRecord(4, P);
  S.records.set(bc.recordKey(R4._id), { pid: bc.userKey(P), hash: '0x' + R4.fileHash }); // on-chain already, receipt lost
  await chain.recordUploaded(R4);
  await settle();
  check('re-registering an already-registered record counts as success', events[events.length - 1].status === 'done' && R4.chain && R4.chain.txHash === 'already-registered');
  const hashBefore = R.chain.txHash;
  await chain.recordUploaded(R);
  await settle();
  check('...and never overwrites a real transaction hash', R.chain.txHash === hashBefore);

  // ----------------------------------------------------------- audit log
  section('optional on-chain view log');
  const n = events.length;
  await chain.accessLogged(R, { user: P }, 'download');
  check('off by default (nothing queued)', events.length === n);
  process.env.CHAIN_LOG_VIEWS = 'true';
  await chain.accessLogged(R, { user: P }, 'download');
  await settle();
  check('CHAIN_LOG_VIEWS=true queues and sends a logAccess event', events.length === n + 1 && events[n].type === 'logAccess' && events[n].status === 'done');
  delete process.env.CHAIN_LOG_VIEWS;

  // -------------------------------------------------------- verify endpoint
  section('"verify on blockchain" endpoint');
  const v = await chain.verifyRecord(R, P);
  check('anchored + untouched: hash matches, owner recognised', v.anchored && v.hashMatchesChain === true && v.ownerRecognised === true && v.chainReachable === true);
  check('altered file is reported as not matching', (await chain.verifyRecord({ ...R, fileHash: sha('x') }, P)).hashMatchesChain === false);
  check('record never anchored is reported as such', (await chain.verifyRecord(newRecord(9, P), P)).anchored === false);
  S.down = true;
  check('node offline is reported, not crashed', (await chain.verifyRecord(R, P)).chainReachable === false);
  S.down = false;

  // ------------------------------------------------------------- privacy
  section('privacy: what is queued for the chain');
  const dump = JSON.stringify(events.map((e) => e.args));
  const rawIds = [P, F, F2, D, X, R._id, R2._id];
  check('no Mongo user/record id appears in any chain payload', rawIds.every((id) => !dump.includes(id)));
  check('no event payload contains anything but 0x-hex values and expiry numbers', events.every((e) => Object.values(e.args).every((v) => /^(0x[0-9a-f]{64}|\d+)$/.test(String(v)))));

  console.warn = quiet.warn; console.error = quiet.error;
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.warn = quiet.warn; console.error = quiet.error; console.error('TEST CRASHED:', err); process.exit(2); });
