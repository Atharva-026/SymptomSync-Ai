const express = require('express');
const {
  uploadRecord,
  getMyRecords,
  getRecord,
  downloadFile,
  createShareLink,
  revokeShareLinks,
  getRecordByToken,
  downloadSharedFile,
  shareWithDoctor,
  analyzeRecord,
  deleteRecord,
  getSharedRecords
} = require('../controllers/medicalRecordController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Patient routes. Family members with the uploadRecords / viewRecords
// permission use the same endpoints with a `patientId`; the controller checks it.
router
  .route('/')
  .get(protect, authorize('patient'), getMyRecords)
  .post(protect, authorize('patient'), upload.singleFile, uploadRecord);

// Shared records for doctors
router.get('/shared-with-me', protect, authorize('doctor'), getSharedRecords);

// Short-lived QR links (public until they expire; token is the credential)
router.get('/share/:token', optionalAuth, getRecordByToken);
router.get('/share/:token/file', downloadSharedFile);

// Specific record routes
router
  .route('/:id')
  .get(protect, getRecord)
  .delete(protect, authorize('patient'), deleteRecord);

// Decrypted file (owner, family with viewRecords, doctor it was shared with)
router.get('/:id/file', protect, downloadFile);

// Create / revoke QR links
router
  .route('/:id/share-link')
  .post(protect, authorize('patient'), createShareLink)
  .delete(protect, authorize('patient'), revokeShareLinks);

// Share with doctor
router.post('/:id/share', protect, authorize('patient'), shareWithDoctor);

// AI Analysis
router.post('/:id/analyze', protect, analyzeRecord);

module.exports = router;
