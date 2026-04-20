const Groq = require('groq-sdk');
const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

// Sample reviews per hospital — in production these come from scraping/APIs
const hospitalReviews = {
    'H001': ['Excellent cardiac care, doctors very attentive', 'Long waiting time but treatment was world class', 'Best hospital in Mumbai for heart surgery'],
    'H002': ['Top notch facility, very clean and professional', 'Expensive but worth it for serious conditions', 'Saved my fathers life after cardiac arrest'],
    'H003': ['Good doctors but billing was confusing', 'Average experience, nothing exceptional', 'Decent care for orthopedic issues'],
    'H004': ['Old hospital but experienced doctors', 'Crowded and understaffed on weekends', 'Reasonable cost for the quality provided'],
    'H005': ['Quick response for emergencies', 'Staff was very caring and professional', 'Good cardiac unit'],
    'H006': ['World class facility in Gurgaon', 'Best oncology department in North India', 'Very expensive but exceptional doctors'],
    'H007': ['Best government hospital in India', 'Long queues but highly skilled doctors', 'Affordable and excellent care'],
    'H008': ['Good orthopedic department', 'Clean facility with modern equipment', 'Average post surgery care'],
    'H009': ['Excellent neurology team', 'Staff very professional and empathetic', 'Modern equipment and good hygiene'],
    'H010': ['Basic government hospital', 'Overcrowded but free treatment', 'Doctors are good but infrastructure is poor'],
    'H011': ['Best hospital in Pune for cardiac issues', 'Highly recommend for serious surgeries', 'Excellent ICU facilities'],
    'H012': ['Good for routine procedures', 'Friendly staff and clean rooms', 'Slightly expensive for mid tier'],
    'H013': ['Very good oncology department', 'Doctors explain everything clearly', 'Good value for money in Pune'],
    'H014': ['Government hospital with long waits', 'Free treatment but limited facilities', 'Basic care only'],
    'H015': ['Best option in Nagpur for cardiac', 'Good infrastructure for a tier 2 city', 'Responsive emergency team'],
    'H016': ['Good multispeciality coverage', 'Reasonable pricing and clean facility', 'Average post op care'],
    'H017': ['Government college hospital, basic but functional', 'Very affordable', 'Long waiting times'],
    'H018': ['Excellent transplant unit', 'World class neurology department', 'Premium pricing but justified'],
    'H019': ['Best value cardiac hospital in Bangalore', 'Highly skilled surgeons', 'Good affordable care'],
    'H020': ['Good for routine orthopedic cases', 'Small hospital but attentive staff', 'Average overall'],
    'H021': ['Best transplant center in South India', 'Excellent post surgery care', 'Very professional team'],
    'H022': ['Apollo brand lives up to reputation', 'Excellent oncology team in Chennai', 'Expensive but very reliable'],
    'H023': ['Oldest government hospital in India', 'Overcrowded but skilled doctors', 'Free treatment available'],
    'H024': ['Good cardiac and orthopedic dept', 'Modern facility in Hyderabad', 'Slightly long waiting times'],
    'H025': ['Good gastroenterology unit', 'Reasonable pricing', 'Professional and clean'],
    'H026': ['Basic government hospital', 'Long queues, average care', 'Free treatment only advantage'],
    'H027': ['Good cardiac unit in Ahmedabad', 'Reasonable pricing for services', 'Clean and professional'],
    'H028': ['Apollo standard maintained', 'Good oncology department', 'Premium pricing'],
    'H029': ['Very basic government hospital', 'Long waits and crowded', 'Only go if budget is critical'],
    'H030': ['Best institute in North India', 'Highly skilled research doctors', 'Long waiting list for surgeries'],
};

// Haversine formula
function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapBodySystemToSpecialization(bodySystem) {
    const mapping = {
        'Cardiovascular': ['Cardiovascular', 'Cardiology'],
        'Musculoskeletal': ['Orthopedics', 'General Medicine'],
        'Neurology': ['Neurology'],
        'Oncology': ['Oncology'],
        'Respiratory': ['General Medicine', 'Cardiovascular'],
        'Gastroenterology': ['Gastroenterology', 'General Medicine'],
        'Transplant': ['Transplant'],
        'General': ['General Medicine'],
    };
    return mapping[bodySystem] || ['General Medicine'];
}

// Groq sentiment analysis on reviews
async function getSentimentScore(hospitalId) {
    const reviews = hospitalReviews[hospitalId];
    if (!reviews || reviews.length === 0) return { score: 0.5, summary: 'No reviews available' };

    try {
        const completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a sentiment analysis engine for hospital reviews. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: `
Analyze these hospital reviews and return a sentiment score:

Reviews:
${reviews.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

Return ONLY this JSON:
{
  "sentimentScore": 0.0,
  "positiveThemes": [],
  "negativeThemes": [],
  "summary": ""
}

sentimentScore must be 0.0 to 1.0 where:
0.0-0.3 = mostly negative
0.4-0.6 = mixed
0.7-1.0 = mostly positive`
                }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
        return { sentimentScore: 0.5, summary: 'Sentiment analysis unavailable' };
    }
}

// Score each hospital
async function scoreHospital(hospital, userLat, userLng, bodySystem, budget) {
    let score = 0;

    // 1. Specialization relevance (0–25 points)
    const requiredSpecs = mapBodySystemToSpecialization(bodySystem);
    const hasSpec = hospital.specializations.some(s => requiredSpecs.includes(s));
    if (hasSpec) score += 25;

    // 2. Rating score (0–20 points)
    score += (hospital.rating / 5) * 20;

    // 3. NABH accreditation (0–15 points)
    if (hospital.nabh) score += 15;

    // 4. Distance score (0–20 points)
    const distance = getDistanceKm(userLat, userLng, hospital.lat, hospital.lng);
    const distanceScore = Math.max(0, 20 - (distance / 5));
    score += distanceScore;

    // 5. Affordability match (0–10 points)
    if (budget) {
        const tierMatch = {
            'low': ['budget'],
            'medium': ['budget', 'mid'],
            'high': ['budget', 'mid', 'premium']
        };
        if (tierMatch[budget]?.includes(hospital.tier)) score += 10;
    } else {
        score += 5;
    }

    // 6. NLP Sentiment Score (0–10 points) ← NEW
    const sentiment = await getSentimentScore(hospital.id);
    const sentimentPoints = (sentiment.sentimentScore || 0.5) * 10;
    score += sentimentPoints;

    return {
        ...hospital,
        distance: Math.round(distance * 10) / 10,
        score: Math.round(score * 10) / 10,
        specializationMatch: hasSpec,
        sentiment: {
            score: sentiment.sentimentScore,
            summary: sentiment.summary,
            positiveThemes: sentiment.positiveThemes || [],
            negativeThemes: sentiment.negativeThemes || []
        }
    };
}

async function rankProviders(hospitals, userLat, userLng, bodySystem, budget, limit = 5) {
    const scored = await Promise.all(
        hospitals.map(h => scoreHospital(h, userLat, userLng, bodySystem, budget))
    );
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

module.exports = { rankProviders, mapBodySystemToSpecialization };