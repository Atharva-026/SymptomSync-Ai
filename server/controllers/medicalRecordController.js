const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { analyzeWithAI } = require('../services/aiAnalysisService');
const { encryptBuffer, wrapDek, sha256 } = require('../utils/crypto');
const { saveCiphertext, deleteCiphertext } = require('../utils/gridfs');
const { matchesDeclaredType } = require('../utils/fileSignature');
const {
  familyPermissionsFrom,
  getFamilyPermissions,
  resolveRecordAccess,
} = require('../services/recordAccess');
const { idOf, wrapFor, upsertKeyGrant } = require('../services/recordKeys');
const { readDecryptedFile } = require('../services/recordFiles');
const { logAccess } = require('../services/accessLog');
const chain = require('../services/chainAnchors');

const WITH_KEYS = '+ownerWrappedKey +keyGrants +encryption';
const DEFAULT_LINK_HOURS = 24;
const MAX_LINK_HOURS = 72;

// ---------------------------------------------------------------- helpers

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const clamp = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const laterOf = (a, b) => (a && a > b ? a : b);

/** Load a record by :id, answering 404 itself if it cannot be found. */
async function loadRecord(req, res, select) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    fail(res, 404, 'Medical record not found');
    return null;
  }
  let query = MedicalRecord.findById(req.params.id);
  if (select) query = query.select(select);
  const record = await query;
  if (!record) {
    fail(res, 404, 'Medical record not found');
    return null;
  }
  return record;
}

function sendFileError(res, err) {
  if (err.code === 'LEGACY') return fail(res, 410, err.message);
  if (err.code === 'INTEGRITY') return fail(res, 409, err.message);
  console.error('File error:', err);
  return fail(res, 500, 'Could not read the file');
}

