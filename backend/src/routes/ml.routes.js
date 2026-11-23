const express = require('express');

const mlController = require('../controllers/ml.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const mlAccess = [requireAuth, requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY')];
const siteAdminOnly = [requireAuth, requireRole('SITE_ADMIN', 'SUPER_ADMIN')];

// Core Prediction & Forecasting
router.post('/predict', ...mlAccess, mlController.predict);
router.post('/manual-predict', ...siteAdminOnly, mlController.manualPredict);
router.post('/forecast', mlController.forecast);
router.post('/detect', ...mlAccess, ...mlController.detect);
router.get('/explain/:predictionId', ...mlAccess, mlController.explain);
router.get('/predictions', ...mlAccess, mlController.listPredictions);

// Spatial Risk Grid (20×20 IDW) & Live Sensor Stream
router.get('/risk/current', ...mlAccess, mlController.getCurrentRisk);
router.get('/risk/grid', ...mlAccess, mlController.getRiskGrid);
router.get('/sensors/stream', ...mlAccess, mlController.getSensorStream);

// Novel GIRAKSHA Research Endpoints (Paper Sections 4.1, 4.2 & 5.2)
router.post('/evacuation/route', ...mlAccess, mlController.getEvacuationRoute);
router.post('/anomaly/detect', ...mlAccess, mlController.detectAnomalies);
router.get('/thermal/status', ...mlAccess, mlController.getThermalStatus);

module.exports = router;
