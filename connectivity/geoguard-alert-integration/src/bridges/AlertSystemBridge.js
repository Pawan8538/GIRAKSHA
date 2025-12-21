import { NativeModules, NativeEventEmitter } from 'react-native';

const { AlertSystemModule } = NativeModules;
const alertEventEmitter = new NativeEventEmitter(AlertSystemModule);

/**
 * React Native bridge for native alert system
 */
class AlertSystemBridge {
    /**
     * Initialize alert system
     * @param {string} serverUrl - WebSocket server URL (e.g., "10.0.75.150:3000")
     * @param {string[]} zones - Mine zones to monitor (e.g., ["Unit-1", "Unit-2", "Unit-3"])
     */
    static async initialize(serverUrl, zones) {
        try {
            return await AlertSystemModule.initialize(serverUrl, zones);
        } catch (error) {
            console.error('AlertSystem initialization failed:', error);
            throw error;
        }
    }

    /**
     * Enable worker mode (vibration alerts + ACK capability)
     * @param {string} workerId - Unique worker identifier
     */
    static async enableWorkerMode(workerId) {
        return await AlertSystemModule.enableWorkerMode(workerId);
    }

    /**
     * Enable siren mode (audio alerts)
     */
    static async enableSirenMode() {
        return await AlertSystemModule.enableSirenMode();
    }

    /**
     * Send acknowledgment for an alert
     * @param {string} alertId - Alert identifier
     * @param {string} workerId - Worker identifier
     */
    static async sendAck(alertId, workerId) {
        return await AlertSystemModule.sendAck(alertId, workerId);
    }

    /**
     * Create alert (triggered by rockfall prediction)
     * @param {string} zone - Mine zone
     * @param {number} severity - Severity level (1-3)
     * @param {object} metadata - Additional data (risk score, etc.)
     */
    static async createAlert(zone, severity, metadata = {}) {
        return await AlertSystemModule.createAlert(zone, severity, metadata);
    }

    /**
     * Auto-create alert from rockfall prediction
     * @param {object} prediction - Rockfall prediction data
     * @param {number} prediction.risk - Risk score (0-1)
     * @param {string} prediction.zone - Mine zone
     * @param {number} thresholdRisk - Minimum risk to trigger alert (default: 0.8)
     */
    static async handleRockfallPrediction(prediction, thresholdRisk = 0.8) {
        if (prediction.risk >= thresholdRisk) {
            const severity = Math.min(3, Math.ceil(prediction.risk * 3));

            return await this.createAlert(
                prediction.zone,
                severity,
                {
                    source: 'ROCKFALL_PREDICTION',
                    riskScore: prediction.risk,
                    timestamp: Date.now(),
                    ...prediction.metadata
                }
            );
        }
        return null;
    }

    /**
     * Test alarm sound
     */
    static async testAlarm() {
        return await AlertSystemModule.testAlarm();
    }

    /**
     * Enable audio (required for siren mode)
     */
    static async enableAudio() {
        return await AlertSystemModule.enableAudio();
    }

    /**
     * Get connection status
     */
    static async getConnectionStatus() {
        return await AlertSystemModule.getConnectionStatus();
    }

    /**
     * Cleanup resources
     */
    static async cleanup() {
        return await AlertSystemModule.cleanup();
    }

    // Event Listeners

    /**
     * Listen for connection state changes
     * @param {function} callback - (state: string) => void
     * @returns {object} Subscription
     */
    static onConnectionStateChanged(callback) {
        return alertEventEmitter.addListener('AlertSystem:ConnectionState', callback);
    }

    /**
     * Listen for incoming alerts
     * @param {function} callback - (alert: {alertId, zone, severity, timestamp}) => void
     * @returns {object} Subscription
     */
    static onAlert(callback) {
        return alertEventEmitter.addListener('AlertSystem:Alert', callback);
    }

    /**
     * Listen for siren activation
     * @param {function} callback - (siren: {alertId, zone, severity}) => void
     * @returns {object} Subscription
     */
    static onSiren(callback) {
        return alertEventEmitter.addListener('AlertSystem:Siren', callback);
    }

    /**
     * Listen for siren cancellation
     * @param {function} callback - (cancel: {alertId}) => void
     * @returns {object} Subscription
     */
    static onSirenCancel(callback) {
        return alertEventEmitter.addListener('AlertSystem:SirenCancel', callback);
    }

    /**
     * Remove all listeners
     */
    static removeAllListeners() {
        alertEventEmitter.removeAllListeners('AlertSystem:ConnectionState');
        alertEventEmitter.removeAllListeners('AlertSystem:Alert');
        alertEventEmitter.removeAllListeners('AlertSystem:Siren');
        alertEventEmitter.removeAllListeners('AlertSystem:SirenCancel');
    }
}

export default AlertSystemBridge;
