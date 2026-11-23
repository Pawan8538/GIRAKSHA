const { Server } = require('socket.io');
const mlService = require('../src/services/ml.service');
const sensorService = require('../src/services/sensor.service');

/**
 * GIRAKSHA Multi-Device Real-Time Socket Service (Paper Section 4.3)
 * Manages persistent bi-directional communication between:
 * 1. Field Worker Smart Bands
 * 2. Zone Acoustic Siren Units
 * 3. Administrative & Government Authority Dashboards
 */
class SocketService {
    constructor() {
        this.io = null;
        this.clients = {
            bands: new Map(),
            sirens: new Map(),
            dashboards: new Map()
        };
        this.activeAlerts = new Map();
        this.ACK_TIMEOUT = 15000; // 15 seconds strict window (Paper Table 6: TC06, TC07)
        this.SECONDARY_TIMEOUT = 60000; // 60s secondary window for Super Admin escalation
        
        // Centralized Polling State (Render Free-Tier Optimized)
        this.pollingInterval = null;
        this.pollCount = 0;
        this.POLL_RATE = 15000; // 15 seconds
    }

    initialize(io) {
        this.io = io;

        this.io.on('connection', (socket) => {
            console.log('📡 [GIRAKSHA Socket] Client connected:', socket.id);
            this.handleConnection(socket);
        });

        console.log('✅ [GIRAKSHA Socket] Real-Time Alert & Escalation Service Attached');
    }

    handleConnection(socket) {
        // Register device role
        socket.on('register', (data = {}) => {
            const { role, zones = [], workerId } = data;
            console.log(`📱 [GIRAKSHA Register] Role: ${role || 'dashboard'} | Worker/ID: ${workerId || socket.id} | Zones:`, zones);

            socket.role = role || 'dashboard';
            socket.zones = zones;
            socket.workerId = workerId;

            if (role === 'band') {
                this.clients.bands.set(socket.id, socket);
            } else if (role === 'siren') {
                this.clients.sirens.set(socket.id, socket);
            } else {
                this.clients.dashboards.set(socket.id, socket);
                this.pushInitialData(socket);
                this.updatePollingStatus();
            }

            this.broadcastDeviceCount();
        });

        // Smart Band ACK received (Paper Section 4.3 & TC06)
        socket.on('ack', (data) => {
            this.handleAck(data);
        });

        // Worker SOS Button Pressed on Smart Band (Paper Section 4.1 & TC10: <300ms latency)
        socket.on('sos', (data) => {
            this.handleWorkerSOS(socket, data);
        });

        // Manual alert trigger from admin dashboard
        socket.on('createAlert', (data) => {
            this.createAlert(data);
        });

        // Rockfall Simulation Scenario trigger
        socket.on('createScenario', (data) => {
            this.createRockfallScenario(data);
        });

        socket.on('disconnect', () => {
            console.log('ℹ️ [GIRAKSHA Socket] Client disconnected:', socket.id);
            this.clients.bands.delete(socket.id);
            this.clients.sirens.delete(socket.id);
            this.clients.dashboards.delete(socket.id);
            this.broadcastDeviceCount();
            this.updatePollingStatus();
        });
    }

