import api from '../lib/api';

export const mineService = {
    // Get all mines (Super Admin / Gov)
    getAllMines: async () => {
        const response = await api.get('/admin/slopes');
        return response.data.data;
    },

    // Get single mine details
    getMineById: async (id) => {
        const response = await api.get(`/admin/slopes/${id}`);
        return response.data.data;
    },

    // Create new mine
    createMine: async (data) => {
        const response = await api.post('/admin/slopes', {
            name: data.name,
            description: data.description,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng),
            risk_level: 'low' // Default
        });
        return response.data;
    },

    // Delete mine
    deleteMine: async (id) => {
        const response = await api.delete(`/admin/slopes/${id}`);
        return response.data;
    }
};
