const express = require('express');
const router = express.Router();
const { 
    createAssessment, 
    getAssessments, 
    getAssessment 
} = require('../controllers/assessmentController');
const auth = require('../middleware/auth');

// --- DATABASE OPERATIONS (Required for BookingInterface) ---

// POST /api/assessments -> Saves the actual data to MongoDB
router.post('/', auth, createAssessment);

// GET /api/assessments -> Gets history for the patient
router.get('/', auth, getAssessments);

// GET /api/assessments/:id -> Gets a specific report
router.get('/:id', auth, getAssessment);


// --- AI TOOL ENDPOINTS (For Tambo SDK Logic) ---

// POST /api/assessments/analyze
router.post('/analyze', async (req, res) => {
    try {
        const { symptoms } = req.body;
        const symptomsStr = (Array.isArray(symptoms) ? symptoms.join(' ') : symptoms || '').toLowerCase();
        
        const possibleConditions = [];
        const recommendations = [];

        if (symptomsStr.includes('headache')) {
            possibleConditions.push('Tension headache', 'Migraine');
            recommendations.push('Stay hydrated', 'Rest in a dark room');
        } else if (symptomsStr.includes('chest')) {
            possibleConditions.push('Cardiac concern');
            recommendations.push('🚨 SEEK EMERGENCY CARE');
        } else {
            possibleConditions.push('General discomfort');
            recommendations.push('Monitor symptoms', 'Consult a doctor');
        }

        res.json({ possibleConditions, recommendations, analyzedAt: new Date() });
    } catch (error) {
        res.status(500).json({ message: 'Analysis failed', error: error.message });
    }
});

// POST /api/assessments/risk
router.post('/risk', async (req, res) => {
    try {
        const { painLevel, symptoms } = req.body;
        let risk = (painLevel || 0) * 5 + (symptoms?.length || 0) * 5;
        const finalRisk = Math.min(risk, 100);
        
        res.json({
            riskScore: finalRisk,
            riskLevel: finalRisk >= 80 ? 'emergency' : finalRisk >= 40 ? 'moderate' : 'low',
            calculatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Risk calculation failed' });
    }
});

module.exports = router;