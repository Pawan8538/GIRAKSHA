import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { alertsService } from '../services/alerts'
import { authService } from '../services/auth'
import { COLORS } from '../utils/constants'

export default function GovAlertsScreen() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('info')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    authService.getCurrentUser().then(setUser)
  }, [])

  const handleSubmit = async () => {
    if (!title || !message) {
      Alert.alert('Validation', 'Title and Message are required')
      return
    }

    setLoading(true)
    try {
      await alertsService.postAdvisory({
        title,
        message,
        severity,
        slopeId: user?.slope_id // Optional: target specific mine if user is linked to one, or global
      })
      Alert.alert('Success', 'Advisory posted successfully')
      setTitle('')
      setMessage('')
      setSeverity('info')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Post Government Advisory</Text>
      <Text style={styles.subHeader}>
        Send an official alert to mine sites. This will be visible to all relevant personnel.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Heavy Rainfall Warning"
          placeholderTextColor={COLORS.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detailed description of the advisory..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Severity Level</Text>
        <View style={styles.severityContainer}>
          {['info', 'warning', 'critical'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityButton,
                severity === level && styles.severityActive,
                severity === level && { backgroundColor: getSeverityColor(level) }
              ]}
              onPress={() => setSeverity(level)}
            >
              <Text style={[styles.severityText, severity === level && styles.severityTextActive]}>
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Posting...' : 'Post Advisory'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function getSeverityColor(level) {
  switch (level) {
    case 'critical': return COLORS.danger
    case 'warning': return COLORS.warning
    case 'info': return COLORS.info
    default: return COLORS.primary
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 120,
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  severityActive: {
    borderColor: 'transparent',
  },
  severityText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  severityTextActive: {
    color: '#fff', // Assuming white text for active buttons
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.7,
  },
  submitText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
})
