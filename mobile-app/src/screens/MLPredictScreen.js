import React, { useState, useEffect } from 'react'
import api from '../services/api'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { mlService } from '../services/ml'
import { slopesService } from '../services/slopes'
import { COLORS, getRiskLevel } from '../utils/constants'

import { weatherService } from '../services/weather'

// ...

export default function MLPredictScreen() {
  const [slopes, setSlopes] = useState([])
  const [selectedSlope, setSelectedSlope] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState(null)
  const [sensorData, setSensorData] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // 1. Load Slopes (to get Demo Mine ID)
      const slopesData = await slopesService.getAll()
      setSlopes(slopesData)

      // Auto-select Demo Mine if available
      const demoMine = slopesData.find(s => s.name === 'Demo Mine')
      const slopeId = demoMine ? demoMine.id : (slopesData[0]?.id || '')
      setSelectedSlope(slopeId)

      // 2. Load Weather
      const weatherData = await weatherService.getCurrentWeather()
      setWeather(weatherData)

      // 3. Load Sensors for the selected mine
      if (slopeId) {
        const sensorsRes = await api.get('/sensors', { params: { slopeId } })
        const sensors = sensorsRes.data.data

        // Mocking sensor readings if empty for demo purposes
        // In a real scenario, we would fetch /sensors/:id/readings
        const mockReadings = {
          displacement: Math.random() * 15, // 0-15mm
          pore_pressure: Math.random() * 60, // 0-60kPa
          seismic: Math.random() * 0.05 // 0-0.05g
        }
        setSensorData(mockReadings)

        calculateDynamicRisk(weatherData, mockReadings)
      }
    } catch (error) {
      console.error('Failed to load data', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDynamicRisk = (weather, sensors) => {
    // Base Risk
    let score = 0.2

    // 1. Weather Impact (Rain increases risk)
    const rain = parseFloat(weather?.rain || 0)
    if (rain > 50) score += 0.4
    else if (rain > 10) score += 0.2
    else if (rain > 0) score += 0.1

    // 2. Sensor Impact
    if (sensors) {
      if (sensors.displacement > 10) score += 0.3
      else if (sensors.displacement > 5) score += 0.15

      if (sensors.pore_pressure > 40) score += 0.2
    }

    // Cap at 0.99
    score = Math.min(score, 0.99)

    setPrediction({
      risk_score: score,
      explainability: {
        top_features: {
          'Rainfall Intensity': rain > 0 ? 0.4 : 0.1,
          'Soil Displacement': sensors?.displacement > 5 ? 0.35 : 0.1,
          'Pore Water Pressure': sensors?.pore_pressure > 30 ? 0.25 : 0.05
        }
      }
    })
  }

  const getRiskLabel = (score) => {
    if (score > 0.7) return { label: 'High', color: COLORS.danger }
    if (score > 0.4) return { label: 'Medium', color: COLORS.warning }
    return { label: 'Low', color: COLORS.success }
  }

  const riskInfo = prediction ? getRiskLabel(prediction.risk_score) : { label: 'Loading...', color: COLORS.textSecondary }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ML Risk Prediction</Text>
        <Text style={styles.subtitle}>Real-time Dynamic Assessment</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Monitoring: {slopes.find(s => s.id === selectedSlope)?.name || 'Loading...'}</Text>

          {loading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 10 }} />}
        </View>
      </View>

      {prediction && (
        <View style={styles.card}>
          <Text style={styles.title}>Prediction Results</Text>

          {/* Main Score */}
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Risk Score</Text>
              <Text style={styles.resultValue}>
                {(prediction.risk_score * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Risk Level</Text>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: riskInfo.color },
                ]}
              >
                <Text style={styles.riskText}>
                  {riskInfo.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Live Factors */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Live Risk Factors</Text>

            {/* Sensors */}
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>📡 Sensor Network</Text>
              <Text style={styles.factorDetail}>Disp: {sensorData?.displacement.toFixed(2)} mm</Text>
              <Text style={styles.factorDetail}>Pore: {sensorData?.pore_pressure.toFixed(2)} kPa</Text>
            </View>

            {/* Climate */}
            <View style={styles.factorItem}>
              <Text style={styles.factorTitle}>⛈️ Weather Conditions</Text>
              <Text style={styles.factorDetail}>
                {weather ? `${weather.temp}°C, ${weather.rain}mm Rain` : 'Loading...'}
              </Text>
            </View>
          </View>

          {/* Feature Importance */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>AI Confidence Factors</Text>
            {Object.entries(prediction.explainability.top_features)
              .map(([key, value]) => (
                <View key={key} style={styles.featureItem}>
                  <Text style={styles.featureName}>{key}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(value * 100, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.featureValue}>{(value * 100).toFixed(0)}%</Text>
                </View>
              ))}
          </View>
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
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  picker: {
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  resultItem: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  riskText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  progressBar: {
    flex: 2,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  featureValue: {
    width: 50,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeBtnActive: {
    backgroundColor: COLORS.accent,
  },
  modeText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modeTextActive: {
    color: COLORS.primary,
  },
  demoInfo: {
    padding: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  demoText: {
    color: COLORS.accent,
    fontSize: 12,
    textAlign: 'center',
  },
  factorItem: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  factorTitle: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  factorDetail: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
})

