import React, { useState, useEffect } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { Picker } from '@react-native-picker/picker'

export default function RegisterScreen() {
  const navigation = useNavigation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [roles, setRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedMine, setSelectedMine] = useState('demo_mine')
  const [mineDetails, setMineDetails] = useState({
    name: '',
    description: '',
    lat: '',
    lng: '',
    initData: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    const data = await authService.getRoles()
    setRoles(data)
    if (data.length > 0) {
      // Default to Field Worker if available, else first role
      const defaultRole = data.find(r => r.name === 'field_worker') || data[0]
      setSelectedRole(defaultRole.id)
    }
  }

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Validation', 'All fields are required')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        roleId: selectedRole,
      }

      if (selectedMine === 'add_new') {
        if (!mineDetails.name || !mineDetails.lat || !mineDetails.lng) {
          Alert.alert('Validation', 'Please fill in all mine details')
          setLoading(false)
          return
        }
        payload.mineDetails = mineDetails
      }

      const result = await authService.register(payload)

      if (result.success) {
        Alert.alert('Success', 'Registration successful! Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ])
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join GeoGuard</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
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
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select Mine</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMine}
                  onValueChange={(itemValue) => setSelectedMine(itemValue)}
                  style={styles.picker}
                  dropdownIconColor={COLORS.text}
                  mode="dropdown"
                >
                  <Picker.Item label="Demo Mine" value="demo_mine" color={COLORS.text} style={{ backgroundColor: COLORS.surface }} />
                  <Picker.Item label="+ Add New Mine" value="add_new" color={COLORS.accent} style={{ backgroundColor: COLORS.surface }} />
                </Picker>
              </View>
            </View>

            {selectedMine === 'add_new' && (
              <View style={styles.mineForm}>
                <Text style={styles.sectionTitle}>New Mine Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mine Name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={mineDetails.name}
                  onChangeText={(t) => setMineDetails({ ...mineDetails, name: t })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  placeholderTextColor={COLORS.textSecondary}
                  value={mineDetails.description}
                  onChangeText={(t) => setMineDetails({ ...mineDetails, description: t })}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Latitude (e.g. 11.10)"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={mineDetails.lat}
                    onChangeText={(t) => setMineDetails({ ...mineDetails, lat: t })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Longitude (e.g. 79.15)"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={mineDetails.lng}
                    onChangeText={(t) => setMineDetails({ ...mineDetails, lng: t })}
                  />
                </View>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setMineDetails({ ...mineDetails, initData: !mineDetails.initData })}
                >
                  <View style={[styles.checkbox, mineDetails.initData && styles.checkboxChecked]} />
                  <Text style={styles.checkboxLabel}>Initialize with Default Data (Sensors, etc.)</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select Role</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedRole}
                  onValueChange={(itemValue) => setSelectedRole(itemValue)}
                  style={styles.picker}
                  dropdownIconColor={COLORS.text}
                  mode="dropdown"
                >
                  {roles.map((role) => (
                    <Picker.Item
                      key={role.id}
                      label={role.name.replace('_', ' ').toUpperCase()}
                      value={role.id}
                      color={COLORS.text}
                      style={{ backgroundColor: COLORS.surface }}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
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
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
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
  pickerContainer: {
    marginTop: 8,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  mineForm: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.accent,
    marginRight: 8,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
  },
  checkboxLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
})
