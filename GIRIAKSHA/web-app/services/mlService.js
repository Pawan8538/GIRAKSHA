import api from '../lib/api';

export const mlService = {
    // Get risk heatmap data from fusion engine
    getHeatmapData: async () => {
        try {
            const response = await api.get('/ml/risk/grid');
            if (response.data?.grid) {
                // Transform grid data to heatmap points
                return response.data.grid.map(cell => ({
                    id: cell.id,
                    lat: cell.lat,
                    lng: cell.lon,
                    risk: cell.risk_score,
                    mineProximity: cell.mine_proximity,
                    sensorInfluence: cell.sensor_influence
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching heatmap data:', error);
            return [];
        }
    },

    // Get 72hr forecast from backend
    getForecast: async (slopeId) => {
        try {
            const response = await api.post('/ml/forecast', { slopeId });
            if (response.data?.ok && response.data?.data) {
                const { timestamps, forecast, base_risk_trend, current_assessment } = response.data.data;
                return {
                    timestamps,
                    forecast,
                    baseRiskTrend: base_risk_trend,
                    currentAssessment: current_assessment
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching forecast:', error);
            return null;
        }
    },

    // Get current risk assessment
    getCurrentRisk: async () => {
        try {
            const response = await api.get('/ml/risk/current');
            return response.data;
        } catch (error) {
            console.error('Error fetching current risk:', error);
            return null;
        }
    },

    // Get real-time sensor stream
    getSensorStream: async () => {
        try {
            const response = await api.get('/ml/sensors/stream');
            if (response.data?.sensors) {
                return response.data.sensors;
            }
            return [];
        } catch (error) {
            console.error('Error fetching sensor stream:', error);
            return [];
        }
    },

    // Detect cracks in uploaded image
    detectCracks: async (imageFile) => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            const response = await api.post('/ml/detect', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error detecting cracks:', error);
            return null;
        }
    },

    // Get risk predictions
    predict: async (slopeId, sensorData = {}) => {
        try {
            const response = await api.post('/ml/predict', { slopeId, sensorData });
            return response.data;
        } catch (error) {
            console.error('Error predicting risk:', error);
            return null;
        }
    },

    // Get explainability data
    explain: async (predictionId, slopeId) => {
        try {
            const response = await api.get(`/ml/explain/${predictionId}`, {
                params: { slopeId }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching explanation:', error);
            return null;
        }
    },

    // Get evacuation routes (static for now)
    getEvacuationRoutes: async () => {
        // Return static routes - can be enhanced later with dynamic data
        return [
            { id: 'safe_zone_1', lat: 11.1100, lng: 79.1600, risk: 0, type: 'safe' },
            { id: 'hazard_1', lat: 11.1053, lng: 79.1506, risk: 0.9, type: 'hazard' }
        ];
    }
};

