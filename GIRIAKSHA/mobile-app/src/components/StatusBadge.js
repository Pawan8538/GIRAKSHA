import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

export function StatusBadge({ status, label }) {
    const getStatusColor = () => {
        switch (status) {
            case 'safe': return COLORS.success;
            case 'evacuating': return COLORS.warning;
            case 'danger': return COLORS.danger;
            case 'imminent': return '#7a0019';
            case 'high': return '#d62728';
            case 'medium': return '#ff7f0e';
            case 'low': return '#2ca02c';
            default: return COLORS.textSecondary;
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
