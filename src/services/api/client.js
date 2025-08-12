import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useAdminStore } from '@/stores/admin';
import { sanitizeByType } from '@/utils/sanitize';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    const adminStore = useAdminStore();
    
    // Add token from appropriate store
    const token = userStore.token || adminStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const userStore = useUserStore();
    const adminStore = useAdminStore();
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear stores
      userStore.logout();
      adminStore.logout();
      // Determine redirect target based on request path
      const reqUrl = error.config?.url || '';
      const isAdminApi = /\/api\/admin\b/.test(reqUrl);
      const target = isAdminApi ? '/@dminlogin-' : '/login';
      if (window.location.pathname !== target) {
        window.location.href = target;
      }
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server Error:', error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

// API response wrapper for consistent error handling
export const apiRequest = async (config) => {
  try {
    // Shallow sanitize outgoing payloads
    const cfg = { ...config };
    if (cfg.data && typeof cfg.data === 'object') {
      const sanitized = {};
      for (const k of Object.keys(cfg.data)) {
        const v = cfg.data[k];
        sanitized[k] = typeof v === 'string' ? sanitizeByType(v, 'string') : v;
      }
      cfg.data = sanitized;
    }
    if (cfg.params && typeof cfg.params === 'object') {
      const sanitizedP = {};
      for (const k of Object.keys(cfg.params)) {
        const v = cfg.params[k];
        sanitizedP[k] = typeof v === 'string' ? sanitizeByType(v, 'string') : v;
      }
      cfg.params = sanitizedP;
    }
    const response = await apiClient(cfg);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
    return { 
      success: false, 
      error: errorMessage,
      status: error.response?.status 
    };
  }
};

export default apiClient; 