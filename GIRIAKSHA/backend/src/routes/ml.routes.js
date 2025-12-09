const express = require('express');

const mlController = require('../controllers/ml.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const mlAccess = [requireAuth, requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY')];
const siteAdminOnly = [requireAuth, requireRole('SITE_ADMIN', 'SUPER_ADMIN')];

router.post('/predict', ...mlAccess, mlController.predict);
router.post('/manual-predict', ...siteAdminOnly, mlController.manualPredict);
router.post('/forecast', ...mlAccess, mlController.forecast);
router.post('/detect', ...mlAccess, ...mlController.detect);
router.get('/explain/:predictionId', ...mlAccess, mlController.explain);
router.get('/predictions', ...mlAccess, mlController.listPredictions);

// Real-time data routes from sih2025 fusion engine
router.get('/risk/current', ...mlAccess, mlController.getCurrentRisk);
router.get('/risk/grid', ...mlAccess, mlController.getRiskGrid);
router.get('/sensors/stream', ...mlAccess, mlController.getSensorStream);

module.exports = router;

