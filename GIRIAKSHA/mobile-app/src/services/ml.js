import api from './api'

const handleMlRequest = async (requestFn) => {
  try {
    const response = await requestFn()
    return response.data
  } catch (error) {
    if (error.response?.data) {
      return error.response.data
    }
    console.error('ML service unavailable:', error)
    return {
      ok: false,
      implemented: false,
      message: 'Unable to reach ML service',
      error: error.message,
    }
  }
}

export const mlService = {
  async predict(slopeId, sensorData = {}) {
    return handleMlRequest(() =>
      api.post('/ml/predict', { slopeId, sensorData })
    )
  },

  async forecast(slopeId) {
    return handleMlRequest(() =>
      api.post('/ml/forecast', { slopeId })
    )
  },

  async detect(imageUri) {
    const formData = new FormData()
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    })

    return handleMlRequest(() =>
      api.post('/ml/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },

  async explain(slopeId, predictionId) {
    return handleMlRequest(() =>
      api.get(`/ml/explain/${predictionId}`, { params: { slopeId } })
    )
  },

  async getPredictions() {
    return handleMlRequest(() => api.get('/ml/predictions'))
  },
}

