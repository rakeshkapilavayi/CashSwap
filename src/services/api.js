import axios from 'axios';

// Backend API URL - Using environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// ✅ Request Interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cashswap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token added to request');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      console.log('🚫 Unauthorized - Clearing session');
      localStorage.removeItem('cashswap_token');
      localStorage.removeItem('cashswap_user');
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.log('🚫 Access denied');
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.log('💥 Server error');
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// 🔐 AUTH API
// ============================================
export const authAPI = {
  register: (userData) => {
    console.log('📝 Registering user:', userData.email);
    return api.post('/auth/register', userData);
  },
  
  login: (credentials) => {
    console.log('🔓 Logging in:', credentials.email);
    return api.post('/auth/login', credentials);
  },
};

// ============================================
// 👤 USER API
// ============================================
export const userAPI = {
  getProfile: () => {
    console.log('👤 Fetching user profile');
    return api.get('/users/profile');
  },
  
  updateProfile: (data) => {
    console.log('✏️ Updating profile:', data);
    return api.put('/users/profile', data);
  },
  
  updateWallet: (walletData) => {
    console.log('💰 Updating wallet:', walletData);
    return api.put('/users/wallet', walletData);
  },
  
  updateLocation: (location) => {
    console.log('📍 Updating location:', location);
    return api.put('/users/location', location);
  },
  
  uploadPhoto: (formData) => {
    console.log('📸 Uploading photo');
    return api.post('/users/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deletePhoto: () => {
    console.log('🗑️ Deleting photo');
    return api.delete('/users/photo');
  },
  
  getAllUsers: () => {
    console.log('📋 Fetching all users (admin)');
    return api.get('/users/all');
  },
};

// ============================================
// 💱 EXCHANGE API
// ============================================
export const exchangeAPI = {
  searchUsers: (searchParams) => {
    console.log('🔍 Searching users:', searchParams);
    return api.post('/exchange/search', searchParams);
  },
  
  createRequest: (requestData) => {
    console.log('📤 Creating exchange request:', requestData);
    return api.post('/exchange/request', requestData);
  },
  
  getMyRequests: () => {
    console.log('📋 Fetching my requests');
    return api.get('/exchange/requests');
  },
  
  createMatch: (matchData) => {
    console.log('🤝 Creating match:', matchData);
    return api.post('/exchange/match', matchData);
  },
  
  getMyMatches: () => {
    console.log('🤝 Fetching my matches');
    return api.get('/exchange/matches');
  },
  
  updateMatchStatus: (matchId, status) => {
    console.log(`✏️ Updating match ${matchId} status to:`, status);
    return api.put(`/exchange/match/${matchId}`, { status });
  },
};

// ============================================
// 💬 CHAT API
// ============================================
export const chatAPI = {
  getOrCreateConversation: (otherUserId) => {
    console.log('💬 Getting/creating conversation with user:', otherUserId);
    return api.post('/chat/conversation', { otherUserId });
  },
  
  getMyConversations: () => {
    console.log('📬 Fetching my conversations');
    return api.get('/chat/conversations');
  },
  
  getMessages: (conversationId) => {
    console.log('📨 Fetching messages for conversation:', conversationId);
    return api.get(`/chat/messages/${conversationId}`);
  },
  
  sendMessage: (conversationId, receiverId, messageText) => {
    console.log('📤 Sending message to conversation:', conversationId);
    return api.post('/chat/message', { 
      conversationId, 
      receiverId, 
      messageText 
    });
  },
  
  markAsRead: (conversationId) => {
    console.log('✅ Marking messages as read in conversation:', conversationId);
    return api.put(`/chat/read/${conversationId}`);
  },
};

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

/**
 * Save authentication token and user data
 */
export const saveAuthData = (token, user) => {
  localStorage.setItem('cashswap_token', token);
  localStorage.setItem('cashswap_user', JSON.stringify(user));
  console.log('✅ Auth data saved');
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('cashswap_user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get current token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('cashswap_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

/**
 * Clear authentication data and logout
 */
export const logout = () => {
  localStorage.removeItem('cashswap_token');
  localStorage.removeItem('cashswap_user');
  console.log('👋 Logged out');
  window.location.href = '/';
};

/**
 * Update user data in localStorage
 */
export const updateUserData = (userData) => {
  const currentUser = getCurrentUser();
  const updatedUser = { ...currentUser, ...userData };
  localStorage.setItem('cashswap_user', JSON.stringify(updatedUser));
  console.log('✅ User data updated in localStorage');
};

// Export the axios instance as default
export default api;