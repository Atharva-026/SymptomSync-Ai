const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const { rankProviders } = require('../utils/providerRanking');

// ✅ NEW: Groq + CGHS
const Groq = require('groq-sdk');
const cghsRates = require('../data/cghsRates.json');

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

// City coordinates lookup
const cityCoords = {
    'mumbai':    { lat: 19.0760, lng: 72.8777 },
    'delhi':     { lat: 28.6139, lng: 77.2090 },
    'pune':      { lat: 18.5204, lng: 73.8567 },
    'nagpur':    { lat: 21.1458, lng: 79.0882 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'chennai':   { lat: 13.0827, lng: 80.2707 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'chandigarh':{ lat: 30.7333, lng: 76.7794 },
};

// GET /api/providers
router.get('/', async (req, res) => {
    try {
        const { city, bodySystem, budget, limit, lat, lng } = req.query;

        let userLat, userLng;

        if (lat && lng) {
            userLat = parseFloat(lat);
            userLng = parseFloat(lng);
        } else if (city) {
            const coords = cityCoords[city.toLowerCase()];
            if (!coords) {
                return res.status(400).json({
                    message: `City "${city}" not found. Supported: ${Object.keys(cityCoords).join(', ')}`
                });
            }
            userLat = coords.lat;
            userLng = coords.lng;
        } else {
            return res.status(400).json({ message: 'Provide city or lat/lng query params' });
        }

        const cityName = city?.toLowerCase();

        let pool = cityName
            ? hospitals.filter(h => h.city.toLowerCase() === cityName)
            : hospitals;

        if (pool.length < 3) pool = hospitals;

        const ranked = await rankProviders(
            pool,
            userLat,
            userLng,
            bodySystem || 'General',
            budget || null,
            parseInt(limit) || 5
        );

        res.json({
            query: { city, bodySystem, budget },
            totalFound: ranked.length,
            providers: ranked.map(h => ({
                id: h.id,
                name: h.name,
                city: h.city,
                distance: `${h.distance} km`,
                rating: h.rating,
                tier: h.tier,
                nabh: h.nabh,
                specializations: h.specializations,
                specializationMatch: h.specializationMatch,
                rankScore: h.score,
                contact: h.contact,
                estimatedCostTier:
                    h.tier === 'premium' ? 'High' :
                    h.tier === 'mid' ? 'Medium' : 'Low'
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Provider search failed',
            error: error.message
        });
    }
});


// =========================
// 💰 COST ESTIMATION ROUTE
// =========================

// City tier mapping
const cityTiers = {
    'mumbai': 'metro', 'delhi': 'metro', 'bangalore': 'metro',
    'chennai': 'metro', 'hyderabad': 'metro', 'kolkata': 'metro',
    'pune': 'tier2', 'ahmedabad': 'tier2', 'chandigarh': 'tier2',
    'nagpur': 'tier2', 'jaipur': 'tier2', 'lucknow': 'tier2',
    'patna': 'tier3', 'bhopal': 'tier3', 'indore': 'tier3',
    'varanasi': 'tier3', 'agra': 'tier3'
};

// Geographic multipliers
const geoMultiplier = {
    'metro': { min: 1.3, max: 1.5 },
    'tier2': { min: 1.0, max: 1.2 },
    'tier3': { min: 0.7, max: 0.9 }
};


// POST /api/providers/cost-estimate
router.post('/cost-estimate', async (req, res) => {
    try {
        const { procedure, city, age, comorbidities, hospitalTier } = req.body;

        if (!procedure) {
            return res.status(400).json({ message: 'procedure is required' });
        }

        const cityKey = (city || 'pune').toLowerCase();
        const tier = cityTiers[cityKey] || 'tier2';
        const multiplier = geoMultiplier[tier];

        // Find CGHS base rate
        const procedureKey = Object.keys(cghsRates.procedures).find(k =>
            procedure.toLowerCase().includes(k) ||
            k.includes(procedure.toLowerCase())
        );

        const baseRate = procedureKey
            ? cghsRates.procedures[procedureKey]
            : null;

        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a healthcare cost estimation assistant for India. Use CGHS rates. JSON only.'
                },
                {
                    role: 'user',
                    content: `
Procedure: "${procedure}"
City: ${city || 'not specified'} (Tier: ${tier})
Age: ${age || 'not specified'}
Comorbidities: ${comorbidities || 'none'}
Hospital Tier: ${hospitalTier || 'mid'}

${baseRate ? `
CGHS Reference:
₹${baseRate.baseMin} – ₹${baseRate.baseMax}
Stay: ${baseRate.stayDays.min}-${baseRate.stayDays.max} days
ICU: ${baseRate.icuLikelihood}
` : ''}

Multiplier: ${multiplier.min}x – ${multiplier.max}x

Return JSON:
{
  "procedure": "",
  "city": "",
  "cityTier": "",
  "hospitalTier": "",
  "breakdown": {
    "procedureCost": { "min": 0, "max": 0 },
    "doctorFees": { "min": 0, "max": 0 },
    "hospitalStay": {
      "days": { "min": 0, "max": 0 },
      "roomType": "",
      "cost": { "min": 0, "max": 0 }
    },
    "diagnostics": { "min": 0, "max": 0 },
    "medicines": { "min": 0, "max": 0 },
    "contingency": { "min": 0, "max": 0 }
  },
  "totalEstimate": { "min": 0, "max": 0 },
  "comorbidityImpact": [],
  "confidenceScore": 0.0,
  "notes": [],
  "disclaimer": ""
}`
                }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        let parsed;

        try {
            parsed = JSON.parse(completion.choices[0].message.content);
        } catch {
            return res.status(500).json({ message: "Invalid AI response" });
        }

        res.json({
            ...parsed,
            dataSource: 'CGHS + geo + AI',
            estimatedAt: new Date()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Cost estimation failed',
            error: error.message
        });
    }
});

module.exports = router;