import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme';

import { fetchCurrentRisk } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export default function HomeScreen({ navigation }) {
    const [riskData, setRiskData] = React.useState(null);

    React.useEffect(() => {
        loadRiskData();
        const interval = setInterval(loadRiskData, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const loadRiskData = async () => {
        const data = await fetchCurrentRisk();
        console.log("HomeScreen received data:", data);
        if (data) setRiskData(data);
    };

    const getRiskBadgeColor = (risk) => {
        if (!risk) return Colors.surface;
        if (risk.enhanced_risk >= 0.8) return Colors.riskImminent;
        if (risk.enhanced_risk >= 0.6) return Colors.riskHigh;
        if (risk.enhanced_risk >= 0.4) return Colors.riskMedium;
        return Colors.riskLow;
    };

    const getRiskLabel = (score) => {
        if (score >= 0.75) return 'Danger';
        if (score >= 0.60) return 'High';
        if (score >= 0.35) return 'Medium';
        return 'Low';
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>GeoGuard</Text>
                <Text style={styles.subtitle}>Limestone Mine • Site A</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {riskData ? `${getRiskLabel(riskData.enhanced_risk).toUpperCase()} RISK` : 'CONNECTING...'}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.menu} contentContainerStyle={{ gap: Spacing.md, paddingBottom: 20 }}>
                <View style={styles.row}>
                    {/* 1. Risk Map (Primary Feature) */}
                    <TouchableOpacity
                        style={[styles.card, styles.mapCard, { flex: 2 }]}
                        onPress={() => navigation.navigate('Map')}
                    >
                        <Text style={styles.cardIcon}>🗺️</Text>
                        <Text style={styles.cardTitle}>Risk Map</Text>
                        <Text style={styles.cardDesc}>Live Heatmap & Zones</Text>
                        <View style={styles.cardFooter}>
                            <Text style={[styles.cardFooterText, { color: Colors.primary }]}>
                                {riskData ? `${getRiskLabel(riskData.enhanced_risk)} Risk` : 'Loading...'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    {/* 2. Climate (Half Width) */}
                    <TouchableOpacity
                        style={[styles.card, styles.halfCard]}
                        onPress={() => navigation.navigate('Climate')}
                    >
                        <Text style={styles.cardIcon}>⛈️</Text>
                        <Text style={styles.cardTitle}>Climate</Text>
                        <Text style={styles.cardDesc}>Rainfall Impact</Text>
                    </TouchableOpacity>

                    {/* 3. Prediction (Half Width) */}
                    <TouchableOpacity
                        style={[styles.card, styles.halfCard]}
                        onPress={() => navigation.navigate('Prediction')}
                    >
                        <Text style={styles.cardIcon}>📉</Text>
                        <Text style={styles.cardTitle}>Predict</Text>
                        <Text style={styles.cardDesc}>Future Trends</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    {/* 4. Evacuation (Full Width) */}
                    <TouchableOpacity
                        style={[styles.card, styles.evacCard, { flex: 1 }]}
                        onPress={() => navigation.navigate('Evacuation')}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={styles.cardIcon}>📢</Text>
                                <Text style={[styles.cardTitle, { color: Colors.emergency }]}>Evacuation</Text>
                            </View>
                            <StatusBadge status="active" />
                        </View>
                        <Text style={styles.cardDesc}>Emergency</Text>
                    </TouchableOpacity>
                </View>

                {/* 5. Report Hazard (Full Width) */}
                <TouchableOpacity
                    style={[styles.card, styles.reportCard]}
                    onPress={() => navigation.navigate('Report')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.cardIcon, { marginBottom: 0, marginRight: 12 }]}>📸</Text>
                        <View>
                            <Text style={styles.cardTitle}>Report Hazard</Text>
                            <Text style={[styles.cardDesc, { marginBottom: 0 }]}>Upload photos for AI Analysis</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Last updated: {riskData ? new Date().toLocaleTimeString() : '...'}
                </Text>
                {riskData && (
                    <View>
                        <Text style={[styles.footerText, { fontSize: 10, marginTop: 4 }]}>
                            Weather: {riskData.weather_data.weather_condition} • {riskData.weather_data.temperature}°C
                        </Text>
                        <Text style={[styles.footerText, { fontSize: 10, color: Colors.riskHigh }]}>
                            Climate Impact: +{(riskData.weather_impact * 100).toFixed(1)}% Risk
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: Spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    badge: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    badgeText: {
        ...Typography.caption,
        color: Colors.primary,
        fontWeight: '600',
    },
    menu: {
        flex: 1,
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    halfCard: {
        flex: 1,
        minHeight: 120,
    },
    card: {
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        minHeight: 140,
    },
    mapCard: {
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        borderColor: Colors.primary,
    },
    evacCard: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderColor: Colors.emergency,
    },
    reportCard: {
        backgroundColor: Colors.surface,
        borderColor: Colors.border,
    },
    cardIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    cardTitle: {
        ...Typography.h3,
        marginBottom: 6,
    },
    cardDesc: {
        ...Typography.caption,
        marginBottom: 12,
    },
    cardFooter: {
        marginTop: 'auto',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    cardFooterText: {
        ...Typography.small,
        fontWeight: '600',
    },
    footer: {
        padding: Spacing.md,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    footerText: {
        ...Typography.small,
    },
});
