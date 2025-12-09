const express = require('express');
const router = express.Router();
const socketService = require('../services/socket.service');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/alerts/create
 * @desc    Create a new alert
 * @access  Private (site_admin, super_admin)
 */
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { zone, severity } = req.body;

        if (!zone) {
            return res.status(400).json({ error: 'Zone is required' });
        }

        if (severity && (severity < 1 || severity > 3)) {
            return res.status(400).json({ error: 'Severity must be between 1 and 3' });
        }

        const alert = socketService.createAlert({ zone, severity: severity || 3 });

        res.json({
            success: true,
            alert
        });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

/**
 * @route   POST /api/alerts/scenario
 * @desc    Create earthquake scenario with epicenter and magnitude
 * @access  Private (site_admin, super_admin)
 */
router.post('/scenario', authenticateToken, async (req, res) => {
    try {
        const { epicenterZone, magnitude } = req.body;

        if (!epicenterZone || !magnitude) {
            return res.status(400).json({ error: 'Epicenter zone and magnitude are required' });
        }

        const alerts = socketService.createScenario({ epicenterZone, magnitude });

        res.json({
            success: true,
            alerts
        });
    } catch (error) {
        console.error('Create scenario error:', error);
        res.status(500).json({ error: 'Failed to create scenario' });
    }
});

/**
 * @route   GET /api/alerts/active
 * @desc    Get all active alerts
 * @access  Private
 */
router.get('/active', authenticateToken, async (req, res) => {
    try {
        const activeAlerts = socketService.getActiveAlerts();

        res.json({
            success: true,
            alerts: activeAlerts
        });
    } catch (error) {
        console.error('Get active alerts error:', error);
        res.status(500).json({ error: 'Failed to get active alerts' });
    }
});

/**
 * @route   GET /api/alerts/devices
 * @desc    Get connected device count
 * @access  Private
 */
router.get('/devices', authenticateToken, async (req, res) => {
    try {
        const deviceCount = socketService.getDeviceCount();

        res.json({
            success: true,
            devices: deviceCount
        });
    } catch (error) {
        console.error('Get device count error:', error);
        res.status(500).json({ error: 'Failed to get device count' });
    }
});

module.exports = router;
