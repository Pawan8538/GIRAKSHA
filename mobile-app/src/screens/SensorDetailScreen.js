import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { sensorsService } from '../services/sensors'
import { COLORS } from '../utils/constants'

export default function SensorDetailScreen({ route }) {
  const { sensorId } = route.params
  const [sensor, setSensor] = useState(null)
  const [readings, setReadings] = useState([])

  useEffect(() => {
    loadSensor()
    loadReadings()
  }, [sensorId])

  const loadSensor = async () => {
    try {
      const data = await sensorsService.getById(sensorId)
      setSensor(data)
    } catch (error) {
      console.error('Failed to load sensor:', error)
    }
  }

  const loadReadings = async () => {
    try {
      const data = await sensorsService.getReadings(sensorId, 50)
      setReadings(data)
    } catch (error) {
      console.error('Failed to load readings:', error)
    }
  }

  if (!sensor) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{sensor.name || `Sensor ${sensor.id}`}</Text>
        <Text style={styles.subtitle}>Type: {sensor.type || 'Unknown'}</Text>
      </View>

      {readings.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>
          {readings.slice(0, 10).map((reading, index) => (
            <View key={index} style={styles.readingItem}>
              <Text style={styles.readingText}>
                {new Date(reading.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.readingValue}>
                {reading.value} {reading.unit || ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  readingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  readingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
})

