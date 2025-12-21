const express = require('express');

const complaintsController = require('../controllers/complaints.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/upload',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN'),
  complaintsController.uploadEvidence
);

router.post(
  '/',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN'),
  complaintsController.createComplaint
);

router.get(
  '/',
  requireAuth,
  requireRole('FIELD_WORKER', 'SITE_ADMIN', 'SUPER_ADMIN', 'GOV_AUTHORITY'),
  complaintsController.listComplaints
);

router.get(
  '/:complaintId',
  requireAuth,
  complaintsController.getComplaintDetail
);

router.patch(
  '/:complaintId/status',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  complaintsController.updateComplaintStatus
);

router.post(
  '/:complaintId/feedback',
  requireAuth,
  requireRole('SITE_ADMIN', 'SUPER_ADMIN'),
  complaintsController.addFeedback
);

module.exports = router;


