import api from '../lib/api';
import Cookies from 'js-cookie';

export const authService = {
    // Login with phone and password
    login: async (phone, password) => {
        const response = await api.post('/auth/login', { phone, password });
        if (response.data.success) {
            const { token, data: user } = response.data;
            Cookies.set('token', token, { expires: 1 }); // Expires in 1 day
            Cookies.set('user', JSON.stringify(user), { expires: 1 });
            return user;
        }
        throw new Error(response.data.message);
    },

    // Register Site Admin
    registerSiteAdmin: async (data) => {
        const response = await api.post('/auth/register/site-admin', data);
        return response.data;
    },

    // Register Government Authority
    registerGov: async (data) => {
        const response = await api.post('/auth/register/gov', data);
        return response.data;
    },

    // Get current user profile
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data.data;
    },

    // Admin: Get pending users
    getPendingUsers: async () => {
        const response = await api.get('/auth/admin/pending-users');
        return response.data.data;
    },

    // Admin: Approve user
    approveUser: async (userId) => {
        const response = await api.post('/auth/admin/approve-user', { user_id: userId });
        return response.data;
    },

    // Admin: Reject user
    rejectUser: async (userId) => {
        const response = await api.post('/auth/admin/reject-user', { user_id: userId });
        return response.data;
    },

    // Logout
    logout: () => {
        Cookies.remove('token');
        Cookies.remove('user');
        api.post('/auth/logout').catch(() => { }); // Optional backend call
    },

    // Get stored user from cookie
    getUser: () => {
        const userStr = Cookies.get('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Get token
    getToken: () => Cookies.get('token'),

    // Check if authenticated
    isAuthenticated: () => !!Cookies.get('token'),
};
