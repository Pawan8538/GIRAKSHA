const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const {
  getUserByPhone,
  getUserByEmail,
  createUser,
  updateUserProfile,
  updateUserPassword,
  getUserById
} = require('../models/supabaseQueries');

const config = require('../config/env');
const ROLES = ['field_worker', 'site_admin', 'gov_authority', 'super_admin'];

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

const createToken = (user_id, phone, role) => {
  return jwt.sign(
    { sub: user_id, phone, role },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
};

const requireToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!token) return res.status(401).json({ error: 'missing token' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid token' });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role } = req.body || {};

    // Validate input
    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'name, phone, password, and role are required' });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` });
    }

    // Check if user exists
    const existing = await getUserByPhone(phone);
    if (existing) {
      return res.status(400).json({ error: 'phone number already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser(name, phone, `${phone}@geoguard.local`, passwordHash, role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('[Auth] register error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body || {};

    if (!phone || !password) {
      return res.status(400).json({ error: 'phone and password are required' });
    }

    // Get user
    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    // Generate token
    const token = createToken(user.id, user.phone, user.role);

    return res.json({
      success: true,
      message: `${user.role} login successful`,
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('[Auth] login error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', requireToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.sub);
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('[Auth] getProfile error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/me', requireToken, async (req, res) => {
  try {
    const { name, phone } = req.body || {};
    const user = await updateUserProfile(req.user.sub, name || req.user.phone, phone || req.user.phone);
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('[Auth] updateProfile error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Get available roles
router.get('/roles', (req, res) => {
  return res.json({ roles: ROLES });
});

// Health check
router.get('/health', (req, res) => {
  return res.json({ ok: true });
});

module.exports = router;
