import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native'
import { authService } from '../services/auth'
import { COLORS } from '../utils/constants'

export default function ProfileScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showTeam, setShowTeam] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        const profile = await authService.getProfile()
        setUser(profile)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in both password fields')
      return
    }
    setLoading(true)
    try {
      await authService.updateProfile({ currentPassword, newPassword })
      Alert.alert('Success', 'Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const TeamMembers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Team Members</Text>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.teamMember}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=Member+${i}&background=random` }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.memberName}>Team Member {i}</Text>
            <Text style={styles.memberRole}>Field Worker</Text>
          </View>
        </View>
      ))}
    </View>
  )

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user.name || user.full_name || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{user.role_name || 'N/A'}</Text>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => setShowTeam(!showTeam)}>
          <Text style={styles.actionButtonText}>{showTeam ? 'Hide Team' : 'View Team Members'}</Text>
        </TouchableOpacity>

        {showTeam && <TeamMembers />}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
            {loading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderWidth: 0,
  },
  actionButtonText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberName: {
    color: COLORS.text,
    fontWeight: '600',
  },
  memberRole: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
})

