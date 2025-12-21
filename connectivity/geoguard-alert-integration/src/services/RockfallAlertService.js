import AlertSystemBridge from './bridges/AlertSystemBridge';

/**
 * Service to integrate rockfall predictions with alert system
 * Auto-triggers alerts when risk >= 80%
 */
class RockfallAlertService {
    constructor(serverUrl, zones, riskThreshold = 0.8) {
        this.serverUrl = serverUrl;
        this.zones = zones;
        this.riskThreshold = riskThreshold;
        this.initialized = false;
    }

    /**
     * Initialize alert system connection
     */
    async initialize() {
        if (this.initialized) return;

        try {
            await AlertSystemBridge.initialize(this.serverUrl, this.zones);
            this.initialized = true;
            console.log('RockfallAlertService initialized');
        } catch (error) {
            console.error('Failed to initialize RockfallAlertService:', error);
            throw error;
        }
    }

    /**
     * Process rockfall prediction and auto-trigger alert if needed
     * @param {object} prediction - Rockfall prediction from ML model
     * @param {number} prediction.risk - Risk score (0-1)
     * @param {string} prediction.zone - Mine zone
     * @param {object} prediction.sensorData - Raw sensor data
     * @returns {object|null} - Alert object if created, null otherwise
     */
    async processPrediction(prediction) {
        const { risk, zone, sensorData } = prediction;

        console.log(`Rockfall prediction: Zone=${zone}, Risk=${risk.toFixed(2)}`);

        // Auto-trigger alert if risk >= threshold (default 80%)
        if (risk >= this.riskThreshold) {
            console.log(`🚨 High risk detected! Creating alert for ${zone}`);

            // Calculate severity (1-3) based on risk
            const severity = this.calculateSeverity(risk);

            try {
                const alert = await AlertSystemBridge.createAlert(
                    zone,
                    severity,
                    {
                        source: 'ROCKFALL_PREDICTION',
                        riskScore: risk,
                        timestamp: Date.now(),
                        sensorData: sensorData,
                        autoTriggered: true
                    }
                );

                console.log(`Alert created:`, alert);
                return alert;
            } catch (error) {
                console.error('Failed to create alert:', error);
                throw error;
            }
        } else {
            console.log(`Risk below threshold (${risk.toFixed(2)} < ${this.riskThreshold}), no alert created`);
            return null;
        }
    }

    /**
     * Calculate alert severity from risk score
     * @param {number} risk - Risk score (0-1)
     * @returns {number} - Severity (1-3)
     */
    calculateSeverity(risk) {
        if (risk >= 0.95) return 3; // Critical
        if (risk >= 0.85) return 2; // High
        return 1; // Medium
    }

    /**
     * Manual alert creation (for testing or manual triggers)
     */
    async createManualAlert(zone, severity) {
        try {
            return await AlertSystemBridge.createAlert(zone, severity, {
                source: 'MANUAL',
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Failed to create manual alert:', error);
            throw error;
        }
    }

    /**
     * Enable worker mode on this device
     */
    async enableWorkerMode(workerId) {
        await this.initialize();
        return await AlertSystemBridge.enableWorkerMode(workerId);
    }

    /**
     * Enable siren mode on this device
     */
    async enableSirenMode() {
        await this.initialize();
        await AlertSystemBridge.enableAudio();
        return await AlertSystemBridge.enableSirenMode();
    }

    /**
     * Get current connection status
     */
    async getStatus() {
        return await AlertSystemBridge.getConnectionStatus();
    }

    /**
     * Cleanup
     */
    async cleanup() {
        await AlertSystemBridge.cleanup();
        this.initialized = false;
    }
}

export default RockfallAlertService;
