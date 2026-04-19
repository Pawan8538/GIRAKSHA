import axios from 'axios';
import Cookies from 'js-cookie';

// Helper to determine the API URL dynamically
const getApiUrl = () => {
    // If explicitly set in environment variables
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL + '/api';
    }
    
    // If running in the browser, dynamically use the current hostname but with port 4000
    if (typeof window !== 'undefined') {
        const { hostname, protocol } = window.location;
        // If it's a render URL, we don't want port 4000, but in that case NEXT_PUBLIC_API_URL should be set.
        // For local testing (localhost or 192.168.x.x), we append port 4000
        return `${protocol}//${hostname}:4000/api`;
    }
    
    // Fallback for server-side rendering without explicit env var
    return 'http://localhost:4000/api';
};

const API_URL = getApiUrl();

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
