
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { COLORS } from '../utils/constants'
import { weatherService } from '../services/weather'

export default function ClimateScreen() {
    const [refreshing, setRefreshing] = useState(false)
    const [weather, setWeather] = useState({
        temp: '28°C',
        humidity: '65%',
        wind: '12 km/h',
        rain: '0 mm',
        forecast: [
            { day: 'Today', temp: '28°C', icon: '☀️' },
            { day: 'Tomorrow', temp: '27°C', icon: 'cloud' },
            { day: 'Wed', temp: '26°C', icon: 'rain' },
        ]
    })

    // ...

    const loadData = async () => {
        try {
            const data = await weatherService.getCurrentWeather()
            setWeather({
                temp: data.temp,
                humidity: data.humidity,
                wind: data.wind,
                rain: data.rain,
                forecast: data.forecast
            })
        } catch (error) {
            console.warn('Failed to load climate data', error)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const onRefresh = async () => {
        setRefreshing(true)
        await loadData()
        setRefreshing(false)
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.location}>Demo Mine Site</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>

            <View style={styles.mainCard}>
                <Text style={styles.mainTemp}>{weather.temp}</Text>
                <Text style={styles.condition}>Partly Cloudy</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Humidity</Text>
                        <Text style={styles.statValue}>{weather.humidity}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Wind</Text>
                        <Text style={styles.statValue}>{weather.wind}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Precipitation</Text>
                        <Text style={styles.statValue}>{weather.rain}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>3-Day Forecast</Text>
            <View style={styles.forecastContainer}>
                {weather.forecast.map((day, index) => (
                    <View key={index} style={styles.forecastItem}>
                        <Text style={styles.forecastDay}>{day.day}</Text>
                        <Text style={styles.forecastIcon}>{day.icon === 'rain' ? '🌧️' : day.icon === 'cloud' ? '☁️' : '☀️'}</Text>
                        <Text style={styles.forecastTemp}>{day.temp}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.alertCard}>
                <Text style={styles.alertTitle}>⚠️ Weather Alert</Text>
                <Text style={styles.alertText}>Heavy rainfall expected in the next 48 hours. Risk of landslides may increase.</Text>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    location: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    date: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    mainCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    mainTemp: {
        fontSize: 64,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    condition: {
        fontSize: 20,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    forecastContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    forecastItem: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: '30%',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    forecastDay: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    forecastIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    forecastTemp: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    alertCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.danger,
        marginBottom: 32,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.danger,
        marginBottom: 8,
    },
    alertText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
})
