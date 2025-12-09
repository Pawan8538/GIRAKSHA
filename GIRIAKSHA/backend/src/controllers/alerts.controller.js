const {
  createAlert,
  acknowledgeAlert,
  getAlertsBySlope,
  getUsersByRole
} = require('../models/queries');
const { notifyUsers } = require('../services/notification.service');

const createAlertController = async (req, res, next) => {
  try {
    const { slopeId, alertType, message, severity } = req.body;

    const created = await createAlert(slopeId, alertType, message, severity);
    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const acknowledge = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User id required to acknowledge alert'
      });
    }

    const updated = await acknowledgeAlert(alertId, userId);
    if (updated.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    return res.json({
      success: true,
      data: updated.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const getAlertsForSlope = async (req, res, next) => {
  try {
    const { slopeId } = req.params;
    const alerts = await getAlertsBySlope(slopeId);

    return res.json({
      success: true,
      data: alerts.rows
    });
  } catch (error) {
    next(error);
  }
};

const raiseSOS = async (req, res, next) => {
  try {
    const { message = 'Emergency reported by field worker', slopeId = null } = req.body;
    const created = await createAlert(slopeId, 'sos', message, 'critical');

    const [siteAdmins, govAuthorities] = await Promise.all([
      getUsersByRole('site_admin'),
      getUsersByRole('gov_authority')
    ]);

    const recipients = [
      ...siteAdmins.rows.map((user) => user.id),
      ...govAuthorities.rows.map((user) => user.id)
    ];

    await notifyUsers(req.app, recipients, {
      type: 'sos',
      title: 'SOS Triggered',
      body: `${req.user.name || 'Field worker'}: ${message}`,
      metadata: {
        slopeId,
        alertId: created.rows[0].id
      }
    });

    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const listAllAlerts = async (req, res, next) => {
  try {
    const { slopeId } = req.query;

    // 1. Fetch System Alerts (SOS, Sensor Thresholds)
    const { getAllAlerts, getAlertsBySlope } = require('../models/queries');
    const alertsRes = slopeId ? await getAlertsBySlope(slopeId) : await getAllAlerts();

    // 2. Fetch Gov Advisories
    const { getAdvisories } = require('../models/queries');
    const advisoriesRes = await getAdvisories();

    // 3. Fetch Field Worker Reports (Complaints)
    const { getAllComplaints } = require('../models/queries');
    const complaintsRes = await getAllComplaints();

    // Merge and Format
    const combined = [
      ...alertsRes.rows.map(a => ({
        id: `alert-${a.id}`,
        type: a.alert_type === 'sos' ? 'SOS' : 'SYSTEM',
        title: a.alert_type === 'sos' ? 'SOS Alert' : 'System Alert',
        message: a.message,
        severity: a.severity,
        created_at: a.created_at,
        source: 'System'
      })),
      ...advisoriesRes.rows.map(a => ({
        id: `adv-${a.id}`,
        type: 'ADVISORY',
        title: a.title || 'Government Advisory',
        message: a.message,
        severity: a.severity,
        created_at: a.created_at,
        source: 'Government'
      })),
      ...complaintsRes.rows.filter(c => !slopeId || c.slope_id == slopeId).map(c => ({
        id: `rep-${c.id}`,
        type: 'REPORT',
        title: 'Field Report',
        message: c.description,
        severity: 'info',
        created_at: c.created_at,
        source: 'Field Worker'
      }))
    ];

    // Sort by Date Descending
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      data: combined
    });
  } catch (error) {
    next(error);
  }
};

const postAdvisory = async (req, res, next) => {
  try {
    const { title, message, severity = 'info', slopeId } = req.body;
    const { createAdvisory } = require('../models/queries');

    const created = await createAdvisory(req.user.id, null, slopeId, title, message, severity, null);

    return res.status(201).json({
      success: true,
      data: created.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert: createAlertController,
  acknowledge,
  getAlertsForSlope,
  raiseSOS,
  listAllAlerts,
  postAdvisory
};


