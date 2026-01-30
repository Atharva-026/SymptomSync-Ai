const Assessment = require('../models/Assessment');

// @desc    Create assessment
// @route   POST /api/assessments
// @access  Private (Patient only)
exports.createAssessment = async (req, res) => {
  try {
    const assessmentData = {
      patient: req.user.id,
      ...req.body
    };

    const assessment = await Assessment.create(assessmentData);

    res.status(201).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all assessments for logged in patient
// @route   GET /api/assessments
// @access  Private (Patient only)
exports.getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ patient: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single assessment
// @route   GET /api/assessments/:id
// @access  Private
exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if user owns this assessment
    if (assessment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this assessment'
      });
    }

    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};