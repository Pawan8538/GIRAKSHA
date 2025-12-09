const multer = require('multer');

const mlService = require('../services/ml.service');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const respond = (res, payload) => res.status(200).json(payload);

//In-memory storage for manual predictions (for heatmap visualization)
// Default mine location: Tamil Nadu Limestone Mine (Aligned with HeatmapMap)
const MINE_CENTER = { lat: 11.1053, lon: 79.1506 };
const manualPredictions = [];

const predict = async (req, res, next) => {
    try {
        const { slopeId, sensorData = {} } = req.body;
        const result = await mlService.predict({ slopeId, sensorData });
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

const detect = [
    upload.single('image'),
    async (req, res, next) => {
        try {
            const file = req.file || null;
            const imageUrl = req.body?.image_url || null;
            const result = await mlService.detect({ file, imageUrl });
            return respond(res, result);
        } catch (error) {
            next(error);
        }
    }
];

const forecast = async (req, res, next) => {
    try {
        const { slopeId } = req.body;
        const result = await mlService.forecast({ slopeId });
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

const explain = async (req, res, next) => {
    try {
        const { predictionId } = req.params;
        const { slopeId = null } = req.query;
        const result = await mlService.explain({ predictionId, slopeId });
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

const listPredictions = async (req, res, next) => {
    try {
        const result = await mlService.listPredictions();
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

const getCurrentRisk = async (req, res, next) => {
    try {
        const result = await mlService.getCurrentRisk();
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

const getRiskGrid = async (req, res, next) => {
    try {
        let result = await mlService.getRiskGrid();

        // If Python service is down or returns error, provide mock grid
        if (!result || !result.grid) {
            console.log("Using Mock Grid Fallback (Node.js)");
            // Align with HeatmapMap default center
            const center_lat = 11.1053;
            const center_lon = 79.1506;
            const grid = [];

            // Generate 5x5 mock grid
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    grid.push({
                        id: `mock_${i}_${j}`,
                        lat: center_lat + (i * 0.001),
                        lon: center_lon + (j * 0.001),
                        risk_score: 0.2 + (Math.abs(i) + Math.abs(j)) * 0.1, // Gradient
                        mine_proximity: 1.0,
                        sensor_influence: 0.5
                    });
                }
            }
            result = { grid };
        }

        // Include manual predictions in the grid
        if (result && result.grid) {
            // Filter stale manual predictions (> 1 hour old if needed, or keep all session based)
            // Here we just append all active ones
            const manuals = manualPredictions.map(mp => ({
                id: mp.id,
                lat: mp.lat,
                lon: mp.lon,
                risk_score: mp.risk_score,
                risk_level: mp.risk_level, // Pass this through if frontend needs it
                mine_proximity: 1.0,
                sensor_influence: 1.0, // High influence for manual test
                manual: true // Flag to identify manual predictions
            }));

            // Merge manuals: replace nearby grid points or append? 
            // Appending is safer for visualization
            result.grid = [...result.grid, ...manuals];
        }

        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

const getSensorStream = async (req, res, next) => {
    try {
        const result = await mlService.getSensorStream();
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

// Helper to calculate heuristic risk if ML service is mocking
const calculateHeuristicRisk = (sensorData) => {
    // 1. Displacement Risk (0-10mm range)
    const disp_val = (parseFloat(sensorData.disp_last) || 0) + (parseFloat(sensorData.disp_1h_mean) || 0);
    const risk_disp = Math.min(Math.abs(disp_val) / 5.0, 1.0) * 0.35;

    // 2. Pore Pressure Risk (0-50 kPa)
    const pore_val = parseFloat(sensorData.pore_kpa) || 0;
    const risk_pore = Math.min(Math.abs(pore_val) / 40.0, 1.0) * 0.25;

    // 3. Rainfall Risk (0-50 mm/h)
    const rain_val = parseFloat(sensorData.precip_mm_1h) || 0;
    const risk_rain = Math.min(Math.abs(rain_val) / 30.0, 1.0) * 0.25;

    // 4. Vibration Risk (0-1 g)
    const vib_val = parseFloat(sensorData.vibration_g) || 0;
    const risk_vib = Math.min(Math.abs(vib_val) / 0.2, 1.0) * 0.15;

    // Total Score
    let score = risk_disp + risk_pore + risk_rain + risk_vib;
    score = parseFloat(Math.min(Math.max(score, 0.05), 0.99).toFixed(4));

    let risk_level = "low";
    if (score > 0.75) risk_level = "imminent";
    else if (score > 0.6) risk_level = "high";
    else if (score > 0.35) risk_level = "medium";
    else if (score > 0.2) risk_level = "low";
    else risk_level = "safe"; // Extremely low risk

    return { score, risk_level };
};

const manualPredict = async (req, res, next) => {
    try {
        const { slopeId, sensorData, lat, lon } = req.body;

        // Validate required sensor parameters
        const requiredParams = [
            'disp_last', 'disp_1h_mean', 'disp_1h_std',
            'pore_kpa', 'vibration_g',
            'slope_deg', 'aspect_deg', 'curvature', 'roughness',
            'precip_mm_1h', 'temp_c'
        ];

        const missingParams = requiredParams.filter(param =>
            sensorData[param] === undefined || sensorData[param] === null
        );

        if (missingParams.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required sensor parameters: ${missingParams.join(', ')}`
            });
        }

        // Call ML service for prediction
        let prediction = await mlService.predict({ slopeId, sensorData });

        // Check if ML service returned a mock/default response or failed
        // Usually mock response has data.note or just specific static values
        // We will OVERRIDE with heuristic if it looks like a mock to ensure dynamic behavior
        const isMock = prediction.data?.note && prediction.data.note.includes('MOCK');

        let risk_score, risk_level;

        if (isMock || !prediction.ok) {
            // Apply heuristic locally to guarantee dynamic response
            const heuristic = calculateHeuristicRisk(sensorData);
            risk_score = heuristic.score;
            risk_level = heuristic.risk_level;

            // Patch the prediction object
            prediction = {
                ok: true,
                data: {
                    ...prediction.data,
                    risk_score,
                    risk_level,
                    note: "MOCK PREDICTION (Node.js Heuristic Override)"
                }
            };
        } else {
            risk_score = prediction.data.risk_score;
            risk_level = prediction.data.risk_level;
        }

        if (!prediction.ok || !prediction.data) {
            // Fallback if even heuristic failed somehow (unlikely)
            return res.status(500).json({
                success: false,
                message: 'ML prediction failed',
                error: prediction
            });
        }

        // Auto-generate alert if risk is high or critical
        let alert = null;
        if (risk_level === 'high' || risk_level === 'imminent') {
            const { createAlert } = require('../models/queries');

            const severityMap = {
                'imminent': 'critical',
                'high': 'high',
                'medium': 'medium',
                'low': 'low',
                'safe': 'low'
            };

            const messageMap = {
                'imminent': `CRITICAL: Imminent slope failure predicted (Risk Score: ${(risk_score * 100).toFixed(1)}%). Immediate evacuation recommended.`,
                'high': `HIGH RISK: Elevated slope instability detected (Risk Score: ${(risk_score * 100).toFixed(1)}%). Enhanced monitoring required.`,
                'medium': `MEDIUM RISK: Moderate slope instability (Risk Score: ${(risk_score * 100).toFixed(1)}%). Continue monitoring.`,
                'low': `LOW RISK: Minimal slope instability (Risk Score: ${(risk_score * 100).toFixed(1)}%). Normal operations.`,
                'safe': `SAFE: Conditions acceptable (Risk Score: ${(risk_score * 100).toFixed(1)}%).`
            };

            const alertData = await createAlert(
                null, // Use null for manual predictions since slopeId is a test string
                'ml_prediction',
                messageMap[risk_level] || messageMap['low'],
                severityMap[risk_level] || 'low'
            );

            alert = alertData.rows[0];
        }

        // Store manual prediction for heatmap visualization at exact location
        const manualPrediction = {
            id: `manual_${Date.now()}`,
            lat: lat || MINE_CENTER.lat,
            lon: lon || MINE_CENTER.lon,
            risk_score: risk_score,
            risk_level: risk_level,
            timestamp: new Date().toISOString(),
            sensorData: sensorData
        };

        manualPredictions.push(manualPrediction);

        // Keep only last 10 manual predictions
        if (manualPredictions.length > 10) {
            manualPredictions.shift();
        }

        return res.status(200).json({
            success: true,
            data: {
                prediction: prediction.data,
                alert: alert,
                coordinates: { lat: manualPrediction.lat, lon: manualPrediction.lon },
                message: alert
                    ? 'Prediction completed and alert generated'
                    : 'Prediction completed - no alert required'
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    predict,
    detect,
    forecast,
    explain,
    listPredictions,
    getCurrentRisk,
    getRiskGrid,
    getSensorStream,
    manualPredict
};
