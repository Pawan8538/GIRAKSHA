import api from './api'

export const slopesService = {
  async getAll() {
    try {
      const response = await api.get('/admin/slopes')
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch slopes')
    }
  },

  async getById(slopeId) {
    try {
      const response = await api.get(`/admin/slopes/${slopeId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch slope')
    }
  },

  async create(slopeData) {
    try {
      const response = await api.post('/admin/slopes', slopeData)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create slope')
    }
  },

  async update(slopeId, slopeData) {
    try {
      const response = await api.patch(`/admin/slopes/${slopeId}`, slopeData)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update slope')
    }
  },

  async updateRisk(slopeId, riskLevel) {
    try {
      const response = await api.patch(`/admin/slopes/${slopeId}/risk`, { riskLevel })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update risk')
    }
  },

  async delete(slopeId) {
    try {
      const response = await api.delete(`/admin/slopes/${slopeId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete slope')
    }
  },
}

