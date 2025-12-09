const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = 3000;

// Store connected clients
const clients = {
  bands: new Map(),
  sirens: new Map(),
  dashboards: new Map()
};

// Store active alerts
const activeAlerts = new Map();

// Alert timeout (15 seconds)
const ACK_TIMEOUT = 15000;

// Serve static files (if you have a dashboard HTML)
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Alert System Dashboard</title>
      <style>
        body { font-family: Arial; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        h1 { color: #333; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 12px 24px; margin: 5px; font-size: 16px; cursor: pointer; border: none; border-radius: 4px; }
        .primary { background: #2196F3; color: white; }
        .danger { background: #F44336; color: white; }
        input, select { padding: 10px; margin: 5px; font-size: 14px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .connected { background: #4CAF50; color: white; }
        .log { background: #f9f9f9; padding: 10px; margin: 5px 0; border-left: 3px solid #2196F3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚨 Earthquake Alert System Dashboard</h1>
        
        <div class="section">
          <h2>Connected Devices</h2>
          <div id="devices">
            <p>Bands: <span id="bandCount">0</span></p>
            <p>Sirens: <span id="sirenCount">0</span></p>
            <p>Dashboards: <span id="dashboardCount">0</span></p>
          </div>
        </div>

        <div class="section">
          <h2>Create Alert</h2>
          <input type="text" id="alertZone" placeholder="Zone (e.g., Unit-3)" value="Unit-3">
          <input type="number" id="alertSeverity" placeholder="Severity (1-3)" value="3" min="1" max="3">
          <button class="primary" onclick="createAlert()">Create Alert</button>
        </div>

        <div class="section">
          <h2>Create Earthquake Scenario</h2>
          <input type="text" id="epicenterZone" placeholder="Epicenter Zone" value="Unit-3">
          <input type="number" id="magnitude" placeholder="Magnitude" value="3.0" step="0.1">
          <button class="primary" onclick="createScenario()">Start Earthquake</button>
        </div>

        <div class="section">
          <h2>Server Logs</h2>
          <div id="logs"></div>
        </div>
      </div>

      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        
        socket.on('connect', () => {
          console.log('Connected to server');
          socket.emit('register', { role: 'dashboard', zones: [] });
        });

        socket.on('deviceUpdate', (devices) => {
          document.getElementById('bandCount').textContent = devices.bands;
          document.getElementById('sirenCount').textContent = devices.sirens;
          document.getElementById('dashboardCount').textContent = devices.dashboards;
        });

        socket.on('log', (log) => {
          const logsDiv = document.getElementById('logs');
          const logEntry = document.createElement('div');
          logEntry.className = 'log';
          logEntry.textContent = new Date().toLocaleTimeString() + ' - ' + JSON.stringify(log);
          logsDiv.insertBefore(logEntry, logsDiv.firstChild);
          if (logsDiv.children.length > 10) {
            logsDiv.removeChild(logsDiv.lastChild);
          }
        });

        function createAlert() {
          const zone = document.getElementById('alertZone').value;
          const severity = parseInt(document.getElementById('alertSeverity').value);
          socket.emit('createAlert', { zone, severity });
        }

        function createScenario() {
          const epicenterZone = document.getElementById('epicenterZone').value;
          const magnitude = parseFloat(document.getElementById('magnitude').value);
          socket.emit('createScenario', { epicenterZone, magnitude });
        }
      </script>
    </body>
    </html>
  `);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (data) => {
    const { role, zones, workerId } = data;
    console.log(`Registered ${role}:`, workerId || socket.id, 'Zones:', zones);

    socket.role = role;
    socket.zones = zones || [];
    socket.workerId = workerId;

    // Store socket based on role
    if (role === 'band') {
      clients.bands.set(socket.id, socket);
    } else if (role === 'siren') {
      clients.sirens.set(socket.id, socket);
    } else if (role === 'dashboard') {
      clients.dashboards.set(socket.id, socket);
    }

    broadcastDeviceCount();
  });

  socket.on('createAlert', (data) => {
    const { zone, severity = 3 } = data;
    const alertId = `S${Date.now()}-${zone}`;

    console.log(`Creating alert: ${alertId} for zone ${zone}`);

    const alert = {
      alertId,
      zone,
      severity,
      timestamp: Date.now()
    };

    // Send to all bands subscribed to this zone
    clients.bands.forEach((client) => {
      if (client.zones.includes(zone)) {
        console.log(`Sending alert to band ${client.workerId}`);
        client.emit('alert', alert);
      }
    });

    // Store alert for ACK tracking
    activeAlerts.set(alertId, {
      ...alert,
      ackedBy: new Set(),
      timeout: setTimeout(() => {
        handleAlertTimeout(alertId);
      }, ACK_TIMEOUT)
    });

    // Broadcast log
    broadcastLog({ type: 'created', alertId, zone, severity });
  });

  socket.on('createScenario', (data) => {
    const { epicenterZone, magnitude } = data;
    console.log(`Creating scenario: epicenter=${epicenterZone}, magnitude=${magnitude}`);

    // Create alerts for epicenter and nearby zones
    const severity = Math.ceil(magnitude);
    const zones = [epicenterZone]; // Simplified - just epicenter for now

    zones.forEach(zone => {
      socket.emit('createAlert', { zone, severity });
    });

    broadcastLog({ type: 'scenario', epicenterZone, magnitude });
  });

  socket.on('ack', (data) => {
    const { alertId, workerId } = data;
    console.log(`ACK received from ${workerId} for alert ${alertId}`);

    const alert = activeAlerts.get(alertId);
    if (alert) {
      alert.ackedBy.add(workerId);

      // Cancel timeout for this worker's alert
      if (alert.timeout) {
        // In a real system, we'd track per-worker timeouts
        // For demo, we'll cancel siren if ANY worker ACKs
        clearTimeout(alert.timeout);
        activeAlerts.delete(alertId);

        // Cancel siren
        clients.sirens.forEach((client) => {
          if (client.zones.includes(alert.zone)) {
            client.emit('sirenCancel', { alertId });
          }
        });
      }

      broadcastLog({ type: 'ack', alertId, workerId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clients.bands.delete(socket.id);
    clients.sirens.delete(socket.id);
    clients.dashboards.delete(socket.id);
    broadcastDeviceCount();
  });
});

function handleAlertTimeout(alertId) {
  const alert = activeAlerts.get(alertId);
  if (!alert) return;

  console.log(`Alert timeout: ${alertId} - Triggering siren`);

  // Send siren to all sirens subscribed to this zone
  clients.sirens.forEach((client) => {
    if (client.zones.includes(alert.zone)) {
      console.log(`Triggering siren for zone ${alert.zone}`);
      client.emit('siren', {
        alertId: alert.alertId,
        zone: alert.zone,
        severity: alert.severity
      });
    }
  });

  broadcastLog({ type: 'escalated', alertId: alert.alertId, zone: alert.zone });
  activeAlerts.delete(alertId);
}

function broadcastDeviceCount() {
  const deviceCount = {
    bands: clients.bands.size,
    sirens: clients.sirens.size,
    dashboards: clients.dashboards.size
  };

  clients.dashboards.forEach((client) => {
    client.emit('deviceUpdate', deviceCount);
  });
}

function broadcastLog(logData) {
  clients.dashboards.forEach((client) => {
    client.emit('log', logData);
  });
}

http.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚨 Alert System Server Running`);
  console.log(`Server: http://10.0.75.150:${PORT}`);
  console.log(`\n📱 Share this IP with Android phones: 10.0.75.150:${PORT}\n`);
});
