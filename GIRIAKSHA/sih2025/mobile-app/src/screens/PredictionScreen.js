import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme';
import { fetchCurrentRisk } from '../services/api';

export default function PredictionScreen({ navigation }) {
    const [riskData, setRiskData] = React.useState(null);

    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Slower refresh to reduce load
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setError(null);
        const data = await fetchCurrentRisk();
        if (data) {
            setRiskData(data);
        } else {
            setError("Failed to connect to prediction engine.");
        }
    };

    const getRiskColor = (score) => {
        if (score >= 0.8) return Colors.riskImminent;
        if (score >= 0.6) return Colors.riskHigh;
        if (score >= 0.4) return Colors.riskMedium;
        return Colors.riskLow;
    };

    if (!riskData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>📉 Prediction Engine</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    {error ? (
                        <>
                            <Text style={{ fontSize: 40, marginBottom: 10 }}>⚠️</Text>
                            <Text style={{ color: Colors.textPrimary, fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                onPress={loadData}
                                style={{ backgroundColor: Colors.primary, padding: 12, borderRadius: 8 }}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry Connection</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={{ color: Colors.textPrimary, fontSize: 16 }}>Analyzing Risk Factors...</Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    const riskScore = riskData.enhanced_risk;
    const riskColor = getRiskColor(riskScore);
    const sensors = riskData.sources.sensors;
    const vision = riskData.sources.visual;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>📉 Prediction Engine</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Risk Score */}
                <View style={[styles.scoreCard, { borderColor: riskColor }]}>
                    <Text style={styles.scoreLabel}>Current Risk Probability</Text>
                    <Text style={[styles.scoreValue, { color: riskColor }]}>
                        {(riskScore * 100).toFixed(1)}%
                    </Text>
                    <Text style={[styles.scoreStatus, { backgroundColor: riskColor }]}>
                        {riskScore >= 0.8 ? 'CRITICAL' : riskScore >= 0.6 ? 'HIGH' : riskScore >= 0.4 ? 'MODERATE' : 'LOW'}
                    </Text>
                </View>

                {/* Alerts */}
                {riskData.alerts.length > 0 && (
                    <View style={styles.alertSection}>
                        <Text style={styles.sectionTitle}>⚠️ Active Alerts</Text>
                        {riskData.alerts.map((alert, index) => (
                            <View key={index} style={styles.alertItem}>
                                <Text style={styles.alertText}>{alert}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Factor Breakdown */}
                <Text style={styles.sectionTitle}>Risk Factor Breakdown</Text>

                {/* 1. Geotechnical Sensors */}
                <View style={styles.factorCard}>
                    <View style={styles.factorHeader}>
                        <Text style={styles.factorTitle}>📡 Sensor Network</Text>
                        <Text style={styles.factorWeight}>Weight: 40%</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Max Displacement</Text>
                        <Text style={styles.value}>{sensors.max_disp_mm.toFixed(2)} mm</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Pore Pressure</Text>
                        <Text style={styles.value}>{sensors.max_pore_kpa.toFixed(1)} kPa</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Vibration</Text>
                        <Text style={styles.value}>{sensors.max_vib_g.toFixed(3)} g</Text>
                    </View>
                    <Text style={styles.subtext}>{sensors.active_sensors} sensors active</Text>
                </View>

                {/* 2. Computer Vision */}
                <View style={styles.factorCard}>
                    <View style={styles.factorHeader}>
                        <Text style={styles.factorTitle}>👁️ Computer Vision</Text>
                        <Text style={styles.factorWeight}>Weight: 30%</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Crack Probability</Text>
                        <Text style={styles.value}>{(vision.risk_score * 100).toFixed(1)}%</Text>
                    </View>
                    <Text style={styles.subtext}>Last scan: {vision.last_check ? new Date(vision.last_check).toLocaleTimeString() : 'Never'}</Text>
                </View>

                {/* 3. Climate Impact */}
                <View style={styles.factorCard}>
                    <View style={styles.factorHeader}>
                        <Text style={styles.factorTitle}>⛈️ Climate Multiplier</Text>
                        <Text style={styles.factorWeight}>Variable</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Risk Amplification</Text>
                        <Text style={[styles.value, { color: Colors.riskHigh }]}>
                            +{(riskData.weather_impact * 100).toFixed(1)}%
                        </Text>
                    </View>
                    <Text style={styles.subtext}>Based on rainfall intensity & saturation</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: 16,
    },
    title: {
        ...Typography.h2,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.lg,
    },
    scoreCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        marginBottom: Spacing.xl,
        borderWidth: 2,
    },
    scoreLabel: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 56,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    scoreStatus: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        color: '#fff',
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    alertSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    alertItem: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        padding: Spacing.md,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: Colors.emergency,
        marginBottom: 8,
    },
    alertText: {
        color: Colors.emergency,
        fontWeight: '600',
    },
    factorCard: {
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    factorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        paddingBottom: 8,
    },
    factorTitle: {
        ...Typography.h3,
        fontSize: 18,
    },
    factorWeight: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
    },
    value: {
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    subtext: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
});
