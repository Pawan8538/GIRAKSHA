import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { LineChart } from 'react-native-chart-kit'
import { mlService } from '../services/ml'
import { slopesService } from '../services/slopes'
import { COLORS } from '../utils/constants'

const screenWidth = Dimensions.get('window').width

export default function MLForecastScreen() {
  const [slopes, setSlopes] = useState([])
  const [selectedSlope, setSelectedSlope] = useState('')
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSlopes()
  }, [])

  const loadSlopes = async () => {
    try {
      const data = await slopesService.getAll()
      setSlopes(data)
    } catch (error) {
      Alert.alert('Error', 'Failed to load slopes')
    }
  }

  const handleForecast = async () => {
    if (!selectedSlope) {
      Alert.alert('Validation', 'Please select a slope')
      return
    }

    setLoading(true)
    try {
      const result = await mlService.forecast(selectedSlope)
      if (result.ok && result.implemented) {
        setForecast(result.data)
      } else {
        Alert.alert('Info', result.message || 'ML service not available')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get forecast')
    } finally {
      setLoading(false)
    }
  }

  const chartData = forecast
    ? {
        labels: forecast.timestamps || [],
        datasets: [
          {
            data: forecast.forecast || [],
            color: (opacity = 1) => COLORS.accent,
            strokeWidth: 2,
          },
        ],
      }
    : null

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>72-Hour Risk Forecast</Text>
        <Text style={styles.subtitle}>Get AI-powered risk predictions</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Select Slope</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSlope}
              onValueChange={setSelectedSlope}
              style={styles.picker}
            >
              <Picker.Item label="Choose a slope..." value="" />
              {slopes.map((slope) => (
                <Picker.Item key={slope.id} label={slope.name} value={slope.id} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleForecast}
            disabled={loading || !selectedSlope}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.buttonText}>Get Forecast</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {chartData && (
        <View style={styles.card}>
          <Text style={styles.title}>Forecast Chart</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: 2,
              color: (opacity = 1) => COLORS.accent,
              labelColor: (opacity = 1) => COLORS.textSecondary,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
          {forecast?.current_assessment && (
            <View style={styles.assessmentContainer}>
              <Text style={styles.sectionTitle}>Current Assessment</Text>
              <View style={styles.assessmentRow}>
                <View style={styles.assessmentItem}>
                  <Text style={styles.assessmentLabel}>Base Risk</Text>
                  <Text style={styles.assessmentValue}>
                    {(forecast.current_assessment.base_risk * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.assessmentItem}>
                  <Text style={styles.assessmentLabel}>Enhanced Risk</Text>
                  <Text style={styles.assessmentValue}>
                    {(forecast.current_assessment.enhanced_risk * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          )}
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  assessmentContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  assessmentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  assessmentItem: {
    flex: 1,
  },
  assessmentLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  assessmentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
})

