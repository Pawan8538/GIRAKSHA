import api from '../lib/api';

export const sensorService = {
    // Get sensors for a specific mine (or all accessable if no mineId)
    getSensorsByMine: async (mineId) => {
        // Use the dedicated sensors endpoint
        const params = mineId ? { slopeId: mineId } : {};
        const response = await api.get('/sensors', { params });
        return response.data.data || [];
    },

    // Get a specific sensor details
    getSensorById: async (sensorId) => {
        const response = await api.get(`/sensors/${sensorId}`);
        return response.data.data;
    },

    // Get sensor readings history
    getSensorReadings: async (sensorId, limit = 100) => {
        const response = await api.get(`/sensors/${sensorId}/readings`, { params: { limit } });
        return response.data; // Fixed: removed .data, usually axios returns data in data.data
    },

    // Get sensor statistics
    getSensorStats: async (sensorId, hours = 24) => {
        const response = await api.get(`/sensors/${sensorId}/stats`, { params: { hours } });
        return response.data.data;
    },

    // Toggle sensor status
    toggleSensorActive: async (sensorId) => {
        const response = await api.patch(`/sensors/${sensorId}/toggle`);
        return response.data.data;
    }
};
