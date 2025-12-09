const express = require('express');

const alertsController = require('../controllers/alerts.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/all', requireAuth, alertsController.listAllAlerts);
router.get('/', requireAuth, alertsController.listAllAlerts);

router.post(
  '/advisory',
  requireAuth,
  requireRole('GOV_AUTHORITY', 'SUPER_ADMIN'),
  alertsController.postAdvisory
);

router.post(
  '/',
  requireAuth,
  alertsController.createAlert
);

router.post(
  '/sos',
  requireAuth,
  alertsController.raiseSOS
);

router.put(
  '/:alertId/acknowledge',
  requireAuth,
  alertsController.acknowledge
);

router.get(
  '/slope/:slopeId',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY'),
  alertsController.getAlertsForSlope
);

// Socket-based connectivity alert routes
router.post(
  '/socket/create',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { zone, severity } = req.body;
      const socketService = req.app.get('socketService');

      if (!zone) {
        return res.status(400).json({ error: 'Zone is required' });
      }

      const alert = socketService.createAlert({ zone, severity: severity || 3 });
      res.json({ success: true, alert });
    } catch (error) {
      console.error('Socket alert create error:', error);
      res.status(500).json({ error: 'Failed to create socket alert' });
    }
  }
);

router.post(
  '/socket/scenario',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  async (req, res) => {
    try {
      const { epicenterZone, magnitude } = req.body;
      const socketService = req.app.get('socketService');

      if (!epicenterZone || !magnitude) {
        return res.status(400).json({ error: 'Epicenter zone and magnitude required' });
      }

      const alerts = socketService.createScenario({ epicenterZone, magnitude });
      res.json({ success: true, alerts });
    } catch (error) {
      console.error('Socket scenario create error:', error);
      res.status(500).json({ error: 'Failed to create scenario' });
    }
  }
);

router.get(
  '/socket/active',
  requireAuth,
  async (req, res) => {
    try {
      const socketService = req.app.get('socketService');
      const activeAlerts = socketService.getActiveAlerts();
      res.json({ success: true, alerts: activeAlerts });
    } catch (error) {
      console.error('Get socket alerts error:', error);
      res.status(500).json({ error: 'Failed to get active socket alerts' });
    }
  }
);

router.get(
  '/socket/devices',
  requireAuth,
  async (req, res) => {
    try {
      const socketService = req.app.get('socketService');
      const devices = socketService.getDeviceCount();
      res.json({ success: true, devices });
    } catch (error) {
      console.error('Get devices error:', error);
      res.status(500).json({ error: 'Failed to get connected devices' });
    }
  }
);

module.exports = router;



