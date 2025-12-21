import api from './api'
import AsyncStorage from '@react-native-async-storage/async-storage'

const QUEUE_KEY = 'offline_queue'

export const QUEUE_TYPES = {
  COMPLAINT: 'complaint',
  SOS: 'sos',
}

const initQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(QUEUE_KEY)
    if (!queue) {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]))
    }
  } catch (error) {
    console.error('Failed to init queue:', error)
  }
}

const getQueueItems = async () => {
  try {
    const queue = await AsyncStorage.getItem(QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch (error) {
    console.error('Failed to get queue items:', error)
    return []
  }
}

const addQueueItem = async (type, payload) => {
  try {
    const items = await getQueueItems()
    const newItem = {
      id: Date.now().toString(),
      type,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString(),
    }
    items.push(newItem)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to add queue item:', error)
  }
}

const deleteQueueItem = async (id) => {
  try {
    const items = await getQueueItems()
    const filtered = items.filter((item) => item.id !== id)
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete queue item:', error)
  }
}

export const setupOfflineQueue = async () => {
  await initQueue()
}

export const enqueueComplaint = async (payload) => {
  await addQueueItem(QUEUE_TYPES.COMPLAINT, payload)
}

export const flushQueue = async () => {
  const items = await getQueueItems()
  for (const item of items) {
    try {
      switch (item.type) {
        case QUEUE_TYPES.COMPLAINT:
          await api.post('/complaints', JSON.parse(item.payload))
          break
        case QUEUE_TYPES.SOS:
          await api.post('/alerts/sos', JSON.parse(item.payload))
          break
        default:
          console.warn('Unhandled queue type', item.type)
      }
      await deleteQueueItem(item.id)
    } catch (error) {
      console.error('Queue flush failed', error)
      break
    }
  }
}

export const getQueueCount = async () => {
  const items = await getQueueItems()
  return items.length
}
