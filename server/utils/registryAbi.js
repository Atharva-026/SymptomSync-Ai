// server/utils/registryAbi.js
//
// Human-readable ABI of blockchain/contracts/MedicalRecordRegistry.sol, used
// by the backend (ethers v6). blockchain/test/MedicalRecordRegistry.test.js has
// a test that compares every entry against the compiled contract, so if the
// contract and this file ever drift apart, `npx hardhat test` fails.

module.exports = [
  // writes (operator only)
  'function registerRecord(bytes32 recordId, bytes32 patientId, bytes32 fileHash)',
  'function grantRecordAccess(bytes32 recordId, bytes32 userId, uint64 expiry)',
  'function revokeRecordAccess(bytes32 recordId, bytes32 userId)',
  'function grantPatientAccess(bytes32 patientId, bytes32 userId, uint64 expiry)',
  'function revokePatientAccess(bytes32 patientId, bytes32 userId)',
  'function logAccess(bytes32 recordId, bytes32 userId, bytes32 action)',

  // reads
  'function hasAccess(bytes32 recordId, bytes32 userId) view returns (bool)',
  'function verifyHash(bytes32 recordId, bytes32 fileHash) view returns (bool)',
  'function checkAccess(bytes32 recordId, bytes32 userId, bytes32 fileHash) view returns (bool access, bool hashMatches)',
  'function getRecord(bytes32 recordId) view returns (bytes32 patientId, bytes32 fileHash, uint64 createdAt)',

  // errors (so failures decode into readable names)
  'error RecordExists()',
  'error RecordNotFound()',
  'error BadExpiry()',
  'error ZeroValue()',
  'error EnforcedPause()',
  'error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)',
];
