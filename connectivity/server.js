const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.CONNECTIVITY_PORT || 3000;

// Store connected devices by category (Paper Section 4.3)
const clients = {
  bands: new Map(),
  sirens: new Map(),
  dashboards: new Map()
};

// Store active alerts and 15-second timer handles
const activeAlerts = new Map();
const ACK_TIMEOUT = 15000; // 15 seconds strict window

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GIRAKSHA — Mine Emergency Connectivity Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; }
        .container { max-width: 900px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-top: 0; display: flex; align-items: center; gap: 10px; font-size: 24px; }
        .subtitle { color: #94a3b8; margin-bottom: 24px; font-size: 14px; }
        .section { margin: 20px 0; padding: 20px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; }
        button { padding: 10px 20px; margin: 4px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; border-radius: 6px; transition: 0.2s; }
        .primary { background: #0284c7; color: white; }
        .primary:hover { background: #0369a1; }
        .danger { background: #dc2626; color: white; }
        .danger:hover { background: #b91c1c; }
        input, select { padding: 10px 14px; margin: 4px; background: #1e293b; border: 1px solid #475569; color: white; border-radius: 6px; font-size: 14px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 12px; }
        .badge-bands { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .badge-sirens { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .badge-dashboards { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .log-container { background: #090d16; border: 1px solid #334155; border-radius: 8px; max-height: 280px; overflow-y: auto; padding: 12px; font-family: monospace; font-size: 12px; }
        .log-item { padding: 6px 8px; margin: 4px 0; border-left: 3px solid #38bdf8; background: rgba(255,255,255,0.02); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⛏️ GIRAKSHA Mine Safety Connectivity Server</h1>
        <div class="subtitle">Real-Time Rockfall Alerting, Smart Band Route Dispatch & Acoustic Siren Escalation</div>

        <div class="section">
          <h3>Connected Hardware & Interfaces</h3>
          <p>Worker Smart Bands: <span class="badge badge-bands" id="bandCount">0</span> &nbsp;|&nbsp;
             Zone Acoustic Sirens: <span class="badge badge-sirens" id="sirenCount">0</span> &nbsp;|&nbsp;
             Authority Dashboards: <span class="badge badge-dashboards" id="dashboardCount">0</span></p>
        </div>

        <div class="section">
          <h3>Trigger Emergency Rockfall Alert</h3>
          <input type="text" id="alertZone" placeholder="Zone (e.g. Zone-3 North Wall)" value="Zone-3 (North Highwall)">
          <select id="alertSeverity">
            <option value="3">Imminent Risk (Severity 3 - Red)</option>
            <option value="2">High Risk (Severity 2 - Orange)</option>
            <option value="1">Medium Risk (Severity 1 - Yellow)</option>
          </select>
          <button class="danger" onclick="triggerAlert()">Dispatch Alert (Start 15s Timer)</button>
        </div>

        <div class="section">
          <h3>Trigger Rockfall Instability Scenario</h3>
          <select id="scenarioSelect">
            <option value="RAPID_CREEP_ACCELERATION">Rapid Accelerating Creep (Fukuzono Precursor)</option>
            <option value="HEAVY_MONSOON_INUNDATION">Heavy Monsoon Inundation (r24 > 50mm)</option>
            <option value="BLAST_TREMOR_SHOCK">Blast Induced Dynamic Shock (PPV > 2.5g)</option>
          </select>
          <button class="primary" onclick="triggerScenario()">Start Scenario Simulation</button>
        </div>

        <div class="section">
          <h3>Live Communication Logs</h3>
          <div class="log-container" id="logs"></div>
        </div>
      </div>

      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();

        socket.on('connect', () => {
          socket.emit('register', { role: 'dashboard', zones: [] });
        });

        socket.on('deviceUpdate', (devices) => {
          document.getElementById('bandCount').textContent = devices.bands;
          document.getElementById('sirenCount').textContent = devices.sirens;
          document.getElementById('dashboardCount').textContent = devices.dashboards;
        });

        socket.on('log', (log) => {
          const logsDiv = document.getElementById('logs');
          const entry = document.createElement('div');
          entry.className = 'log-item';
          entry.textContent = new Date().toLocaleTimeString() + ' - ' + JSON.stringify(log);
          logsDiv.insertBefore(entry, logsDiv.firstChild);
          if (logsDiv.children.length > 50) logsDiv.removeChild(logsDiv.lastChild);
        });

        function triggerAlert() {
          const zone = document.getElementById('alertZone').value;
          const severity = parseInt(document.getElementById('alertSeverity').value, 10);
          socket.emit('createAlert', { zone, severity, riskScore: severity === 3 ? 0.88 : 0.68 });
        }

        function triggerScenario() {
          const scenarioType = document.getElementById('scenarioSelect').value;
          socket.emit('createScenario', { scenarioType, zone: 'Zone-3 (North Highwall)' });
        }
      </script>
    </body>
    </html>
  `);
});

io.on('connection', (socket) => {
  console.log('[GIRAKSHA Standalone Server] Client connected:', socket.id);

  socket.on('register', (data = {}) => {
    const { role = 'dashboard', zones = [], workerId } = data;
    socket.role = role;
    socket.zones = zones;
    socket.workerId = workerId;

    if (role === 'band') clients.bands.set(socket.id, socket);
    else if (role === 'siren') clients.sirens.set(socket.id, socket);
    else clients.dashboards.set(socket.id, socket);

    broadcastDeviceCount();
  });

  socket.on('createAlert', (data) => {
    const { zone = 'Zone-3', severity = 3, riskScore = 0.82 } = data;
    const alertId = `ALT-${Date.now()}-${zone.replace(/\s+/g, '_')}`;

    console.log(`🚨 [GIRAKSHA Alert] ${alertId} for ${zone}`);

    const alert = {
      alertId,
      zone,
      severity,
      riskScore,
      timestamp: Date.now(),
      recommendedExit: "North Bench Main Exit 1",
      ackTimeoutMs: ACK_TIMEOUT
    };

    clients.bands.forEach((client) => {
      if (client.zones.length === 0 || client.zones.includes(zone)) {
        client.emit('alert', alert);
      }
    });

    activeAlerts.set(alertId, {
      ...alert,
      ackedBy: new Set(),
      timeout: setTimeout(() => handleAlertTimeout(alertId), ACK_TIMEOUT),
      status: 'PENDING_ACK'
    });

    broadcastLog({ type: 'ALERT_DISPATCHED', alertId, zone, severity, window: '15 seconds' });
  });

  socket.on('createScenario', (data) => {
    const { scenarioType = 'RAPID_CREEP_ACCELERATION', zone = 'Zone-3' } = data;
    const severity = scenarioType === 'RAPID_CREEP_ACCELERATION' ? 3 : 2;
    socket.emit('createAlert', { zone, severity, riskScore: severity === 3 ? 0.88 : 0.68 });
    broadcastLog({ type: 'SCENARIO_STARTED', scenarioType, zone });
  });

  socket.on('ack', (data) => {
    const { alertId, workerId = 'worker' } = data;
    const alert = activeAlerts.get(alertId);
    if (alert) {
      alert.ackedBy.add(workerId);
      alert.status = 'ACKNOWLEDGED';

      if (alert.timeout) {
        clearTimeout(alert.timeout);
        alert.timeout = null;
      }

      clients.sirens.forEach((client) => {
        if (client.zones.includes(alert.zone)) client.emit('sirenCancel', { alertId });
      });

      clients.dashboards.forEach((client) => {
        client.emit('alertAcknowledged', { alertId, workerId, status: 'ACKNOWLEDGED' });
      });

      broadcastLog({ type: 'ACK_RECEIVED', alertId, workerId });
    }
  });

  socket.on('sos', (data = {}) => {
    const { workerId = socket.workerId || 'Worker', zone = 'Zone-3' } = data;
    const sosPayload = {
      sosId: `SOS-${Date.now()}-${workerId}`,
      workerId,
      zone,
      timestamp: Date.now(),
      priority: 'MAXIMUM_CRITICAL'
    };

    io.emit('workerSOS', sosPayload);
    broadcastLog({ type: 'SOS_TRIGGERED', workerId, zone });
  });

  socket.on('disconnect', () => {
    clients.bands.delete(socket.id);
    clients.sirens.delete(socket.id);
    clients.dashboards.delete(socket.id);
    broadcastDeviceCount();
  });
});

function handleAlertTimeout(alertId) {
  const alert = activeAlerts.get(alertId);
  if (!alert || alert.status === 'ACKNOWLEDGED') return;

  console.warn(`⚡ [GIRAKSHA ESCALATION] 15s timeout reached for ${alertId} without worker ACK! Triggering acoustic sirens...`);
  alert.status = 'ESCALATED_UNACKNOWLEDGED';

  clients.sirens.forEach((client) => {
    if (client.zones.length === 0 || client.zones.includes(alert.zone)) {
      client.emit('siren', { alertId: alert.alertId, zone: alert.zone, severity: alert.severity });
    }
  });

  const escalationPayload = {
    alertId: alert.alertId,
    zone: alert.zone,
    severity: alert.severity,
    status: 'ESCALATED_UNACKNOWLEDGED',
    thermalStreamUrl: '/static/thermal/north_wall_stream.m3u8',
    message: 'INDEPENDENT VERIFICATION REQUIRED: Review LWIR thermal stream to verify zone evacuation.'
  };

  clients.dashboards.forEach((client) => {
    client.emit('escalateToAuthority', escalationPayload);
  });

  broadcastLog({ type: 'ESCALATED_TO_AUTHORITY', alertId: alert.alertId, zone: alert.zone, sirensActive: true });
}

function broadcastDeviceCount() {
  const deviceCount = {
    bands: clients.bands.size,
    sirens: clients.sirens.size,
    dashboards: clients.dashboards.size
  };
  clients.dashboards.forEach(client => client.emit('deviceUpdate', deviceCount));
  io.emit('deviceUpdate', deviceCount);
}

function broadcastLog(logData) {
  const entry = { ...logData, timestamp: new Date().toLocaleTimeString() };
  clients.dashboards.forEach(client => client.emit('log', entry));
  io.emit('log', entry);
}

http.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⛏️ GIRAKSHA Mine Connectivity & Emergency Alert Server running on port ${PORT}`);
});
