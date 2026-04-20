const express = require('express');
const router = express.Router();
const hospitals = require('../data/hospitals.json');
const { rankProviders } = require('../utils/providerRanking');

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

// GET /api/providers?city=mumbai&bodySystem=Cardiovascular&budget=medium&limit=5
router.get('/', (req, res) => {
    try {
        const { city, bodySystem, budget, limit, lat, lng } = req.query;

        // Resolve coordinates
        let userLat, userLng;
        if (lat && lng) {
            userLat = parseFloat(lat);
            userLng = parseFloat(lng);
        } else if (city) {
            const coords = cityCoords[city.toLowerCase()];
            if (!coords) {
                return res.status(400).json({ message: `City "${city}" not found. Supported: ${Object.keys(cityCoords).join(', ')}` });
            }
            userLat = coords.lat;
            userLng = coords.lng;
        } else {
            return res.status(400).json({ message: 'Provide city or lat/lng query params' });
        }

        // Filter to same city first, fall back to all if too few
        const cityName = city?.toLowerCase();
        let pool = cityName
            ? hospitals.filter(h => h.city.toLowerCase() === cityName)
            : hospitals;

        if (pool.length < 3) pool = hospitals;

        const ranked = rankProviders(
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
                estimatedCostTier: h.tier === 'premium' ? 'High' : h.tier === 'mid' ? 'Medium' : 'Low'
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Provider search failed', error: error.message });
    }
});

module.exports = router;