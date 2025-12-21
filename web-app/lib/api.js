import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Auto logout on 401
            Cookies.remove('token');
            // Optional: Redirect to login
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
