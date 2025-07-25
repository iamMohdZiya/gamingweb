import api from './api';

// Authentication services
export const authService = {
    // Login user
    login: async (email, password) => {
        try {
            const response = await api.post('/user/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Register user
    register: async (userData) => {
        try {
            const response = await api.post('/user/signup', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('token');
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};
