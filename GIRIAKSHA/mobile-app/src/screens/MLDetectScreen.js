import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { mlService } from '../services/ml'
import { COLORS, getRiskLevel } from '../utils/constants'

export default function MLDetectScreen() {
  const [imageUri, setImageUri] = useState(null)
  const [detection, setDetection] = useState(null)
  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll access is required')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      setDetection(null)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
      setDetection(null)
    }
  }

  const handleDetect = async () => {
    if (!imageUri) {
      Alert.alert('Validation', 'Please select an image')
      return
    }

    setLoading(true)
    try {
      const result = await mlService.detect(imageUri)
      if (result.ok && result.implemented) {
        setDetection(result.data)
      } else {
        Alert.alert('Info', result.message || 'ML service not available')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to detect cracks')
    } finally {
      setLoading(false)
    }
  }

  const riskLevel = detection?.risk_assessment
    ? getRiskLevel(detection.crack_probability)
    : null

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Crack Detection</Text>
        <Text style={styles.subtitle}>Upload an image to detect cracks</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Text style={styles.imageButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleDetect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.buttonText}>Detect Cracks</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {detection && (
        <View style={styles.card}>
          <Text style={styles.title}>Detection Results</Text>
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Crack Detected</Text>
              <Text style={styles.resultValue}>
                {detection.detected ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Confidence</Text>
              <Text style={styles.resultValue}>
                {(detection.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          </View>

          {detection.risk_assessment && (
            <View style={styles.riskContainer}>
              <Text style={styles.sectionTitle}>Risk Assessment</Text>
              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: riskLevel?.color || COLORS.warning },
                ]}
              >
                <Text style={styles.riskText}>
                  {detection.risk_assessment.level?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>
              <Text style={styles.riskAction}>
                {detection.risk_assessment.action}
              </Text>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  imageButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
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
  riskContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  riskText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  riskAction: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
})

