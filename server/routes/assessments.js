const express = require('express');
const {
  createAssessment,
  getAssessments,
  getAssessment
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('patient'), getAssessments)
  .post(protect, authorize('patient'), createAssessment);

router
  .route('/:id')
  .get(protect, getAssessment);

module.exports = router;