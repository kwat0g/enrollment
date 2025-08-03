import { apiRequest } from './client';
import { useUserStore } from '@/stores/user';
import { useAdminStore } from '@/stores/admin';

export const authService = {
  // Student login
  async studentLogin(credentials) {
    const response = await apiRequest({
      method: 'POST',
      url: '/login',
      data: credentials
    });

    if (response.success) {
      const userStore = useUserStore();
      userStore.setUser(response.data.user, response.data.token);
    }

    return response;
  },

  // Admin login
  async adminLogin(credentials) {
    const response = await apiRequest({
      method: 'POST',
      url: '/admin/login',
      data: credentials
    });

    if (response.success) {
      const adminStore = useAdminStore();
      adminStore.setAdmin(response.data.user, response.data.token);
    }

    return response;
  },

  // Logout
  logout() {
    const userStore = useUserStore();
    const adminStore = useAdminStore();
    
    userStore.logout();
    adminStore.logout();
  },

  // Check if user is authenticated
  isAuthenticated() {
    const userStore = useUserStore();
    const adminStore = useAdminStore();
    
    return !!(userStore.token || adminStore.token);
  },

  // Get current user
  getCurrentUser() {
    const userStore = useUserStore();
    const adminStore = useAdminStore();
    
    return userStore.user || adminStore.admins;
  },

  // Refresh token (if needed)
  async refreshToken() {
    const currentToken = this.getCurrentToken();
    if (!currentToken) {
      return { success: false, error: 'No token to refresh' };
    }

    const response = await apiRequest({
      method: 'POST',
      url: '/auth/refresh',
      data: { token: currentToken }
    });

    if (response.success) {
      const userStore = useUserStore();
      const adminStore = useAdminStore();
      
      if (userStore.token) {
        userStore.setUser(userStore.user, response.data.token);
      } else if (adminStore.token) {
        adminStore.setAdmin(adminStore.admins, response.data.token);
      }
    }

    return response;
  },

  // Get current token
  getCurrentToken() {
    const userStore = useUserStore();
    const adminStore = useAdminStore();
    
    return userStore.token || adminStore.token;
  }
}; 