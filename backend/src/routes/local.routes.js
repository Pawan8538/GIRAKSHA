const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserByToken,
  listUsers,
  recordSosEvent,
  recentSosEvents
} = require('../services/localStore');

const requireToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : header;
  if (!token) return res.status(401).json({ error: 'missing token' });
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'invalid token' });
  req.user = user;
  next();
};

router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body || {};
    const user = await registerUser({ username, password, role });
    return res.json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const session = await loginUser({ username, password });
    return res.json(session);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/me', requireToken, (req, res) => {
  return res.json({ user: req.user });
});

router.get('/users', requireToken, (_req, res) => {
  return res.json({ users: listUsers() });
});

router.post('/sos', async (req, res) => {
  try {
    const { message = 'SOS triggered', coords = null, meta = {} } = req.body || {};
    const device = req.headers['x-device-id'] || meta.device || 'unknown-device';
    const user = getUserByToken((req.headers.authorization || '').replace('Bearer ', ''));

    const event = recordSosEvent({
      message,
      coords,
      meta: { ...meta, device },
      user: user?.username || 'anonymous'
    });

    const io = req.app.get('io');
    if (io) io.emit('sos', event);

    return res.json({ ok: true, event });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/sos/recent', (_req, res) => {
  return res.json({ events: recentSosEvents() });
});

module.exports = router;
