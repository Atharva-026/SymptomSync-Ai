const express = require('express');
const {
  uploadRecord,
  getMyRecords,
  getRecord,
  getRecordByToken,
  shareWithDoctor,
  analyzeRecord,
  deleteRecord,
  getSharedRecords
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Patient routes
router
  .route('/')
  .get(protect, authorize('patient'), getMyRecords)
  .post(protect, authorize('patient'), upload.single('file'), uploadRecord);

// Shared records for doctors
router.get('/shared-with-me', protect, authorize('doctor'), getSharedRecords);

// Share token route (public but validates if logged in)
router.get('/share/:token', getRecordByToken);

// Specific record routes
router
  .route('/:id')
  .get(protect, getRecord)
  .delete(protect, authorize('patient'), deleteRecord);

// Share with doctor
router.post('/:id/share', protect, authorize('patient'), shareWithDoctor);

// AI Analysis
router.post('/:id/analyze', protect, analyzeRecord);

module.exports = router;