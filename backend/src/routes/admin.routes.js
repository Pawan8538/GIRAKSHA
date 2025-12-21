const express = require('express');

const adminController = require('../controllers/admin.controller');
const authController = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const adminOnly = [requireAuth, requireRole('SITE_ADMIN', 'SUPER_ADMIN')];
const superAdminOnly = [requireAuth, requireRole('SUPER_ADMIN')];
const slopeReaders = [requireAuth, requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY')];

router.post('/create-super-admin', ...superAdminOnly, adminController.createSuperAdmin);
// User Management
router.get('/users', ...adminOnly, adminController.listUsers);
router.patch('/users/:userId/role', ...adminOnly, adminController.changeUserRole);
// These functions are in authController, not adminController
router.get('/users/pending', ...adminOnly, authController.listPendingUsers);
router.post('/users/approve', ...adminOnly, authController.approveUserRequest);
router.post('/users/reject', ...adminOnly, authController.rejectUserRequest);

// Worker Management
router.get('/workers', ...adminOnly, authController.listWorkers);
router.get('/workers/status', ...adminOnly, adminController.getWorkerStatus);
router.post('/invite-worker', ...adminOnly, authController.inviteWorker);
router.delete('/workers/:id', ...adminOnly, authController.deleteWorker);

// "Mines" endpoint for Gov Authority (alias for slopes)
router.get('/mines', ...slopeReaders, adminController.getAllMines);

router.get('/slopes', ...slopeReaders, adminController.listSlopes);
router.post('/slopes', ...adminOnly, adminController.createSlope);
router.get('/slopes/:slopeId', ...slopeReaders, adminController.getSlope);
router.patch('/slopes/:slopeId', ...adminOnly, adminController.updateSlope);
router.patch('/slopes/:slopeId/risk', ...adminOnly, adminController.updateSlopeRisk);
router.delete('/slopes/:slopeId', ...adminOnly, adminController.deleteSlope);

router.get('/tasks', ...adminOnly, adminController.listTasks);
router.post('/tasks', ...adminOnly, adminController.createTask);
router.patch('/tasks/:taskId/status', ...adminOnly, adminController.updateTaskStatus);
router.post('/demo-data', ...slopeReaders, adminController.generateDemoData);

module.exports = router;


