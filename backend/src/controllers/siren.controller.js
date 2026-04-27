// Local memory state for the Siren
let localSirenActive = false;

const triggerSiren = (req, res) => {
  localSirenActive = true;
  console.log('[LOCAL SIREN] Triggered ON via Admin Hotspot Request');
  return res.json({ success: true, active: localSirenActive });
};

const resetSiren = (req, res) => {
  localSirenActive = false;
  console.log('[LOCAL SIREN] Reset OFF via Admin Hotspot Request');
  return res.json({ success: true, active: localSirenActive });
};

const getSirenStatus = (req, res) => {
  return res.json({ success: true, active: localSirenActive });
};

module.exports = {
  triggerSiren,
  resetSiren,
  getSirenStatus
};
