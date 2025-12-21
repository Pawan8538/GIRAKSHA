const express = require('express');

const rolesController = require('../controllers/roles.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('SITE_ADMIN', 'SUPER_ADMIN'), rolesController.listRoles);

module.exports = router;

