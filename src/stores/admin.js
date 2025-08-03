import { defineStore } from 'pinia'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    admins: null,
    token: null,
    tokenExpiry: null,
  }),
  actions: {
    setAdmin(admin, token) {
      this.admins = {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        // add other admin fields if needed
      }
      this.token = token
      
      // Calculate token expiry (JWT tokens are valid for 1 day)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 1)
      this.tokenExpiry = expiryDate.toISOString()
      
      // Store in localStorage for persistence across browser sessions
      localStorage.setItem('admins', JSON.stringify(this.admins))
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_tokenExpiry', this.tokenExpiry)
      
      // Also store in sessionStorage for current session
      sessionStorage.setItem('admins', JSON.stringify(this.admins))
      sessionStorage.setItem('admin_token', token)
      sessionStorage.setItem('admin_tokenExpiry', this.tokenExpiry)
    },
    logout() {
      this.admins = null
      this.token = null
      this.tokenExpiry = null
      
      // Clear from both storages
      localStorage.removeItem('admins')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_tokenExpiry')
      
      sessionStorage.removeItem('admins')
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_tokenExpiry')
    },
    loadFromStorage() {
      // Try sessionStorage first (current session)
      let admins = sessionStorage.getItem('admins')
      let token = sessionStorage.getItem('admin_token')
      let tokenExpiry = sessionStorage.getItem('admin_tokenExpiry')
      
      // If not in sessionStorage, try localStorage (persistent)
      if (!admins || !token) {
        admins = localStorage.getItem('admins')
        token = localStorage.getItem('admin_token')
        tokenExpiry = localStorage.getItem('admin_tokenExpiry')
        
        // If found in localStorage, also store in sessionStorage
        if (admins && token) {
          sessionStorage.setItem('admins', admins)
          sessionStorage.setItem('admin_token', token)
          sessionStorage.setItem('admin_tokenExpiry', tokenExpiry)
        }
      }
      
      if (admins && token) {
        // Check if token is expired
        if (tokenExpiry && new Date(tokenExpiry) > new Date()) {
          this.admins = JSON.parse(admins)
          this.token = token
          this.tokenExpiry = tokenExpiry
        } else {
          // Token expired, clear storage
          this.logout()
        }
      }
    },
    isTokenExpired() {
      if (!this.tokenExpiry) return true
      return new Date(this.tokenExpiry) <= new Date()
    },
    isAuthenticated() {
      return !!(this.admins && this.token && !this.isTokenExpired())
    },
    // Method to refresh token (to be implemented with backend)
    async refreshToken() {
      // This would call the backend to get a new token
      // For now, we'll just return false
      return false
    },
    
    // Initialize storage event listeners for cross-tab sync
    initStorageSync() {
      // Prevent multiple listeners
      if (this._storageListenerAdded) return
      this._storageListenerAdded = true
      
      console.log('Admin store: Initializing cross-tab sync')
      
      // Listen for storage changes in other tabs
      const handleStorageChange = (e) => {
        console.log('Admin store: Storage event detected', { key: e.key, oldValue: e.oldValue, newValue: e.newValue })
        
        // Check for admin token removal (logout)
        if (e.key === 'admin_token' && e.newValue === null && e.oldValue !== null) {
          console.log('Admin store: Logout detected in another tab')
          // Admin logged out in another tab
          this.admins = null
          this.token = null
          this.tokenExpiry = null
          
          // Also clear sessionStorage
          sessionStorage.removeItem('admins')
          sessionStorage.removeItem('admin_token')
          sessionStorage.removeItem('admin_tokenExpiry')
          
          // Redirect to admin login if currently on admin pages
          const currentPath = window.location.pathname
          if (currentPath.startsWith('/admin')) {
            console.log('Admin store: Redirecting to admin login')
            window.location.href = '/@dminlogin-'
          }
        } 
        // Check for admin token addition (login)
        else if (e.key === 'admin_token' && e.newValue && e.oldValue === null) {
          console.log('Admin store: Login detected in another tab')
          // Admin logged in from another tab, reload state
          this.loadFromStorage()
        }
        // Also check for admins data changes
        else if (e.key === 'admins' && e.newValue === null && e.oldValue !== null) {
          console.log('Admin store: Admin data cleared in another tab')
          this.admins = null
          this.token = null
          this.tokenExpiry = null
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      
      // Store reference for cleanup if needed
      this._storageHandler = handleStorageChange
      
      console.log('Admin store: Cross-tab sync initialized')
    }
  },
  getters: {
    getAdminUsername: (state) => state.admins ? state.admins.username : '',
    getAdminRole: (state) => state.admins?.role || null,
    isAdmin: (state) => state.admins?.role === 'admin'
  }
}) 