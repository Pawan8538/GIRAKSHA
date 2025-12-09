import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { authService } from '../services/auth'
import { COLORS } from '../utils/constants'

export default function LoginScreen({ onLogin, route }) {
  const navigation = useNavigation()
  const { roleName, registerRoute } = route?.params || {}

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Validation', 'Email/Phone and password are required')
      return
    }

    setLoading(true)
    try {
      // Determine if input is email or phone
      const isEmail = identifier.includes('@')
      const result = await authService.login(
        isEmail ? identifier : null,
        password,
        isEmail ? null : identifier
      )

      if (result.success) {
        onLogin?.(result.token, result.data)
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed'
      const approvalStatus = error.response?.data?.approval_status

      if (approvalStatus === 'pending') {
        Alert.alert('Account Pending', 'Your account is awaiting approval from an administrator.')
      } else if (approvalStatus === 'rejected') {
        Alert.alert('Account Rejected', 'Your account registration was rejected.')
      } else {
        Alert.alert('Error', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {roleName ? `${roleName} Login` : 'GeoGuard'}
          </Text>
          <Text style={styles.subtitle}>
            {roleName ? 'Access your dashboard' : 'AI-Powered Mine Safety'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email or Phone Number"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              if (registerRoute) {
                navigation.navigate(registerRoute)
              } else {
                navigation.navigate('RoleSelection')
              }
            }}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              {registerRoute ? "Don't have an account? " : "Don't have an account? "}
              <Text style={styles.linkTextBold}>
                {registerRoute ? 'Register Here' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  linkTextBold: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
})
