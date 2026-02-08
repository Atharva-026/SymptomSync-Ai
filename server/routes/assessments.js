// File: server/routes/assessments.js
// Create this file for Tambo tool endpoints

const express = require('express');
const router = express.Router();

// POST /api/assessments/analyze
// Analyzes symptoms and returns possible conditions
router.post('/analyze', async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;

    console.log('🔍 Analyzing symptoms:', { symptoms, age, gender });

    // Mock analysis (replace with your Google Gemini API if you have it)
    const possibleConditions = [];
    const recommendations = [];

    // Simple keyword matching for demo
    const symptomsStr = symptoms.join(' ').toLowerCase();

    if (symptomsStr.includes('headache')) {
      possibleConditions.push('Tension headache', 'Migraine', 'Dehydration');
      recommendations.push('Stay hydrated', 'Rest in a dark room', 'Consider over-the-counter pain relief');
    }

    if (symptomsStr.includes('fever') || symptomsStr.includes('chills')) {
      possibleConditions.push('Viral infection', 'Flu', 'Common cold');
      recommendations.push('Monitor temperature', 'Rest', 'Stay hydrated', 'Consult doctor if fever persists >3 days');
    }

    if (symptomsStr.includes('chest') || symptomsStr.includes('breathing')) {
      possibleConditions.push('⚠️ Requires immediate medical attention');
      recommendations.push('🚨 SEEK EMERGENCY CARE', 'Call 911 or go to ER immediately');
    }

    if (symptomsStr.includes('abdom') || symptomsStr.includes('stomach')) {
      possibleConditions.push('Gastritis', 'Indigestion', 'Food intolerance', 'IBS');
      recommendations.push('Monitor symptoms', 'Avoid trigger foods', 'Stay hydrated', 'See doctor if pain worsens');
    }

    // Default fallback
    if (possibleConditions.length === 0) {
      possibleConditions.push('General discomfort');
      recommendations.push('Monitor symptoms', 'Consult a healthcare professional for accurate diagnosis');
    }

    res.json({
      possibleConditions,
      recommendations,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      possibleConditions: [],
      recommendations: ['Unable to analyze at this time. Please consult a healthcare professional.'],
      error: error.message
    });
  }
});

// POST /api/assessments/risk
// Calculates risk score based on symptoms, pain, duration, location
router.post('/risk', async (req, res) => {
  try {
    const { painLevel, duration, bodyPart, symptoms } = req.body;

    console.log('📊 Calculating risk:', { painLevel, duration, bodyPart, symptoms });

    let risk = 0;

    // Pain level impact (0-40 points)
    if (painLevel) {
      risk += Math.min(painLevel * 4, 40);
    }

    // Duration impact (0-20 points)
    if (duration) {
      const { amount, unit } = duration;
      if (unit === 'months') {
        risk += 20;
      } else if (unit === 'weeks') {
        risk += amount > 2 ? 20 : 15;
      } else if (unit === 'days') {
        risk += amount > 7 ? 15 : amount > 3 ? 10 : 5;
      } else if (unit === 'hours') {
        risk += amount > 24 ? 10 : 5;
      }
    }

    // Body part impact (0-20 points)
    if (bodyPart) {
      const partStr = typeof bodyPart === 'string' 
        ? bodyPart.toLowerCase() 
        : (bodyPart.name || bodyPart.id || '').toLowerCase();

      if (partStr.includes('chest')) risk += 20;
      else if (partStr.includes('head')) risk += 15;
      else if (partStr.includes('abdomen') || partStr.includes('stomach')) risk += 10;
      else risk += 5;
    }

    // Symptoms impact (0-20 points)
    if (symptoms && Array.isArray(symptoms)) {
      const highRiskSymptoms = [
        'chest pain', 'difficulty breathing', 'shortness of breath',
        'severe bleeding', 'loss of consciousness', 'confusion',
        'vision changes', 'severe headache', 'numbness'
      ];

      const hasHighRisk = symptoms.some(s => 
        highRiskSymptoms.some(hrs => s.toLowerCase().includes(hrs))
      );

      if (hasHighRisk) {
        risk += 20;
      } else {
        risk += Math.min(symptoms.length * 3, 15);
      }
    }

    // Cap at 100
    const finalRisk = Math.min(Math.round(risk), 100);

    // Determine risk level
    let riskLevel = 'low';
    if (finalRisk >= 80) riskLevel = 'emergency';
    else if (finalRisk >= 60) riskLevel = 'high';
    else if (finalRisk >= 40) riskLevel = 'moderate';

    const response = {
      riskScore: finalRisk,
      riskLevel,
      factors: [
        { factor: 'Pain Intensity', impact: painLevel ? 'high' : 'low' },
        { factor: 'Duration', impact: duration ? 'medium' : 'low' },
        { factor: 'Body Location', impact: bodyPart ? 'medium' : 'low' },
        { factor: 'Additional Symptoms', impact: symptoms?.length > 0 ? 'medium' : 'low' }
      ],
      calculatedAt: new Date().toISOString()
    };

    console.log('✅ Risk calculated:', response);

    res.json(response);

  } catch (error) {
    console.error('❌ Risk calculation error:', error);
    res.status(500).json({
      riskScore: 50,
      riskLevel: 'moderate',
      factors: [],
      error: error.message
    });
  }
});

module.exports = router;