const { getAllRoles } = require('../models/queries');

const ROLE_DESCRIPTIONS = {
  field_worker: 'Field Worker — basic map, sensors, complaint submission, SOS, and assigned tasks.',
  site_admin: 'Site Admin — dashboards, sensors, cameras, tasks, and complaint approvals.',
  super_admin: 'Super Admin — full control of users, sensors, slopes, ML, and system settings.',
  gov_authority: 'Government Authority — government dashboards, alerts, and advisories.'
};

const listRoles = async (req, res, next) => {
  try {
    const roles = await getAllRoles();
    return res.json({
      success: true,
      data: roles.rows.map((role) => ({
        ...role,
        description: ROLE_DESCRIPTIONS[role.name] || 'Role description pending.'
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRoles
};

