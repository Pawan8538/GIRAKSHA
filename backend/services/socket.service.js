const { Server } = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
        this.clients = {
            bands: new Map(),
            sirens: new Map(),
            dashboards: new Map()
        };
        this.activeAlerts = new Map();
        this.ACK_TIMEOUT = 15000; // 15 seconds
        
        // Centralized Polling State
        this.pollingInterval = null;
        this.pollCount = 0;
        this.POLL_RATE = 30000; // 30 seconds - Render free tier safe
    }

    initialize(io) {
        this.io = io;

        this.io.on('connection', (socket) => {
            console.log('Socket.io client connected:', socket.id);
            this.handleConnection(socket);
        });

        console.log('✅ Socket.io service attached to existing server');
    }

    handleConnection(socket) {
        socket.on('register', (data) => {
            const { role, zones, workerId } = data;
            console.log(`Registered ${role}:`, workerId || socket.id, 'Zones:', zones);

            socket.role = role;
            socket.zones = zones || [];
            socket.workerId = workerId;

            // Store socket based on role
            if (role === 'band') {
                this.clients.bands.set(socket.id, socket);
            } else if (role === 'siren') {
                this.clients.sirens.set(socket.id, socket);
            } else if (role === 'dashboard') {
                this.clients.dashboards.set(socket.id, socket);
                this.updatePollingStatus();
            }

            this.broadcastDeviceCount();
        });

        socket.on('createAlert', (data) => {
            this.createAlert(data);
        });

        socket.on('createScenario', (data) => {
            this.createScenario(data);
        });

        socket.on('ack', (data) => {
            this.handleAck(data);
        });

        socket.on('disconnect', () => {
            console.log('Socket.io client disconnected:', socket.id);
            this.clients.bands.delete(socket.id);
            this.clients.sirens.delete(socket.id);
            this.clients.dashboards.delete(socket.id);
            this.broadcastDeviceCount();
            this.updatePollingStatus();
        });
    }

    updatePollingStatus() {
        if (this.clients.dashboards.size > 0 && !this.pollingInterval) {
            console.log('🚀 Dashboards connected. Starting Centralized Polling...');
            this.startPolling();
        } else if (this.clients.dashboards.size === 0 && this.pollingInterval) {
            console.log('💤 No dashboards connected. Stopping Centralized Polling to allow sleep.');
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async startPolling() {
        const axios = require('axios');
        const port = process.env.PORT || 4000;
        const localApi = `http://127.0.0.1:${port}/api`;
        this.pollCount = 0;

        this.pollingInterval = setInterval(async () => {
            this.pollCount++;
            try {
                const reqConfig = { headers: { 'x-internal-bypass': 'true' }, timeout: 8000 };

                // --- Sensors: Every 30s ---
                try {
                    const sensorRes = await axios.get(`${localApi}/sensors`, reqConfig);
                    if (sensorRes.data && sensorRes.data.success && sensorRes.data.data.length > 0) {
                        this.clients.dashboards.forEach(client => {
                            client.emit('sensorData', sensorRes.data.data);
                        });
                    }
                } catch (sErr) {
                    console.warn('Sensor poll failed (non-fatal):', sErr.message);
                }

                // --- Heatmap: Every 3rd poll (~90s) to avoid ML service rate limits ---
                if (this.pollCount % 3 === 0) {
                    try {
                        const heatmapRes = await axios.get(`${localApi}/ml/risk/grid`, reqConfig);
                        if (heatmapRes.data && heatmapRes.data.grid) {
                            this.clients.dashboards.forEach(client => {
                                client.emit('heatmapData', heatmapRes.data.grid);
                            });
                        }
                    } catch (hErr) {
                        console.warn('Heatmap poll failed (non-fatal):', hErr.message);
                    }
                }
            } catch (err) {
                console.error('Centralized Polling Error:', err.message);
            }
        }, this.POLL_RATE);
    }

    createAlert(data) {
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
        this.clients.bands.forEach((client) => {
            if (client.zones.includes(zone)) {
                console.log(`Sending alert to band ${client.workerId}`);
                client.emit('alert', alert);
            }
        });

        // Store alert for ACK tracking
        this.activeAlerts.set(alertId, {
            ...alert,
            ackedBy: new Set(),
            timeout: setTimeout(() => {
                this.handleAlertTimeout(alertId);
            }, this.ACK_TIMEOUT)
        });

        // Broadcast log
        this.broadcastLog({ type: 'created', alertId, zone, severity });

        return alert;
    }

    createScenario(data) {
        const { epicenterZone, magnitude } = data;
        console.log(`Creating scenario: epicenter=${epicenterZone}, magnitude=${magnitude}`);

        // Create alerts for epicenter and nearby zones
        const severity = Math.ceil(magnitude);
        const zones = [epicenterZone]; // Simplified - just epicenter for now

        const alerts = zones.map(zone => this.createAlert({ zone, severity }));

        this.broadcastLog({ type: 'scenario', epicenterZone, magnitude });

        return alerts;
    }

    handleAck(data) {
        const { alertId, workerId } = data;
        console.log(`ACK received from ${workerId} for alert ${alertId}`);

        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.ackedBy.add(workerId);

            // Cancel timeout for this alert
            if (alert.timeout) {
                clearTimeout(alert.timeout);
                this.activeAlerts.delete(alertId);

                // Cancel siren
                this.clients.sirens.forEach((client) => {
                    if (client.zones.includes(alert.zone)) {
                        client.emit('sirenCancel', { alertId });
                    }
                });
            }

            this.broadcastLog({ type: 'ack', alertId, workerId });
        }
    }

    handleAlertTimeout(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) return;

        console.log(`Alert timeout: ${alertId} - Triggering siren`);

        // Send siren to all sirens subscribed to this zone
        this.clients.sirens.forEach((client) => {
            if (client.zones.includes(alert.zone)) {
                console.log(`Triggering siren for zone ${alert.zone}`);
                client.emit('siren', {
                    alertId: alert.alertId,
                    zone: alert.zone,
                    severity: alert.severity
                });
            }
        });

        this.broadcastLog({ type: 'escalated', alertId: alert.alertId, zone: alert.zone });
        this.activeAlerts.delete(alertId);
    }

    broadcastDeviceCount() {
        const deviceCount = {
            bands: this.clients.bands.size,
            sirens: this.clients.sirens.size,
            dashboards: this.clients.dashboards.size
        };

        this.clients.dashboards.forEach((client) => {
            client.emit('deviceUpdate', deviceCount);
        });

        // Also broadcast to web app clients
        this.io.emit('deviceUpdate', deviceCount);
    }

    broadcastLog(logData) {
        this.clients.dashboards.forEach((client) => {
            client.emit('log', logData);
        });

        // Also broadcast to web app clients
        this.io.emit('log', logData);
    }

    getDeviceCount() {
        return {
            bands: this.clients.bands.size,
            sirens: this.clients.sirens.size,
            dashboards: this.clients.dashboards.size
        };
    }

    getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).map(alert => ({
            alertId: alert.alertId,
            zone: alert.zone,
            severity: alert.severity,
            timestamp: alert.timestamp,
            ackedBy: Array.from(alert.ackedBy)
        }));
    }
}

module.exports = new SocketService();
