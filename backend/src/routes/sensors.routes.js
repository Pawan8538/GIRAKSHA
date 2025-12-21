const express = require('express');

const sensorsController = require('../controllers/sensors.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY'),
  sensorsController.listSensors
);

router.patch(
  '/global/toggle',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  sensorsController.toggleGlobalSystem
);

router.get(
  '/:sensorId',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  sensorsController.getSensor
);

router.post(
  '/',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  sensorsController.addSensor
);

router.post(
  '/:sensorId/readings',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN'),
  sensorsController.addReading
);

router.get(
  '/:sensorId/readings',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY'),
  sensorsController.getReadings
);

router.patch(
  '/:sensorId/toggle',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  sensorsController.toggleSensorStatus
);

router.get(
  '/:sensorId/stats',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY'),
  sensorsController.getStats
);

module.exports = router;


