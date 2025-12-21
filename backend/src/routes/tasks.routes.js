const express = require('express');

const tasksController = require('../controllers/tasks.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const workerAccess = [requireAuth, requireRole('FIELD_WORKER')];
const adminAccess = [requireAuth, requireRole('SITE_ADMIN', 'SUPER_ADMIN')];

// Admin Routes
router.post('/', ...adminAccess, tasksController.createTask);
router.get('/all', ...adminAccess, tasksController.listAllTasks);

// Worker Routes
router.get('/mine', ...workerAccess, tasksController.listMyTasks);
router.get('/:taskId', ...workerAccess, tasksController.getTaskDetail);
router.post('/:taskId/status', ...workerAccess, tasksController.updateTaskStatusForWorker);
router.post('/:taskId/attachments', ...workerAccess, ...tasksController.uploadTaskAttachment);

module.exports = router;

