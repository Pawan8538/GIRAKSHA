import api from './api'

export const alertsService = {
  async getAll(slopeId) {
    try {
      const params = slopeId ? { slopeId } : {}
      const response = await api.get('/alerts/all', { params })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts')
    }
  },

  async postAdvisory(payload) {
    try {
      const response = await api.post('/alerts/advisory', payload)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to post advisory')
    }
  },

  async getById(alertId) {
    try {
      const response = await api.get(`/alerts/${alertId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alert')
    }
  },

  async getBySlope(slopeId) {
    try {
      const response = await api.get(`/alerts/slope/${slopeId}`)
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts')
    }
  },

  async create(alertData) {
    try {
      const response = await api.post('/alerts', alertData)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create alert')
    }
  },

  async acknowledge(alertId) {
    try {
      const response = await api.post(`/alerts/${alertId}/acknowledge`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to acknowledge alert')
    }
  },

  async sendSOS(payload) {
    try {
      const response = await api.post('/alerts/sos', payload)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send SOS')
    }
  },
}

