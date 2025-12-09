import api from './api'

export const tasksService = {
  async myTasks(status = null) {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/tasks/mine', { params })
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks')
    }
  },

  async getById(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task')
    }
  },

  async updateStatus(taskId, payload) {
    try {
      const response = await api.post(`/tasks/${taskId}/status`, payload)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task')
    }
  },

  async uploadAttachment(taskId, fileUri) {
    try {
      const formData = new FormData()
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg',
        name: 'attachment.jpg',
      })

      const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload attachment')
    }
  },
}

