import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native'
import { alertsService } from '../services/alerts'
import AlertCard from '../components/AlertCard'
import { COLORS } from '../utils/constants'

import { authService } from '../services/auth'

import { TouchableOpacity, Alert } from 'react-native'
import api from '../services/api'
import { ROLES } from '../utils/constants'

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadUserAndAlerts()
  }, [])

  const loadUserAndAlerts = async () => {
    try {
      const u = await authService.getCurrentUser()
      setUser(u)
      await Promise.all([
        loadAlerts(u?.slope_id),
        loadPendingUsers(u)
      ])
    } catch (error) {
      console.error('Failed to load user/alerts:', error)
      setLoading(false)
    }
  }

  const loadAlerts = async (slopeId) => {
    try {
      const data = await alertsService.getAll(slopeId)
      setAlerts(data)
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingUsers = async (currentUser) => {
    if (currentUser?.role_name === ROLES.SITE_ADMIN || currentUser?.role_name === ROLES.GOV_AUTHORITY) {
      try {
        const res = await api.get('/auth/admin/pending-users')
        if (res.data.success) {
          setPendingUsers(res.data.data)
        }
      } catch (error) {
        console.log('Failed to load pending users:', error)
      }
    }
  }

  const handleApprove = async (userId) => {
    try {
      await api.post('/auth/admin/approve-user', { userId })
      Alert.alert('Success', 'User approved')
      loadPendingUsers(user)
    } catch (error) {
      Alert.alert('Error', 'Failed to approve user')
    }
  }

  const renderPendingUser = ({ item }) => (
    <View style={styles.pendingCard}>
      <View>
        <Text style={styles.pendingName}>{item.name}</Text>
        <Text style={styles.pendingRole}>{item.role_name} • {item.email || item.phone}</Text>
      </View>
      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
        <Text style={styles.approveText}>Approve</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id?.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadUserAndAlerts()} />}
        ListHeaderComponent={
          pendingUsers.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
              {pendingUsers.map(u => <View key={u.id}>{renderPendingUser({ item: u })}</View>)}
            </View>
          ) : null
        }
        renderItem={({ item }) => <AlertCard alert={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No alerts</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pendingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pendingName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  pendingRole: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  approveBtn: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  approveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
})