    updatePollingStatus() {
        if (this.clients.dashboards.size > 0 && !this.pollingInterval) {
            console.log('🚀 [GIRAKSHA] Dashboards active. Starting live 15s sensor & risk push...');
            this.startPolling();
        } else if (this.clients.dashboards.size === 0 && this.pollingInterval) {
            console.log('💤 [GIRAKSHA] No active dashboards. Pausing background push.');
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async pushInitialData(socket) {
        try {
            const [sensors, risk, grid] = await Promise.all([
                sensorService.getSensors(),
                mlService.getCurrentRisk(),
                mlService.getRiskGrid()
            ]);

            socket.emit('sensorData', sensors);
            socket.emit('mlRiskUpdate', { risk, explanation: null });
            socket.emit('heatmapData', grid.grid || grid);
        } catch (err) {
            console.warn('[GIRAKSHA Socket] Initial push fallback:', err.message);
        }
    }

    async startPolling() {
        this.pollCount = 0;

        this.pollingInterval = setInterval(async () => {
            this.pollCount++;
            try {
                // 1. Sensors push (every 15s)
                try {
                    const sensors = await sensorService.getSensors();
                    this.clients.dashboards.forEach(client => client.emit('sensorData', sensors));
                } catch (e) { }

                // 2. ML Risk push (every 30s)
                if (this.pollCount % 2 === 0) {
                    try {
                        const risk = await mlService.getCurrentRisk();
                        if (risk) {
                            const slopeId = risk.slopeId || 'slope_1';
                            const explanation = await mlService.explain({ predictionId: 'current', slopeId });

                            this.clients.dashboards.forEach(client => {
                                client.emit('mlRiskUpdate', { risk, explanation });
                            });

                            // Auto-trigger emergency protocol if risk score reaches High or Imminent (>= 0.60)
                            if (risk.risk_score >= 0.60) {
                                this.createAlert({
                                    zone: 'Zone-3 (North Highwall)',
                                    severity: risk.risk_score >= 0.75 ? 3 : 2,
                                    riskScore: risk.risk_score,
                                    autoTriggered: true
                                });
                            }
                        }
                    } catch (e) { }
                }

                // 3. 20×20 IDW Heatmap push (every 45s)
                if (this.pollCount % 3 === 0) {
                    try {
                        const grid = await mlService.getRiskGrid();
                        if (grid && grid.grid) {
                            this.clients.dashboards.forEach(client => client.emit('heatmapData', grid.grid));
                        }
                    } catch (e) { }
                }
            } catch (err) {
                console.error('[GIRAKSHA Socket] Polling Loop Error:', err.message);
            }
        }, this.POLL_RATE);
    }

    /**
     * Create Emergency Alert & Open 15-Second ACK Window (Paper Section 4.3)
     */
    createAlert(data) {
        const { zone = 'Zone-3', severity = 3, riskScore = 0.85, source = 'ML_RISK_TRIGGER' } = data;
        const alertId = `ALERT-${Date.now()}-${zone.replace(/\s+/g, '_')}`;

        console.log(`🚨 [GIRAKSHA Alert] Generated: ${alertId} | Zone: ${zone} | Severity: ${severity} | Score: ${riskScore}`);

        const alertPayload = {
            alertId,
            zone,
            severity, // 1: Medium, 2: High, 3: Imminent/Critical
            riskScore,
            source,
            timestamp: Date.now(),
            ackTimeoutMs: this.ACK_TIMEOUT,
            recommendedExit: "North Bench Main Exit 1",
            vibrationPattern: "EMERGENCY_PULSE_FAST"
        };

        // 1. Dispatch real-time emergency alert to all Smart Bands in affected zone (Paper TC05: <500ms)
        let bandsNotified = 0;
        this.clients.bands.forEach((client) => {
            if (client.zones.length === 0 || client.zones.includes(zone)) {
                client.emit('alert', alertPayload);
                bandsNotified++;
            }
        });

        // 2. Also notify Dashboards
        this.clients.dashboards.forEach((client) => {
            client.emit('emergencyAlertCreated', alertPayload);
        });

        // 3. Start 15-second strict escalation timer
        const timeoutHandle = setTimeout(() => {
            this.handleAlertTimeout(alertId);
        }, this.ACK_TIMEOUT);

        this.activeAlerts.set(alertId, {
            ...alertPayload,
            ackedBy: new Set(),
            timeout: timeoutHandle,
            status: 'PENDING_ACK'
        });

        this.broadcastLog({
            type: 'ALERT_DISPATCHED',
            alertId,
            zone,
            severity,
            bandsNotified,
            window: '15 seconds'
        });

        return alertPayload;
    }

    /**
     * Handle Smart Band Worker ACK (Paper TC06: timer cancelled, status updated)
     */
    handleAck(data) {
        const { alertId, workerId = 'worker' } = data;
        console.log(`✅ [GIRAKSHA ACK] Received from worker ${workerId} for ${alertId}`);

        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.ackedBy.add(workerId);
            alert.status = 'ACKNOWLEDGED';

            // Cancel siren escalation timer immediately
            if (alert.timeout) {
                clearTimeout(alert.timeout);
                alert.timeout = null;
            }

            // Cancel any activated sirens for this alert
            this.clients.sirens.forEach((client) => {
                if (client.zones.includes(alert.zone)) {
                    client.emit('sirenCancel', { alertId });
                }
            });

            // Notify dashboards of successful worker acknowledgment
            this.clients.dashboards.forEach((client) => {
                client.emit('alertAcknowledged', {
                    alertId,
                    workerId,
                    zone: alert.zone,
                    status: 'ACKNOWLEDGED',
                    timestamp: Date.now()
                });
            });

            this.broadcastLog({ type: 'ACK_CONFIRMED', alertId, workerId, zone: alert.zone });
        }
    }

    /**
     * Handle 15-Second ACK Timeout (Paper Section 4.3 & TC07: Siren activated + Gov Auth notified with thermal link)
     */
    handleAlertTimeout(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert || alert.status === 'ACKNOWLEDGED') return;

        console.warn(`⚡ [GIRAKSHA ESCALATION] 15s ACK window expired for ${alertId}! Triggering hardware sirens & escalating to Government Authority...`);

        alert.status = 'ESCALATED_UNACKNOWLEDGED';

        // 1. Activate zone physical acoustic sirens (Paper TC07)
        let sirensTriggered = 0;
        this.clients.sirens.forEach((client) => {
            if (client.zones.length === 0 || client.zones.includes(alert.zone)) {
                client.emit('siren', {
                    alertId: alert.alertId,
                    zone: alert.zone,
                    severity: alert.severity,
                    pattern: 'CONTINUOUS_HIGH_PITCH'
                });
                sirensTriggered++;
            }
        });

        // 2. Escalate to Site Admin & Government Authority Dashboards with attached LWIR thermal camera feed URL
        const escalationPayload = {
            alertId: alert.alertId,
            zone: alert.zone,
            severity: alert.severity,
            status: 'ESCALATED_UNACKNOWLEDGED',
            sirensTriggered,
            escalatedAt: Date.now(),
            thermalVerification: {
                cameraId: 'CAM_LWIR_NORTH_SLOPE',
                streamUrl: '/static/thermal/north_wall_stream.m3u8',
                location: 'North Highwall Bench 3',
                message: 'INDEPENDENT EVACUATION VERIFICATION REQUIRED: Review thermal video feed to verify workers have cleared danger zone.'
            }
        };

        this.clients.dashboards.forEach((client) => {
            client.emit('escalateToAuthority', escalationPayload);
        });

        // 3. Secondary 60-second window -> escalate to Super Admin if still uncleared
        setTimeout(() => {
            const currentAlert = this.activeAlerts.get(alertId);
            if (currentAlert && currentAlert.status === 'ESCALATED_UNACKNOWLEDGED') {
                console.warn(`🚨 [GIRAKSHA] Secondary window expired for ${alertId}. Escalating to Super Administrator.`);
                this.clients.dashboards.forEach((client) => {
                    client.emit('escalateToSuperAdmin', {
                        alertId,
                        zone: alert.zone,
                        severity: 'CRITICAL',
                        message: 'SUPER ADMIN ESCALATION: Mine sector remains unconfirmed evacuated.'
                    });
                });
            }
        }, this.SECONDARY_TIMEOUT);

        this.broadcastLog({
            type: 'ESCALATED_TO_AUTHORITY',
            alertId: alert.alertId,
            zone: alert.zone,
            sirensActive: sirensTriggered,
            thermalStreamAttached: true
        });
    }

