import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);

// Bus APIs
export const getAllBuses = () => api.get('/buses');
export const searchBuses = (source, destination) =>
    api.get(`/buses/search?source=${source}&destination=${destination}`);
export const getBusById = (id) => api.get(`/buses/${id}`);
export const addBus = (busData) => api.post('/buses', busData);
export const updateBus = (id, busData) => api.put(`/buses/${id}`, busData);
export const deleteBus = (id) => api.delete(`/buses/${id}`);

export const reportBusStatus = (id, status) => api.post(`/buses/${id}/report-status`, { status });
export const updateLiveLocation = (id, locationData) => api.post(`/buses/${id}/live-location`, locationData);

// Chat API
export const chatWithBot = (message) => api.post('/chat', { message });

export default api;
