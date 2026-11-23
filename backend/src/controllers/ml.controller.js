const multer = require('multer');
const mlService = require('../services/ml.service');
const { createAlert } = require('../models/queries');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

const respond = (res, payload) => res.status(200).json(payload);

// In-memory storage for manual simulation predictions (for heatmap visualization)
const manualPredictions = [];

/**
 * Standardize risk classification matching Paper Table 3
 * Low: [0.00, 0.35), Medium: [0.35, 0.60), High: [0.60, 0.75), Imminent: [0.75, 1.00]
 */
const classifyRiskScore = (score) => {
    const s = Math.min(Math.max(parseFloat(score) || 0, 0), 1.0);
    if (s >= 0.75) return { score: s, level: 'imminent', severity: 'critical' };
    if (s >= 0.60) return { score: s, level: 'high', severity: 'high' };
    if (s >= 0.35) return { score: s, level: 'medium', severity: 'medium' };
    return { score: s, level: 'low', severity: 'low' };
};

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

        // Include manual testing predictions in the grid if present
        if (result && result.grid && manualPredictions.length > 0) {
            const manuals = manualPredictions.map(mp => ({
                id: mp.id,
                lat: mp.lat,
                lon: mp.lon,
                risk_score: mp.risk_score,
                risk_level: mp.risk_level,
                mine_proximity: 1.0,
                sensor_influence: 1.0,
                manual: true
            }));
            result = {
                ...result,
                grid: [...result.grid, ...manuals]
            };
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

/**
 * A* Pathfinding Evacuation Route Endpoint (Paper Section 4.2 & TC08)
 */
const getEvacuationRoute = async (req, res, next) => {
    try {
        const { workerId = 'worker_default', currentLocation, gridRow, gridCol } = req.body;
        const route = await mlService.getEvacuationRoute({
            workerId,
            currentLocation,
            gridRow: parseInt(gridRow ?? 12, 10),
            gridCol: parseInt(gridCol ?? 4, 10)
        });
        return respond(res, route);
    } catch (error) {
        next(error);
    }
};

/**
 * Anomaly Detection Endpoint (Paper Section 5.2: Robust Z-Score, CUSUM, Isolation Forest)
 */
const detectAnomalies = async (req, res, next) => {
    try {
        const { sensorId, readings = [] } = req.body;
        if (!sensorId) {
            return res.status(400).json({ ok: false, message: 'sensorId is required' });
        }
        const result = await mlService.detectAnomalies({ sensorId, readings });
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

/**
 * Thermal Camera Surveillance & Human Detection Status (Paper Section 4.1 & TC09)
 */
const getThermalStatus = async (req, res, next) => {
    try {
        const { cameraId } = req.query;
        const result = await mlService.getThermalStatus({ cameraId });
        return respond(res, result);
    } catch (error) {
        next(error);
    }
};

/**
 * Manual Rockfall Simulation / What-If Testing (Paper Table 3 thresholds)
 */
const manualPredict = async (req, res, next) => {
    try {
        const { slopeId = 'slope_1', sensorData = {}, lat, lon } = req.body;

        const prediction = await mlService.predict({ slopeId, sensorData });
        const risk_score = prediction.data?.risk_score ?? 0.35;
        const { level: risk_level, severity } = classifyRiskScore(risk_score);

        // Auto-generate emergency alert if risk reaches High or Imminent (Paper Section 4.3: score >= 0.60)
        let alert = null;
        if (risk_score >= 0.60) {
            const messageMap = {
                'imminent': `EMERGENCY (Score: ${(risk_score * 100).toFixed(1)}%): Imminent slope failure predicted. 15s evacuation order active.`,
                'high': `WARNING (Score: ${(risk_score * 100).toFixed(1)}%): High slope instability detected. Evacuation route dispatched.`
            };

            const alertData = await createAlert(
                null,
                'ml_prediction',
                messageMap[risk_level] || `High risk condition (${(risk_score * 100).toFixed(1)}%)`,
                severity
            );

            alert = alertData.rows[0];

            // If centralized socketService is active, trigger 15-second ACK protocol
            const socketService = req.app.get('socketService');
            if (socketService) {
                socketService.createAlert({
                    zone: 'Tamil Nadu Limestone Pit-Wall 1',
                    severity: risk_level === 'imminent' ? 3 : 2,
                    riskScore: risk_score,
                    source: 'MANUAL_SIMULATION'
                });
            }
        }

        const manualPrediction = {
            id: `manual_${Date.now()}`,
            lat: lat || mlService.MINE_CONTEXT.lat,
            lon: lon || mlService.MINE_CONTEXT.lon,
            risk_score,
            risk_level,
            timestamp: new Date().toISOString(),
            sensorData
        };

        manualPredictions.push(manualPrediction);
        if (manualPredictions.length > 10) manualPredictions.shift();

        return res.status(200).json({
            success: true,
            data: {
                prediction: {
                    ...prediction.data,
                    risk_score,
                    risk_level
                },
                alert,
                coordinates: { lat: manualPrediction.lat, lon: manualPrediction.lon },
                message: alert
                    ? 'Prediction executed: High/Imminent risk triggered 15-second emergency escalation window'
                    : 'Prediction executed: Normal stability monitored'
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
    getEvacuationRoute,
    detectAnomalies,
    getThermalStatus,
    manualPredict
};
