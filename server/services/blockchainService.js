// server/services/blockchainService.js
//
// Low-level access to the MedicalRecordRegistry contract (ethers v6).
// Nothing here touches MongoDB. `ethers` is loaded lazily, so the server still
// starts normally when BLOCKCHAIN_ENABLED is not "true".
//
// Identity on-chain = HMAC(CHAIN_ID_SALT, "<kind>:<mongoId>"). The chain only
// ever sees these opaque 32-byte values, never a Mongo id, name or email.

const crypto = require('crypto');
const REGISTRY_ABI = require('../utils/registryAbi');

const NO_EXPIRY = '18446744073709551615'; // 2^64 - 1, same as the contract's NO_EXPIRY
const REQUIRED_ENV = ['RPC_URL', 'CHAIN_ID', 'CONTRACT_ADDRESS', 'OPERATOR_PRIVATE_KEY', 'CHAIN_ID_SALT'];

const isEnabled = () => process.env.BLOCKCHAIN_ENABLED === 'true';

/** Call at startup. Throws a clear message if the chain is enabled but misconfigured. */
function assertConfigured() {
  if (!isEnabled()) return;
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`BLOCKCHAIN_ENABLED=true but these are missing in .env: ${missing.join(', ')}`);
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.CHAIN_ID_SALT)) {
    throw new Error('CHAIN_ID_SALT must be 64 hex characters (32 bytes)');
  }
  if (!Number.isInteger(Number(process.env.CHAIN_ID))) {
    throw new Error('CHAIN_ID must be a number, e.g. 31337 for a local Hardhat node');
  }
}

// ------------------------------------------------------------ identifiers

const key = (kind, value) =>
  '0x' +
  crypto
    .createHmac('sha256', Buffer.from(process.env.CHAIN_ID_SALT, 'hex'))
    .update(`${kind}:${value}`)
    .digest('hex');

const recordKey = (recordMongoId) => key('record', String(recordMongoId));
// Patients, family members and doctors all share the "user" namespace, so a
// patient id used in registerRecord equals the same person's id in grants.
const userKey = (userMongoId) => key('user', String(userMongoId));
// A QR/share link is its own "user" on-chain, identified by its token hash.
const linkKey = (tokenHash) => key('link', tokenHash);
// "download" -> 0x646f776e6c6f6164000...0 (bytes32, zero padded)
const actionKey = (name) => '0x' + Buffer.from(name, 'utf8').toString('hex').padEnd(64, '0');

// --------------------------------------------------------------- contract

let contract = null;

function getContract() {
  if (contract) return contract;
  const { ethers } = require('ethers');

  const request = new ethers.FetchRequest(process.env.RPC_URL);
  request.timeout = 8000; // fail fast so requests fall back to MongoDB quickly when the node is down

  // A fixed chain id stops ethers from endlessly retrying "detect network" while offline
  const provider = new ethers.JsonRpcProvider(request, Number(process.env.CHAIN_ID), {
    staticNetwork: true,
  });
  const wallet = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, REGISTRY_ABI, wallet);
  return contract;
}

// ------------------------------------------------------------------ writes

/**
 * Send one queued event and wait for it to be mined.
 * @returns {Promise<string>} transaction hash
 */
async function send(type, args) {
  const c = getContract();
  let tx;
  switch (type) {
    case 'register':
      tx = await c.registerRecord(args.recordId, args.patientId, args.fileHash);
      break;
    case 'grantRecord':
      tx = await c.grantRecordAccess(args.recordId, args.userId, BigInt(args.expiry));
      break;
    case 'revokeRecord':
      tx = await c.revokeRecordAccess(args.recordId, args.userId);
      break;
    case 'grantPatient':
      tx = await c.grantPatientAccess(args.patientId, args.userId, BigInt(args.expiry));
      break;
    case 'revokePatient':
      tx = await c.revokePatientAccess(args.patientId, args.userId);
      break;
    case 'logAccess':
      tx = await c.logAccess(args.recordId, args.userId, args.action);
      break;
    default:
      throw Object.assign(new Error(`Unknown chain event type: ${type}`), { code: 'INVALID_ARGUMENT' });
  }
  const receipt = await tx.wait(1, 60000);
  return receipt.hash;
}

/**
 * Would retrying this error ever help?
 *  - A contract revert (bad expiry, unknown record, missing role...) will fail the same way every time -> permanent.
 *  - Network trouble, timeouts, an empty wallet, a paused contract -> transient, retry later.
 */
function isPermanentFailure(err) {
  if (!err) return false;
  if (err.revert && err.revert.name === 'EnforcedPause') return false;
  return err.code === 'CALL_EXCEPTION' || err.code === 'INVALID_ARGUMENT' || err.code === 'NUMERIC_FAULT';
}

// ------------------------------------------------------------------- reads

/** One RPC call: may `subjectKey` read this record, and does its hash match the chain? */
async function checkAccess(recordIdHex, subjectKey, fileHashHex) {
  const result = await getContract().checkAccess(recordIdHex, subjectKey, '0x' + fileHashHex);
  return { access: Boolean(result[0]), hashMatches: Boolean(result[1]) };
}

module.exports = {
  NO_EXPIRY,
  isEnabled,
  assertConfigured,
  recordKey,
  userKey,
  linkKey,
  actionKey,
  send,
  isPermanentFailure,
  checkAccess,
};
