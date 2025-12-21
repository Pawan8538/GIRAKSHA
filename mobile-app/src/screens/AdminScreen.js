import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { COLORS } from '../utils/constants'
import api from '../services/api'

export default function AdminScreen() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/admin/pending-users')
      setPendingUsers(res.data.data)
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'Failed to load pending users')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      await api.post('/auth/admin/approve-user', { userId })
      Alert.alert('Success', 'User approved')
      loadPendingUsers()
    } catch (error) {
      Alert.alert('Error', 'Failed to approve user')
    }
  }

  const handleReject = async (userId) => {
    try {
      await api.post('/auth/admin/reject-user', { userId })
      Alert.alert('Success', 'User rejected')
      loadPendingUsers()
    } catch (error) {
      Alert.alert('Error', 'Failed to reject user')
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>{item.role_name}</Text>
        {item.department && <Text style={styles.detail}>Dept: {item.department}</Text>}
        {item.phone && <Text style={styles.detail}>Phone: {item.phone}</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Approvals</Text>
      <FlatList
        data={pendingUsers}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPendingUsers} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending users</Text>
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
    padding: 16
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  info: {
    marginBottom: 12
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text
  },
  email: {
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  role: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4
  },
  detail: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  approveBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  empty: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    color: COLORS.textSecondary
  }
})

