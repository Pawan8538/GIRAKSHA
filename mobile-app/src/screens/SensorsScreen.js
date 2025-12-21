import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { sensorsService } from '../services/sensors'
import { COLORS } from '../utils/constants'

export default function SensorsScreen({ navigation }) {
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSensors()
  }, [])

  const loadSensors = async () => {
    try {
      const data = await sensorsService.getAll()
      setSensors(data)
    } catch (error) {
      console.error('Failed to load sensors:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sensors}
        keyExtractor={(item) => item.id?.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSensors} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('SensorDetail', { sensorId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.name || `Sensor ${item.id}`}</Text>
            <Text style={styles.cardSubtitle}>{item.type || 'Unknown type'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sensors found</Text>
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
  card: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
})

