const express = require('express');

const govtController = require('../controllers/govt.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/advisories',
  requireAuth,
  requireRole('GOV_AUTHORITY', 'SUPER_ADMIN'),
  govtController.upload.array('attachments', 5),
  govtController.postAdvisory
);

router.get(
  '/advisories',
  requireAuth,
  requireRole('GOV_AUTHORITY', 'SUPER_ADMIN', 'SITE_ADMIN'),
  govtController.getAdvisories
);

module.exports = router;


