import api from './api'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const authService = {
  async login(email, password, phone = null) {
    try {
      const payload = { password }
      if (email) payload.email = email
      if (phone) payload.phone = phone

      const response = await api.post('/auth/login', payload)

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Invalid credentials')
      }

      const user = response.data.data
      if (!user.role_name && user.role_id) {
        const roleNameMap = {
          1: 'field_worker',
          2: 'site_admin',
          3: 'gov_authority',
          4: 'super_admin',
        }
        user.role_name = roleNameMap[user.role_id] || user.role_name
      }

      // Save token and user
      if (response.data.token) {
        await AsyncStorage.setItem('sih_token', response.data.token)
        await AsyncStorage.setItem('sih_user', JSON.stringify(user))
      }

      return { success: true, data: user, token: response.data.token }
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Login failed')
      }
      throw new Error('Unable to connect to server')
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Registration failed')
      }
      throw new Error('Unable to connect to server')
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/me')
      const user = response.data.data
      await AsyncStorage.setItem('sih_user', JSON.stringify(user))
      return user
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get profile')
    }
  },

  async getRoles() {
    try {
      const response = await api.get('/auth/roles')
      return response.data.data
    } catch (error) {
      console.warn('Failed to fetch roles', error)
      return []
    }
  },

  async updateProfile(payload) {
    try {
      const response = await api.put('/auth/me', payload)
      const user = response.data.data
      await AsyncStorage.setItem('sih_user', JSON.stringify(user))
      return user
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  },

  async logout() {
    await AsyncStorage.removeItem('sih_token')
    await AsyncStorage.removeItem('sih_user')
  },

  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('sih_user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      return null
    }
  },

  async getToken() {
    return await AsyncStorage.getItem('sih_token')
  },
}

