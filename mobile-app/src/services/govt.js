import api from './api'

export const govtService = {
  async getAdvisories(params = {}) {
    try {
      const response = await api.get('/govt/advisories', { params })
      return response.data.data || []
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch advisories')
    }
  },

  async postAdvisory(data) {
    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('message', data.message)
      formData.append('severity', data.severity || 'info')
      if (data.slopeId) formData.append('slopeId', data.slopeId)
      if (data.targetSiteAdminId) formData.append('targetSiteAdminId', data.targetSiteAdminId)
      if (data.attachmentUri) {
        formData.append('attachments', {
          uri: data.attachmentUri,
          type: 'image/jpeg',
          name: 'advisory.jpg',
        })
      }

      const response = await api.post('/govt/advisories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to post advisory')
    }
  },
}

