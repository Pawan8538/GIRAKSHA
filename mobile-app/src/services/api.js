import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('sih_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('sih_token')
      await AsyncStorage.removeItem('sih_user')
    }
    return Promise.reject(error)
  }
)

export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('sih_token', token)
  }
}

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem('sih_token')
  await AsyncStorage.removeItem('sih_user')
}

export default api
