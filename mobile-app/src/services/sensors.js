import api from './api'

export const sensorsService = {
  async getAll(slopeId = null) {
    try {
      const params = slopeId ? { slopeId } : {}
      const response = await api.get('/sensors', { params })
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sensors')
    }
  },

  async getById(sensorId) {
    try {
      const response = await api.get(`/sensors/${sensorId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sensor')
    }
  },

  async create(sensorData) {
    try {
      const response = await api.post('/sensors', sensorData)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create sensor')
    }
  },

  async update(sensorId, sensorData) {
    try {
      const response = await api.patch(`/sensors/${sensorId}`, sensorData)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update sensor')
    }
  },

  async delete(sensorId) {
    try {
      const response = await api.delete(`/sensors/${sensorId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete sensor')
    }
  },

  async addReading(sensorId, readingData) {
    try {
      const response = await api.post(`/sensors/${sensorId}/readings`, readingData)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add reading')
    }
  },

  async getReadings(sensorId, limit = 100) {
    try {
      const response = await api.get(`/sensors/${sensorId}/readings`, {
        params: { limit },
      })
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch readings')
    }
  },
}

