import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token available, logout
          return Promise.reject(error);
        }
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/accounts/token/refresh/`,
          { refresh: refreshToken }
        );
        
        // Store the new token
        localStorage.setItem('accessToken', response.data.access);
        
        // Update header and retry
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API service functions
const apiService = {
  // Authentication
  login: (credentials) => api.post('/accounts/token/', credentials),
  register: (userData) => api.post('/accounts/register/', userData),
  
  // Universities
  getUniversities: () => api.get('/universities/'),
  getUniversity: (id) => api.get(`/universities/${id}/`),
  
  // Properties
  getProperties: (params) => api.get('/properties/', { params }),
  getProperty: (id) => api.get(`/properties/${id}/`),
  createProperty: (propertyData) => api.post('/properties/', propertyData),
  updateProperty: (id, propertyData) => api.put(`/properties/${id}/`, propertyData),
  
  // Roommates
  getRoommateProfile: () => api.get('/roommates/profiles/my_profile/'),
  updateRoommateProfile: (profileData) => api.put('/roommates/profiles/my_profile/', profileData),
  getRoommateRequests: () => api.get('/roommates/requests/'),
  createRoommateRequest: (requestData) => api.post('/roommates/requests/', requestData),
  
  // Messaging
  getConversations: () => api.get('/messages/conversations/'),
  getConversation: (id) => api.get(`/messages/conversations/${id}/`),
  sendMessage: (conversationId, messageData) => 
    api.post(`/messages/conversations/${conversationId}/messages/`, messageData),
  createConversation: (conversationData) => api.post('/messages/conversations/start/', conversationData),
};

export default apiService;