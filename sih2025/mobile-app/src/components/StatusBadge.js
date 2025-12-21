import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

export function StatusBadge({ status, label }) {
    const getStatusColor = () => {
        switch (status) {
            case 'safe': return Colors.success;
            case 'evacuating': return Colors.warning;
            case 'danger': return Colors.emergency;
            case 'imminent': return Colors.riskImminent;
            case 'high': return Colors.riskHigh;
            case 'medium': return Colors.riskMedium;
            case 'low': return Colors.riskLow;
            default: return Colors.textMuted;
        }
    };

    return (
        <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.badgeText}>{label || status.toUpperCase()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
