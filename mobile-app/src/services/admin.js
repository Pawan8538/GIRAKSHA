import api from './api'

export const adminService = {
  async getUsers() {
    try {
      const response = await api.get('/admin/users')
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users')
    }
  },

  async updateUserRole(userId, roleId) {
    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { roleId })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user role')
    }
  },

  async getRoles() {
    try {
      const response = await api.get('/roles')
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch roles')
    }
  },

  async getTasks(status = null) {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/admin/tasks', { params })
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks')
    }
  },

  async createTask(task) {
    try {
      const response = await api.post('/admin/tasks', task)
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create task')
    }
  },

  async updateTaskStatus(taskId, status) {
    try {
      const response = await api.patch(`/admin/tasks/${taskId}/status`, { status })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update task status')
    }
  },
}

