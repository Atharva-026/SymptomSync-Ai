// server/services/recordKeys.js
//
// Granting / revoking a person's ability to decrypt a record means adding /
// removing a wrapped copy of the file key in record.keyGrants.

const MedicalRecord = require('../models/MedicalRecord');
const { wrapDek, unwrapDek } = require('../utils/crypto');

const idOf = (value) => (value && value._id ? value._id : value).toString();

/**
 * Re-wrap a record's file key for another user.
 * `record` must have been loaded with `+ownerWrappedKey`.
 */
function wrapFor(record, userId) {
  const dek = unwrapDek(record.ownerWrappedKey, idOf(record.patient), record._id);
  try {
    return wrapDek(dek, userId, record._id);
  } finally {
    dek.fill(0);
  }
}

/** Add or replace one user's grant on one record. Idempotent. */
async function upsertKeyGrant(recordId, userId, wrappedKey, expiresAt = null) {
  const set = {
    'keyGrants.$.wrappedKey': wrappedKey,
    'keyGrants.$.grantedAt': new Date(),
  };
  const update = { $set: set };
  if (expiresAt) set['keyGrants.$.expiresAt'] = expiresAt;
  else update.$unset = { 'keyGrants.$.expiresAt': '' };

  const updated = await MedicalRecord.updateOne(
    { _id: recordId, 'keyGrants.user': userId },
    update
  );
  if (updated.matchedCount > 0) return;

  const grant = { user: userId, wrappedKey, grantedAt: new Date() };
  if (expiresAt) grant.expiresAt = expiresAt;
  // The $ne guard stops a concurrent call from pushing a duplicate entry.
  await MedicalRecord.updateOne(
    { _id: recordId, 'keyGrants.user': { $ne: userId } },
    { $push: { keyGrants: grant } }
  );
}

/** Give a family member the key to every encrypted record the patient owns. */
async function grantAllRecords(patientId, memberId) {
  const records = await MedicalRecord.find({
    patient: patientId,
    encryptedFileId: { $exists: true },
    isPrivate: { $ne: true },
  }).select('+ownerWrappedKey');

  for (const record of records) {
    await upsertKeyGrant(record._id, memberId, wrapFor(record, memberId));
  }
  return records.length;
}

/** Remove a person's key from every record of this patient. */
async function revokeAllRecords(patientId, memberId) {
  const result = await MedicalRecord.updateMany(
    { patient: patientId },
    { $pull: { keyGrants: { user: memberId } } }
  );
  return result.modifiedCount;
}

module.exports = {
  idOf,
  wrapFor,
  upsertKeyGrant,
  grantAllRecords,
  revokeAllRecords,
};
