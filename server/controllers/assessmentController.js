const Assessment = require('../models/Assessment');

// @desc    Create and save a new assessment
// @route   POST /api/assessments
exports.createAssessment = async (req, res) => {
    try {
        // Ensure the ID from the auth middleware is assigned to the 'patient' field
        const assessmentData = {
            ...req.body,
            patient: req.user.id 
        };

        const assessment = await Assessment.create(assessmentData);

        // Standardized response format
        res.status(201).json({
            success: true,
            data: assessment
        });
    } catch (error) {
        console.error('❌ Assessment Save Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save assessment to database',
            error: error.message
        });
    }
};

// @desc    Get all assessments for the logged-in user
// @route   GET /api/assessments
exports.getAssessments = async (req, res) => {
    try {
        const assessments = await Assessment.find({ patient: req.user.id }).sort('-createdAt');
        res.status(200).json({
            success: true,
            data: assessments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching assessments' });
    }
};

// @desc    Get a specific assessment
// @route   GET /api/assessments/:id
exports.getAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        
        if (!assessment) {
            return res.status(404).json({ success: false, message: 'Assessment not found' });
        }

        res.status(200).json({
            success: true,
            data: assessment
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};