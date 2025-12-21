import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme';
import { fetchCurrentRisk, triggerSimulationEvent } from '../services/api';

export default function ClimateScreen({ navigation }) {
    const [riskData, setRiskData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);

    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Slower refresh
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setError(null);
        const data = await fetchCurrentRisk();
        if (data) {
            setRiskData(data);
        } else {
            setError("Climate data unavailable.");
        }
    };

    const handleSimulateRain = async () => {
        setLoading(true);
        try {
            const result = await triggerSimulationEvent('rain');
            Alert.alert("Simulation Triggered", "Heavy rain event injected into the system.");
            loadData(); // Refresh immediately
        } catch (error) {
            Alert.alert("Error", "Failed to trigger simulation.");
        }
        setLoading(false);
    };

    if (!riskData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>⛈️ Climate Simulator</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    {error ? (
                        <>
                            <Text style={{ fontSize: 40, marginBottom: 10 }}>📡</Text>
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
                        <Text style={{ color: Colors.textPrimary, fontSize: 16 }}>Loading Climate Data...</Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    const weather = riskData.weather_data;
    const impact = riskData.weather_impact;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>⛈️ Climate Simulator</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Main Status Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.weatherCondition}>{weather.weather_condition}</Text>
                    <Text style={styles.temperature}>{weather.temperature}°C</Text>
                    <Text style={styles.subtitle}>Current Site Conditions</Text>
                </View>

                {/* Impact Analysis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Risk Impact Analysis</Text>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Base Risk Multiplier</Text>
                        <Text style={[styles.statValue, { color: Colors.riskHigh }]}>
                            +{(impact * 100).toFixed(1)}%
                        </Text>
                    </View>
                    <Text style={styles.description}>
                        Current weather conditions are increasing the base geotechnical risk by {(impact * 100).toFixed(1)}%.
                    </Text>
                </View>

                {/* Detailed Metrics */}
                <View style={styles.grid}>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Humidity</Text>
                        <Text style={styles.gridValue}>{weather.humidity}%</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Rain (1h)</Text>
                        <Text style={styles.gridValue}>{weather.rain_1h} mm</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Wind Speed</Text>
                        <Text style={styles.gridValue}>12 km/h</Text>
                    </View>
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Pressure</Text>
                        <Text style={styles.gridValue}>1012 hPa</Text>
                    </View>
                </View>

                {/* Simulation Controls */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Simulation Controls</Text>
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSimulateRain}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Simulating...' : '⚡ Trigger Storm Event'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.caption}>
                        Injects a synthetic heavy rain event to test system response.
                    </Text>
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
    mainCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    weatherCondition: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    temperature: {
        fontSize: 48,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: 8,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        padding: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: 8,
    },
    statLabel: {
        ...Typography.body,
        color: Colors.textSecondary,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    description: {
        ...Typography.caption,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    gridItem: {
        width: '47%',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    gridLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    gridValue: {
        ...Typography.h3,
        color: Colors.textPrimary,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    caption: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
