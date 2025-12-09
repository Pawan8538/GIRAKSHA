const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');

const {
  registerGov,
  registerSiteAdmin,
  registerWorker,
  inviteWorker,
  login,
  getProfile,
  updateProfile,
  listRoles: getRoles,
  listPendingUsers,
  approveUserRequest,
  rejectUserRequest,
  listWorkers,
  getSlopes,
  deleteWorker
} = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.get('/slopes', getSlopes);

router.post('/login', login);

router.post('/register/gov', registerGov);
router.post('/register/site-admin', registerSiteAdmin);
router.post('/register/worker', registerWorker);

router.post(
  '/invite/worker',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  inviteWorker
);

router.put(
  '/me',
  requireAuth,
  updateProfile
);

router.get(
  '/me',
  requireAuth,
  getProfile // Fetch user profile
);

router.get('/roles', getRoles);

router.get(
  '/admin/pending-users',
  requireAuth,
  requireRole('SUPER_ADMIN', 'SITE_ADMIN', 'GOV_AUTHORITY'),
  listPendingUsers
);

router.post(
  '/admin/approve-user',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  approveUserRequest
);

router.post(
  '/admin/reject-user',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  rejectUserRequest
);

router.get(
  '/workers',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  listWorkers
);

router.delete(
  '/admin/worker/:id',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  deleteWorker
);

module.exports = router;
