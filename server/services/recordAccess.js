// server/services/recordAccess.js
//
// The single place that decides "may this user read this record, and with
// which wrapped key?". Used by view, download and AI-analysis endpoints.

const User = require('../models/User');
const { idOf, wrapFor, upsertKeyGrant } = require('./recordKeys');

const DENIED = { allowed: false };

/** Permissions a family member currently holds on a patient (null if none). */
function familyPermissionsFrom(patient, userId) {
  if (!patient || !Array.isArray(patient.familyMembers)) return null;
  if (patient.privacySettings && patient.privacySettings.allowFamilyAccess === false) {
    return null;
  }
  const entry = patient.familyMembers.find(
    (fm) =>
      fm.userId &&
      fm.userId.toString() === userId.toString() &&
      fm.status === 'accepted'
  );
  return entry ? entry.permissions : null;
}

async function getFamilyPermissions(patientId, userId) {
  const patient = await User.findById(patientId).select('familyMembers privacySettings');
  return familyPermissionsFrom(patient, userId);
}

/**
 * @param record  MedicalRecord loaded with '+ownerWrappedKey +keyGrants'
 * @param user    req.user ({ id, role })
 * @returns {{allowed:boolean, via?:string, wrappedKey?:string, keyUserId?:string}}
 */
async function resolveRecordAccess(record, user) {
  const uid = user.id;
  const ownerId = idOf(record.patient);
  const now = new Date();

  if (ownerId === uid) {
    return { allowed: true, via: 'owner', wrappedKey: record.ownerWrappedKey, keyUserId: uid };
  }

  if (!record.encryptedFileId || !record.ownerWrappedKey) return DENIED;

  const grant = (record.keyGrants || []).find(
    (g) => g.user.toString() === uid && (!g.expiresAt || g.expiresAt > now)
  );

  // Doctors: need a key grant AND an unexpired share entry.
  const doctorShare = (record.sharedWith || []).find(
    (s) => s.doctor && idOf(s.doctor) === uid && (!s.accessExpiry || s.accessExpiry > now)
  );
  if (user.role === 'doctor' && doctorShare && grant) {
    return { allowed: true, via: 'doctor', wrappedKey: grant.wrappedKey, keyUserId: uid };
  }

  // Family: the live relationship in the User collection is authoritative, so
  // revoking or editing permissions takes effect immediately.
  if (!record.isPrivate) {
    const perms = await getFamilyPermissions(ownerId, uid);
    if (perms && perms.viewRecords) {
      if (grant) {
        return { allowed: true, via: 'family', wrappedKey: grant.wrappedKey, keyUserId: uid };
      }
      // Permission is valid but the grant is missing (e.g. uploaded after the
      // invite was accepted, or an earlier grant write failed): create it now.
      const wrappedKey = wrapFor(record, uid);
      upsertKeyGrant(record._id, uid, wrappedKey, null).catch((err) =>
        console.error('Self-heal key grant failed:', err.message)
      );
      return { allowed: true, via: 'family', wrappedKey, keyUserId: uid };
    }
  }

  return DENIED;
}

module.exports = { familyPermissionsFrom, getFamilyPermissions, resolveRecordAccess };
