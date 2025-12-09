import api from '../lib/api';

export const dashboardService = {
    // Common
    getMines: async () => {
        const response = await api.get('/admin/slopes');
        return response.data.data;
    },

    getAlerts: async () => {
        const response = await api.get('/alerts');
        return response.data.data;
    },

    // Super Admin
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data.data;
    },
    getPendingUsers: async () => {
        const response = await api.get('/admin/users/pending');
        return response.data.data;
    },

    // Site Admin
    getWorkers: async (slopeId) => {
        const response = await api.get('/admin/workers');
        return response.data.data;
    },

    // Gov Authority
    getGovMines: async () => {
        const response = await api.get('/admin/mines');
        return response.data.data;
    }
};
