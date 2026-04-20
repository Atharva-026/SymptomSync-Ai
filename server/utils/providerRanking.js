// Haversine formula — calculates distance between two coordinates in km
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

// Map bodySystem from AI to hospital specialization tags
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

// Score each hospital — transparent multi-signal ranking
function scoreHospital(hospital, userLat, userLng, bodySystem, budget) {
    let score = 0;

    // 1. Specialization relevance (0–30 points)
    const requiredSpecs = mapBodySystemToSpecialization(bodySystem);
    const hasSpec = hospital.specializations.some(s => requiredSpecs.includes(s));
    if (hasSpec) score += 30;

    // 2. Rating score (0–25 points)
    score += (hospital.rating / 5) * 25;

    // 3. NABH accreditation (0–15 points)
    if (hospital.nabh) score += 15;

    // 4. Distance score (0–20 points) — closer is better
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
        score += 5; // neutral if no budget specified
    }

    return {
        ...hospital,
        distance: Math.round(distance * 10) / 10,
        score: Math.round(score * 10) / 10,
        specializationMatch: hasSpec
    };
}

function rankProviders(hospitals, userLat, userLng, bodySystem, budget, limit = 5) {
    return hospitals
        .map(h => scoreHospital(h, userLat, userLng, bodySystem, budget))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

module.exports = { rankProviders, mapBodySystemToSpecialization };