    /**
     * Handle Field Worker SOS Button (Paper TC10: <300ms broadcast to all admins)
     */
    handleWorkerSOS(socket, data = {}) {
        const t0 = Date.now();
        const { workerId = socket.workerId || 'Worker', zone = 'Zone-3', coords } = data;
        const sosId = `SOS-${Date.now()}-${workerId}`;

        console.log(`🆘 [GIRAKSHA SOS] Emergency raised by worker: ${workerId} at zone: ${zone}`);

        const sosPayload = {
            sosId,
            workerId,
            zone,
            coords: coords || { lat: 11.1053, lon: 79.1506 },
            timestamp: t0,
            priority: 'MAXIMUM_CRITICAL',
            title: '🆘 WORKER EMERGENCY SOS'
        };

        // Broadcast to ALL connected dashboards, sirens, and admin clients immediately
        this.io.emit('workerSOS', sosPayload);

        const latency = Date.now() - t0;
        console.log(`✅ [GIRAKSHA SOS] Broadcast completed in ${latency}ms (Paper target: <300ms)`);

        this.broadcastLog({ type: 'SOS_BROADCAST', sosId, workerId, latencyMs: latency });
    }

    /**
     * Create Rockfall Instability Scenarios (replaces obsolete earthquake scenarios)
     */
    createRockfallScenario(data = {}) {
        const { scenarioType = 'RAPID_CREEP_ACCELERATION', zone = 'Zone-3' } = data;
        console.log(`⚠️ [GIRAKSHA Scenario] Starting simulation: ${scenarioType} in ${zone}`);

        const severityMap = {
            'RAPID_CREEP_ACCELERATION': 3,
            'HEAVY_MONSOON_INUNDATION': 2,
            'BLAST_TREMOR_SHOCK': 3,
            'BENCH_CREEP_DRIFT': 1
        };

        const alert = this.createAlert({
            zone,
            severity: severityMap[scenarioType] || 2,
            riskScore: scenarioType === 'RAPID_CREEP_ACCELERATION' ? 0.88 : 0.68,
            source: `SCENARIO_${scenarioType}`
        });

        this.broadcastLog({ type: 'SCENARIO_STARTED', scenarioType, zone });
        return alert;
    }

    broadcastDeviceCount() {
        const deviceCount = {
            bands: this.clients.bands.size,
            sirens: this.clients.sirens.size,
            dashboards: this.clients.dashboards.size
        };

        this.clients.dashboards.forEach(client => client.emit('deviceUpdate', deviceCount));
        if (this.io) this.io.emit('deviceUpdate', deviceCount);
    }

    broadcastLog(logData) {
        const entry = {
            ...logData,
            timestamp: new Date().toLocaleTimeString()
        };
        this.clients.dashboards.forEach(client => client.emit('log', entry));
        if (this.io) this.io.emit('log', entry);
    }

    getDeviceCount() {
        return {
            bands: this.clients.bands.size,
            sirens: this.clients.sirens.size,
            dashboards: this.clients.dashboards.size
        };
    }

    getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).map(a => ({
            alertId: a.alertId,
            zone: a.zone,
            severity: a.severity,
            status: a.status,
            timestamp: a.timestamp,
            ackedBy: Array.from(a.ackedBy || [])
        }));
    }
}

module.exports = new SocketService();
