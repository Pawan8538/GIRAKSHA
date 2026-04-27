const express = require('express');
const sirenController = require('../controllers/siren.controller');

// Note: No auth middleware used here to ensure completely frictionless local hotspot access 
// without relying on tokens or sessions on the mobile devices for this specific fail-safe.

const router = express.Router();

router.post('/trigger', sirenController.triggerSiren);
router.post('/reset', sirenController.resetSiren);
router.get('/status', sirenController.getSirenStatus);

module.exports = router;