function sendFile(res, record, buffer) {
  res.set({
    'Content-Type': record.fileType,
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(record.fileName)}`,
  });
  res.send(buffer);
}

const shareUrl = (token) =>
  `${process.env.CLIENT_URL || 'http://localhost:3000'}/records/view/${token}`;

async function findByShareToken(token) {
  if (!token || token.length < 20 || token.length > 128) return {};
  const tokenHash = sha256(token);
  const record = await MedicalRecord.findOne({
    'shareLinks.tokenHash': tokenHash,
  }).select(`+shareLinks ${WITH_KEYS}`);
  if (!record) return {};
  const link = record.shareLinks.find((l) => l.tokenHash === tokenHash);
  return { record, link };
}

// ----------------------------------------------------------------- upload

// @desc    Upload medical record (encrypted before it is stored)
// @route   POST /api/medical-records
// @access  Private (patient, or a family member with the uploadRecords permission
//          when `patientId` is sent)
exports.uploadRecord = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, 'Please upload a file');

    const { title, description, recordType, recordDate, tags } = req.body;
    const patientId = req.body.patientId || req.user.id;

    if (!title || !title.trim()) return fail(res, 400, 'Title is required');
    if (!MedicalRecord.schema.path('recordType').enumValues.includes(recordType)) {
      return fail(res, 400, 'Invalid record type');
    }
    if (!mongoose.isValidObjectId(patientId)) return fail(res, 400, 'Invalid patientId');
    if (!matchesDeclaredType(req.file.buffer, req.file.mimetype)) {
      return fail(res, 400, 'File content does not match its declared type');
    }

    const patient = await User.findById(patientId).select('role familyMembers privacySettings');
    if (!patient || patient.role !== 'patient') return fail(res, 404, 'Patient not found');

    // Who may upload: the patient themself, or an accepted family member with uploadRecords
    if (patientId === req.user.id) {
      if (req.user.role !== 'patient') return fail(res, 403, 'Only patients can upload records');
    } else {
      const perms = familyPermissionsFrom(patient, req.user.id);
      if (!perms || !perms.uploadRecords) {
        return fail(res, 403, 'You do not have permission to upload records for this patient');
      }
    }

    // Encrypt in memory, store only ciphertext
    const recordId = new mongoose.Types.ObjectId();
    const { ciphertext, dek, iv, authTag, fileHash } = encryptBuffer(
      req.file.buffer,
      recordId.toString()
    );
    const encryptedFileId = await saveCiphertext(ciphertext, `${recordId}.enc`);

    try {
      // Key for the patient, plus a key for every family member who may view records
      const keyGrants = patient.familyMembers
        .filter((f) => f.status === 'accepted' && f.permissions && f.permissions.viewRecords)
        .map((f) => ({ user: f.userId, wrappedKey: wrapDek(dek, f.userId, recordId) }));

      const record = await MedicalRecord.create({
        _id: recordId,
        patient: patientId,
        uploadedBy: req.user.id,
        title: title.trim(),
        description,
        recordType,
        recordDate: recordDate || new Date(),
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        encryptedFileId,
        encryption: {
          algo: 'aes-256-gcm',
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
        },
        fileHash,
        ownerWrappedKey: wrapDek(dek, patientId, recordId),
        keyGrants,
        tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      });

      await logAccess(record._id, {
        actor: req.user.id,
        via: patientId === req.user.id ? 'owner' : 'family',
        action: 'upload',
        req,
      });

      // Register the file's fingerprint + owner on the blockchain (queued, never blocks the upload)
      await chain.recordUploaded(record);

      res.status(201).json({ success: true, data: record });
    } catch (err) {
      // Do not leave orphaned ciphertext behind if saving the record failed
      await deleteCiphertext(encryptedFileId).catch(() => {});
      throw err;
    } finally {
      dek.fill(0);
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ------------------------------------------------------------------- list

// @desc    Get medical records of the logged-in patient, or of a patient the
//          caller has family access to (?patientId=)
// @route   GET /api/medical-records
// @access  Private
exports.getMyRecords = async (req, res) => {
  try {
    const targetId = req.query.patientId || req.user.id;
    const isOwner = targetId === req.user.id;
    const filter = { patient: targetId, isArchived: false };

    if (!isOwner) {
      if (!mongoose.isValidObjectId(targetId)) return fail(res, 400, 'Invalid patientId');
      const perms = await getFamilyPermissions(targetId, req.user.id);
      if (!perms || !perms.viewRecords) {
        return fail(res, 403, "You do not have access to this patient's records");
      }
      filter.isPrivate = { $ne: true };
    }

    let query = MedicalRecord.find(filter).populate('uploadedBy', 'name').sort('-uploadDate');
    query = isOwner
      ? query.populate('sharedWith.doctor', 'name email specialty')
      : query.select('-sharedWith');
    const records = await query;

    const body = { success: true, count: records.length, data: records };
    if (req.query.patientId) body.records = records; // shape the family dashboard expects
    res.status(200).json(body);
  } catch (error) {
    console.error('List records error:', error);
    fail(res, 500, 'Server error');
  }
};

// @desc    Get single medical record (metadata)
// @route   GET /api/medical-records/:id
// @access  Private
exports.getRecord = async (req, res) => {
  try {
    const record = await loadRecord(req, res, '+ownerWrappedKey +keyGrants');
    if (!record) return;

    const access = await resolveRecordAccess(record, req.user);
    if (!access.allowed) return fail(res, 403, 'Not authorized to view this record');

    await record.populate([
      { path: 'patient', select: 'name email gender' },
      { path: 'uploadedBy', select: 'name' },
      { path: 'sharedWith.doctor', select: 'name email specialty' },
    ]);

    const data = record.toJSON();
    if (access.via !== 'owner') delete data.sharedWith;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get record error:', error);
    fail(res, 500, 'Server error');
  }
};

// --------------------------------------------------------------- download

// @desc    Download / view the decrypted file
// @route   GET /api/medical-records/:id/file
// @access  Private (owner, family with viewRecords, doctor it was shared with)
exports.downloadFile = async (req, res) => {
  try {
    const record = await loadRecord(req, res, WITH_KEYS);
    if (!record) return;

    const access = await resolveRecordAccess(record, req.user);
    if (!access.allowed) return fail(res, 403, 'Not authorized to view this file');

    // Second gate: the blockchain must agree (falls back to MongoDB if the chain is down)
    const gate = await chain.gate(record, { user: req.user.id });
    if (!gate.ok) return fail(res, gate.status, gate.reason);

    const buffer = await readDecryptedFile(record, access.wrappedKey, access.keyUserId);

    await logAccess(record._id, {
      actor: req.user.id,
      via: access.via,
      action: 'download',
      req,
      meta: { chain: gate.source },
    });
    await chain.accessLogged(record, { user: req.user.id }, 'download');
    sendFile(res, record, buffer);
  } catch (error) {
    sendFileError(res, error);
  }
};

// ------------------------------------------------- short-lived QR / links

// @desc    Create a short-lived share link (rendered as a QR code by the client)
// @route   POST /api/medical-records/:id/share-link   body: { hours }
// @access  Private (patient who owns the record)
exports.createShareLink = async (req, res) => {
  try {
    const record = await loadRecord(req, res, '+shareLinks');
    if (!record) return;
    if (record.patient.toString() !== req.user.id) return fail(res, 403, 'Not authorized');
    if (!record.encryptedFileId) {
      return fail(res, 410, 'This record is not encrypted yet. Please upload it again before sharing.');
    }

    const hours = clamp(req.body.hours, 1, MAX_LINK_HOURS, DEFAULT_LINK_HOURS);
    const token = crypto.randomBytes(24).toString('base64url'); // 192 bits, shown once
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // Drop expired links while we are here; keep only the hash of the new one
    const tokenHash = sha256(token);
    record.shareLinks = (record.shareLinks || []).filter((l) => l.expiresAt > now);
    record.shareLinks.push({ tokenHash, expiresAt, createdBy: req.user.id });
    await record.save();

    // The contract itself will stop honouring this link at `expiresAt`
    await chain.linkCreated(record, tokenHash, expiresAt);

    await logAccess(record._id, {
      actor: req.user.id,
      via: 'owner',
      action: 'share-link-create',
      req,
      meta: { hours },
    });

    res.status(201).json({
      success: true,
      data: { token, url: shareUrl(token), expiresAt, hours },
    });
  } catch (error) {
    console.error('Create share link error:', error);
    fail(res, 500, 'Server error');
  }
};

// @desc    Revoke every active share link of a record
// @route   DELETE /api/medical-records/:id/share-link
// @access  Private (patient who owns the record)
exports.revokeShareLinks = async (req, res) => {
  try {
    const record = await loadRecord(req, res, '+shareLinks');
    if (!record) return;
    if (record.patient.toString() !== req.user.id) return fail(res, 403, 'Not authorized');

    const revokedHashes = (record.shareLinks || []).map((l) => l.tokenHash);
    await MedicalRecord.updateOne({ _id: record._id }, { $set: { shareLinks: [] } });
    await chain.linksRevoked(record, revokedHashes);
    await logAccess(record._id, {
      actor: req.user.id,
      via: 'owner',
      action: 'share-link-revoke',
      req,
    });

    res.status(200).json({ success: true, message: 'All share links revoked' });
  } catch (error) {
    console.error('Revoke share links error:', error);
    fail(res, 500, 'Server error');
  }
};

// A logged-in doctor who opens a link keeps access only for the link's lifetime
async function grantDoctorViaLink(record, doctorId, linkExpiry) {
  const existingGrant = (record.keyGrants || []).find((g) => g.user.toString() === doctorId);
  await upsertKeyGrant(
    record._id,
    doctorId,
    wrapFor(record, doctorId),
    laterOf(existingGrant && existingGrant.expiresAt, linkExpiry)
  );

  const share = record.sharedWith.find((s) => s.doctor && idOf(s.doctor) === doctorId);
  if (share) {
    await MedicalRecord.updateOne(
      { _id: record._id, 'sharedWith.doctor': doctorId },
      {
        $inc: { 'sharedWith.$.accessCount': 1 },
        $set: { 'sharedWith.$.accessExpiry': laterOf(share.accessExpiry, linkExpiry) },
      }
    );
  } else {
    await MedicalRecord.updateOne(
      { _id: record._id },
      {
        $push: {
          sharedWith: { doctor: doctorId, sharedAt: new Date(), accessExpiry: linkExpiry, accessCount: 1 },
        },
      }
    );
  }

  await chain.doctorGranted(record, doctorId, linkExpiry);
}

// @desc    Record details via share token (QR scan)
// @route   GET /api/medical-records/share/:token
// @access  Public until the link expires
exports.getRecordByToken = async (req, res) => {
  try {
    const { record, link } = await findByShareToken(req.params.token);
    if (!record) return fail(res, 404, 'Record not found or link expired');
    if (link.expiresAt <= new Date()) return fail(res, 410, 'This share link has expired');

    await MedicalRecord.updateOne(
      { _id: record._id, 'shareLinks.tokenHash': link.tokenHash },
      {
        $inc: { 'shareLinks.$.accessCount': 1 },
        $set: { 'shareLinks.$.lastAccessedAt': new Date() },
      }
    );

    if (req.user && req.user.role === 'doctor') {
      await grantDoctorViaLink(record, req.user.id, link.expiresAt);
    }

    const patient = await User.findById(record.patient).select('name');
    await logAccess(record._id, {
      actor: req.user && req.user.id,
      via: 'share-link',
      action: 'view',
      req,
    });

    // Anonymous viewers get only what the page needs - no email, no keys
    res.status(200).json({
      success: true,
      data: {
        _id: record._id,
        title: record.title,
        description: record.description,
        recordType: record.recordType,
        fileName: record.fileName,
        fileType: record.fileType,
        fileSize: record.fileSize,
        recordDate: record.recordDate,
        uploadDate: record.uploadDate,
        tags: record.tags,
        aiAnalysis: record.aiAnalysis,
        patient: { name: patient ? patient.name : undefined },
        shareExpiresAt: link.expiresAt,
      },
    });
  } catch (error) {
    console.error('Share token error:', error);
    fail(res, 500, 'Server error');
  }
};

// @desc    Decrypted file via share token
// @route   GET /api/medical-records/share/:token/file
// @access  Public until the link expires
exports.downloadSharedFile = async (req, res) => {
  try {
    const { record, link } = await findByShareToken(req.params.token);
    if (!record) return fail(res, 404, 'Record not found or link expired');
    if (link.expiresAt <= new Date()) return fail(res, 410, 'This share link has expired');

    // The QR link is its own identity on-chain; the contract knows when it expires
    const gate = await chain.gate(record, { link: link.tokenHash });
    if (!gate.ok) return fail(res, gate.status, gate.reason);

    const buffer = await readDecryptedFile(record, record.ownerWrappedKey, idOf(record.patient));

    await logAccess(record._id, { via: 'share-link', action: 'download', req, meta: { chain: gate.source } });
    await chain.accessLogged(record, { link: link.tokenHash }, 'download');
    sendFile(res, record, buffer);
  } catch (error) {
    sendFileError(res, error);
  }
};

// ------------------------------------------------------- share with doctor

// @desc    Share record with specific doctor
// @route   POST /api/medical-records/:id/share
// @access  Private (Patient only)
exports.shareWithDoctor = async (req, res) => {
  try {
    const { doctorId, accessDays } = req.body;

    if (!mongoose.isValidObjectId(doctorId)) return fail(res, 400, 'Invalid doctorId');
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' }).select('_id');
    if (!doctor) return fail(res, 404, 'Doctor not found');

    const record = await loadRecord(req, res, '+ownerWrappedKey');
    if (!record) return;
    if (record.patient.toString() !== req.user.id) return fail(res, 403, 'Not authorized');
    if (!record.encryptedFileId) {
      return fail(res, 410, 'This record is not encrypted yet. Please upload it again before sharing.');
    }

    const now = new Date();
    const existing = record.sharedWith.find((s) => idOf(s.doctor) === doctorId);
    if (existing && (!existing.accessExpiry || existing.accessExpiry > now)) {
      return fail(res, 400, 'Record already shared with this doctor');
    }

    const days = clamp(accessDays, 1, 365, 30);
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await upsertKeyGrant(record._id, doctorId, wrapFor(record, doctorId), expiry);
    await chain.doctorGranted(record, doctorId, expiry);

    if (existing) {
      // Previous share had expired: renew it
      await MedicalRecord.updateOne(
        { _id: record._id, 'sharedWith.doctor': doctorId },
        { $set: { 'sharedWith.$.accessExpiry': expiry, 'sharedWith.$.sharedAt': now } }
      );
    } else {
      await MedicalRecord.updateOne(
        { _id: record._id },
        { $push: { sharedWith: { doctor: doctorId, sharedAt: now, accessExpiry: expiry, accessCount: 0 } } }
      );
    }

    await logAccess(record._id, {
      actor: req.user.id,
      via: 'owner',
      action: 'share-doctor',
      req,
      meta: { doctorId, days },
    });

    const updated = await MedicalRecord.findById(record._id).populate(
      'sharedWith.doctor',
      'name email specialty'
    );
    res.status(200).json({ success: true, message: 'Record shared successfully', data: updated });
  } catch (error) {
    console.error('Share with doctor error:', error);
    fail(res, 500, 'Server error');
  }
};

// ------------------------------------------------------------ AI analysis

// @desc    Request AI analysis of medical record
// @route   POST /api/medical-records/:id/analyze
// @access  Private
exports.analyzeRecord = async (req, res) => {
  try {
    const record = await loadRecord(req, res, WITH_KEYS);
    if (!record) return;

    const access = await resolveRecordAccess(record, req.user);
    if (!access.allowed) return fail(res, 403, 'Not authorized');

    const gate = await chain.gate(record, { user: req.user.id });
    if (!gate.ok) return fail(res, gate.status, gate.reason);

    // If already analyzed, return existing analysis
    if (record.aiAnalysis && record.aiAnalysis.summary) {
      return res.status(200).json({
        success: true,
        data: record.aiAnalysis,
        message: 'Using cached analysis',
      });
    }

    // Decrypt in memory and hand the buffer to the analyzer
    const buffer = await readDecryptedFile(record, access.wrappedKey, access.keyUserId);
    const analysis = await analyzeWithAI(
      buffer,
      record.fileType,
      record.description || record.title,
      record.fileName
    );

    record.aiAnalysis = {
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      abnormalValues: analysis.abnormalValues,
      recommendations: analysis.recommendations,
      analyzedAt: new Date(),
      model: 'gemini-pro',
    };
    await record.save();

    await logAccess(record._id, { actor: req.user.id, via: access.via, action: 'analyze', req });

    res.status(200).json({ success: true, data: record.aiAnalysis });
  } catch (error) {
    if (error.code === 'LEGACY' || error.code === 'INTEGRITY') return sendFileError(res, error);
    console.error('AI Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze record',
    });
  }
};

// ----------------------------------------------------------------- delete

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Patient only)
exports.deleteRecord = async (req, res) => {
  try {
    const record = await loadRecord(req, res);
    if (!record) return;
    if (record.patient.toString() !== req.user.id) return fail(res, 403, 'Not authorized');

    if (record.encryptedFileId) {
      await deleteCiphertext(record.encryptedFileId).catch((err) =>
        console.error('Ciphertext delete failed:', err.message)
      );
    }

    // Legacy (pre-encryption) record: remove the old plaintext file if it is still there
    if (record.fileUrl) {
      const uploadsRoot = path.join(__dirname, '..', 'uploads');
      const legacyPath = path.join(__dirname, '..', record.fileUrl);
      if (legacyPath.startsWith(uploadsRoot) && fs.existsSync(legacyPath)) {
        fs.unlinkSync(legacyPath);
      }
    }

    await logAccess(record._id, { actor: req.user.id, via: 'owner', action: 'delete', req });
    await record.deleteOne();

    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    fail(res, 500, 'Server error');
  }
};

// @desc    Check a record against the blockchain (is its hash registered and unchanged?)
// @route   GET /api/medical-records/:id/chain
// @access  Private (patient who owns the record)
exports.verifyOnChain = async (req, res) => {
  try {
    const record = await loadRecord(req, res);
    if (!record) return;
    if (record.patient.toString() !== req.user.id) return fail(res, 403, 'Not authorized');

    const data = await chain.verifyRecord(record, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Chain verify error:', error);
    fail(res, 500, 'Server error');
  }
};

// @desc    Get records shared with logged in doctor
// @route   GET /api/medical-records/shared-with-me
// @access  Private (Doctor only)
exports.getSharedRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      sharedWith: {
        $elemMatch: { doctor: req.user.id, accessExpiry: { $gt: new Date() } },
      },
      isArchived: false,
    })
      .populate('patient', 'name email gender')
      .sort('-uploadDate');

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Shared records error:', error);
    fail(res, 500, 'Server error');
  }
};
