import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import AlertSystemBridge from '../bridges/AlertSystemBridge';

/**
 * Worker Band Screen - Shows alerts and ACK button
 * Integrates with GeoGuard rockfall monitoring
 */
const WorkerBandScreen = ({ workerId, zones, serverUrl }) => {
    const [connected, setConnected] = useState(false);
    const [activeAlert, setActiveAlert] = useState(null);
    const [alertHistory, setAlertHistory] = useState([]);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        initializeWorkerMode();

        return () => {
            AlertSystemBridge.cleanup();
            AlertSystemBridge.removeAllListeners();
        };
    }, []);

    const initializeWorkerMode = async () => {
        try {
            // Initialize alert system
            await AlertSystemBridge.initialize(serverUrl, zones);
            await AlertSystemBridge.enableWorkerMode(workerId);

            // Listen for connection state
            AlertSystemBridge.onConnectionStateChanged((state) => {
                setConnected(state === 'CONNECTED');
            });

            // Listen for alerts
            AlertSystemBridge.onAlert((alert) => {
                console.log('Alert received:', alert);
                setActiveAlert(alert);
                setCountdown(15); // 15 second ACK countdown

                // Add to history
                setAlertHistory(prev => [{
                    ...alert,
                    receivedAt: new Date(),
                    status: 'PENDING'
                }, ...prev]);
            });

            console.log('Worker mode initialized');
        } catch (error) {
            Alert.alert('Error', 'Failed to initialize worker mode: ' + error.message);
        }
    };

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && activeAlert) {
            handleTimeout();
        }
    }, [countdown]);

    const handleAck = async () => {
        if (!activeAlert) return;

        try {
            await AlertSystemBridge.sendAck(activeAlert.alertId, workerId);

            // Update history
            setAlertHistory(prev =>
                prev.map(alert =>
                    alert.alertId === activeAlert.alertId
                        ? { ...alert, status: 'ACKNOWLEDGED', ackedAt: new Date() }
                        : alert
                )
            );

            setActiveAlert(null);
            setCountdown(null);

            Alert.alert('Success', 'Alert acknowledged!');
        } catch (error) {
            Alert.alert('Error', 'Failed to send ACK: ' + error.message);
        }
    };

    const handleTimeout = () => {
        console.log('Alert timeout - escalating to siren');

        setAlertHistory(prev =>
            prev.map(alert =>
                alert.alertId === activeAlert.alertId
                    ? { ...alert, status: 'ESCALATED' }
                    : alert
            )
        );

        setActiveAlert(null);
        setCountdown(null);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Worker Band: {workerId}</Text>
                <View style={[styles.statusBadge, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]}>
                    <Text style={styles.statusText}>{connected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
                </View>
                <Text style={styles.zones}>Zones: {zones.join(', ')}</Text>
                <Text style={styles.transmission}>📡 LoRa 9600 baud</Text>
            </View>

            {activeAlert && (
                <View style={styles.alertCard}>
                    <Text style={styles.alertTitle}>⚠️ ALERT: {activeAlert.zone}</Text>
                    <Text style={styles.alertSeverity}>Severity {activeAlert.severity}</Text>
                    <Text style={styles.alertId}>Alert ID: {activeAlert.alertId}</Text>
                    <Text style={styles.countdown}>ACK in {countdown}s</Text>

                    <TouchableOpacity style={styles.ackButton} onPress={handleAck}>
                        <Text style={styles.ackButtonText}>ACKNOWLEDGE</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Alert History</Text>
                {alertHistory.map((alert, index) => (
                    <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyZone}>{alert.zone}</Text>
                        <Text style={styles.historyStatus}>{alert.status}</Text>
                        <Text style={styles.historyTime}>
                            {alert.receivedAt?.toLocaleTimeString()}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#2196F3',
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    zones: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
    },
    transmission: {
        color: '#E3F2FD',
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
    alertCard: {
        margin: 16,
        padding: 20,
        backgroundColor: '#FFEB3B',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#F57C00',
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 8,
    },
    alertSeverity: {
        fontSize: 16,
        color: '#F57C00',
        marginBottom: 4,
    },
    alertId: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    countdown: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D32F2F',
        marginBottom: 16,
    },
    ackButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    ackButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    historySection: {
        margin: 16,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    historyItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 4,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    historyZone: {
        fontWeight: 'bold',
    },
    historyStatus: {
        color: '#666',
    },
    historyTime: {
        fontSize: 12,
        color: '#999',
    },
});

export default WorkerBandScreen;
