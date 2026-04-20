const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const { 
    createAssessment, 
    getAssessments, 
    getAssessment 
} = require('../controllers/assessmentController');

const auth = require('../middleware/auth');

// --- DATABASE OPERATIONS ---

router.post('/', auth, createAssessment);
router.get('/', auth, getAssessments);
router.get('/:id', auth, getAssessment);

// --- AI ANALYSIS ENDPOINT ---

router.post('/analyze', async (req, res) => {
    try {
        const { symptoms, age, gender, comorbidities } = req.body;

        const symptomsStr = (Array.isArray(symptoms) 
            ? symptoms.join(' ') 
            : symptoms || '').toLowerCase();

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a clinical triage assistant. You do NOT diagnose. You assess symptoms and provide risk guidance only. Always respond with valid JSON only, no extra text.'
                },
                {
                    role: 'user',
                    content: `
Patient Input: "${symptomsStr}"
Age: ${age || 'not provided'}
Gender: ${gender || 'not provided'}
Known Conditions: ${comorbidities || 'none'}

Your tasks:
1. Normalize the symptom.
2. Identify possible condition categories (NOT diagnosis).
3. Give a risk score 0-100.
4. Give recommendations.
5. Map to the most accurate ICD-10 code and provide the body system (e.g. Musculoskeletal, Cardiovascular).

Return ONLY this JSON:
{
  "normalizedSymptom": "",
  "icd10_code": "",
  "icd10_description": "",
  "bodySystem": "",
  "possibleConditions": [],
  "riskScore": 0,
  "riskLevel": "",
  "recommendations": [],
  "redFlags": [],
  "followUpQuestion": null,
  "confidence": 0.0,
  "disclaimer": "This is a risk assessment only. Consult a qualified doctor."
}

riskLevel must be: "low" (0-39) / "moderate" (40-74) / "high" (75-89) / "emergency" (90-100)`
                }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(completion.choices[0].message.content);

        res.json({
            ...parsed,
            analyzedAt: new Date()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'AI analysis failed',
            error: error.message
        });
    }
});

// --- AI RISK ENDPOINT ---

router.post('/risk', async (req, res) => {
    try {
        const { symptoms, painLevel, age, comorbidities } = req.body;

        const symptomsStr = (Array.isArray(symptoms) 
            ? symptoms.join(' ') 
            : symptoms || '').toLowerCase();

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a clinical risk assessment engine. No diagnosis, risk scoring only. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: `
Symptoms: "${symptomsStr}"
Pain Level (0-10): ${painLevel || 'not provided'}
Age: ${age || 'not provided'}
Known Conditions: ${comorbidities || 'none'}

Return ONLY this JSON:
{
  "riskScore": 0,
  "riskLevel": "",
  "confidence": 0.0,
  "factors": [],
  "calculatedAt": "${new Date().toISOString()}"
}

riskLevel must be: "low" / "moderate" / "high" / "emergency"`
                }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(completion.choices[0].message.content);

        res.json(parsed);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Risk calculation failed',
            error: error.message
        });
    }
});

module.exports = router;