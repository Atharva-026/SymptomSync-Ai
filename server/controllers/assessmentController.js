const Assessment = require('../models/Assessment');
const Appointment = require('../models/Appointment');
const Conversation = require('../models/Conversation');

// @desc    Create and save a new assessment
// @route   POST /api/assessments
exports.createAssessment = async (req, res) => {
  try {
    const { symptoms, riskLevel, isEmergency, conversationId, shareBrief } = req.body;

    // Only these fields are accepted from the client. The doctor brief is never
    // taken from the request: it is copied from the patient's saved conversation.
    const data = {
      patient: req.user.id,
      riskLevel: Math.min(Math.max(Number(riskLevel) || 0, 0), 100),
      isEmergency: isEmergency === true
    };
    if (typeof symptoms === 'string' && symptoms.trim()) {
      data.symptoms = symptoms.trim().slice(0, 300);
    }

    if (conversationId) {
      const conversation = await Conversation.findOne({ _id: conversationId, patient: req.user.id });
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      data.conversation = conversation._id;

      if (shareBrief === true) {
        if (!conversation.brief || conversation.briefMessageCount !== conversation.messages.length) {
          return res.status(409).json({
            success: false,
            message: 'Your chat summary is out of date. Please go back and review it again.'
          });
        }
        data.brief = conversation.brief;
        data.briefSharedAt = new Date();
      }
    }

    const assessment = await Assessment.create(data);
    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid conversation' });
    }
    console.error('Assessment save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save assessment' });
  }
};

// @desc    Get all assessments for the logged-in user
// @route   GET /api/assessments
exports.getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ patient: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching assessments' });
  }
};

// @desc    Get a specific assessment (the patient, or the doctor on its appointment)
// @route   GET /api/assessments/:id
exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const isOwner = assessment.patient.toString() === req.user.id;
    let isTreatingDoctor = false;
    if (!isOwner && req.user.role === 'doctor') {
      isTreatingDoctor = !!(await Appointment.exists({ assessment: assessment._id, doctor: req.user.id }));
    }
    if (!isOwner && !isTreatingDoctor) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this assessment' });
    }

    res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};