const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getUserById, getRoleById, getRoleByName } = require('../models/queries');

/**
 * =====================================================
 * ROLE CONSTANTS & UTILITIES
 * =====================================================
 */
const ROLE_CODE = {
  FIELD_WORKER: 'field_worker',
  SITE_ADMIN: 'site_admin',
  SUPER_ADMIN: 'super_admin',
  GOV_AUTHORITY: 'gov_authority'
};
const ROLE_VALUES = Object.values(ROLE_CODE);

/**
 * Extract JWT token from Authorization header
 */
const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return null;
};

/**
 * Normalize role to lowercase standard form
 */
const normalizeRole = (role) => {
  if (!role) return null;
  const asString = String(role);
  const lower = asString.toLowerCase();
  if (ROLE_VALUES.includes(lower)) {
    return lower;
  }
  return null;
};

/**
 * Main authentication middleware
 * Verifies JWT token and loads user with role information
 */
const requireAuth = async (req, res, next) => {
  try {
    // Development bypass for testing
    if (config.devBypassToken) {
      const bypassHeader = req.headers['x-dev-bypass'] || req.headers['x-dev-bypass-token'];
      const authHeader = req.headers.authorization || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (bypassHeader === config.devBypassToken || bearerToken === config.devBypassToken) {
        let roleId = null;
        try {
          const roleRes = await getRoleByName('site_admin');
          if (roleRes.rowCount > 0) roleId = roleRes.rows[0].id;
        } catch (err) {
          console.error('[Auth] Dev bypass role lookup failed:', err.message);
        }

        req.user = {
          id: -1,
          name: 'Dev Site Admin',
          email: 'dev@local',
          role_id: roleId,
          role_name: ROLE_CODE.SITE_ADMIN,
          role_code: ROLE_CODE.SITE_ADMIN,
          slope_id: 1,
          is_approved: true
        };

        return next();
      }
    }

    // Extract token
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing'
      });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Load user from database
    const userResult = await getUserById(payload.sub);
    if (userResult.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    
    // Load role
    const roleResult = await getRoleById(user.role_id);
    const roleName = roleResult.rowCount > 0 ? roleResult.rows[0].name : null;

    // Attach user to request
    req.user = {
      ...user,
      role_name: roleName,
      role_code: normalizeRole(roleName)
    };

    next();
  } catch (error) {
    console.error('[Auth] requireAuth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: error.message
    });
  }
};

/**
 * Role-based authorization middleware
 * Ensures user has one of the specified roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No user context'
    });
  }

  const normalizedUserRole = normalizeRole(req.user.role_name);
  const allowedRoles = roles.length > 0
    ? roles.map(normalizeRole).filter(Boolean)
    : [];

  if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedUserRole)) {
    console.warn(`[Auth] Access denied for user ${req.user.id} with role ${normalizedUserRole}. Required: ${allowedRoles.join(',')}`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Insufficient permissions'
    });
  }

  next();
};

/**
 * Alias for requireRole
 */
const authorizeRoles = (...roles) => requireRole(...roles);

/**
 * Check if user is approved (for non-super-admin roles)
 */
const requireApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No user context'
    });
  }

  // Super admin doesn't need approval
  if (req.user.role_code === ROLE_CODE.SUPER_ADMIN) {
    return next();
  }

  if (!req.user.is_approved) {
    return res.status(403).json({
      success: false,
      message: 'Account pending approval',
      approval_status: req.user.approval_status
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireRole,
  authorizeRoles,
  requireApproval,
  ROLE_CODE,
  normalizeRole,
  extractToken
};
