const jwt = require('jsonwebtoken');

const config = require('../config/env');
const { getUserById, getRoleById } = require('../models/queries');

const ROLE_CODE = {
  FIELD_WORKER: 'field_worker',
  SITE_ADMIN: 'site_admin',
  SUPER_ADMIN: 'super_admin',
  GOV_AUTHORITY: 'gov_authority'
};
const ROLE_VALUES = Object.values(ROLE_CODE);

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return null;
};

const normalizeRole = (role) => {
  if (!role) return null;
  const asString = String(role);
  const upper = asString.toUpperCase();
  if (ROLE_CODE[upper]) {
    return ROLE_CODE[upper];
  }
  const lower = asString.toLowerCase();
  if (ROLE_VALUES.includes(lower)) {
    return lower;
  }
  return null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing'
      });
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const userResult = await getUserById(payload.sub);
    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user'
      });
    }

    const user = userResult.rows[0];
    const roleResult = await getRoleById(user.role_id);
    const roleName = roleResult.rowCount > 0 ? roleResult.rows[0].name : null;

    req.user = {
      ...user,
      role_name: roleName,
      role_code: normalizeRole(roleName)
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: error.message
    });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const normalizedUserRole = normalizeRole(req.user.role_name);
  const allowedRoles = roles.length > 0
    ? roles.map(normalizeRole).filter(Boolean)
    : [];

  if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedUserRole)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }

  next();
};

const authorizeRoles = (...roles) => requireRole(...roles);

module.exports = {
  requireAuth,
  requireRole,
  authorizeRoles,
  ROLE_CODE
};
