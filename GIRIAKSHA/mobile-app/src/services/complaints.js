import api from './api'

export const complaintsService = {
  async getAll() {
    try {
      const response = await api.get('/complaints')
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch complaints')
    }
  },

  async getById(complaintId) {
    try {
      const response = await api.get(`/complaints/${complaintId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch complaint')
    }
  },

  async getByUser() {
    try {
      const response = await api.get('/complaints/my')
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch complaints')
    }
  },

  async create(complaintData) {
    try {
      const formData = new FormData()
      formData.append('title', complaintData.title)
      formData.append('description', complaintData.description)
      formData.append('location', complaintData.location || '')
      formData.append('latitude', complaintData.latitude?.toString() || '')
      formData.append('longitude', complaintData.longitude?.toString() || '')
      formData.append('priority', complaintData.priority || 'medium')
      
      if (complaintData.mediaUri) {
        formData.append('image', {
          uri: complaintData.mediaUri,
          type: 'image/jpeg',
          name: 'complaint.jpg',
        })
      }

      const response = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create complaint')
    }
  },

  async updateStatus(complaintId, status) {
    try {
      const response = await api.patch(`/complaints/${complaintId}/status`, { status })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update complaint')
    }
  },

  async sendFeedback(complaintId, message) {
    try {
      const response = await api.post(`/complaints/${complaintId}/feedback`, { message })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send feedback')
    }
  },
}

