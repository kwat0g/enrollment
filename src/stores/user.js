import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    tokenExpiry: null,
  }),
  actions: {
    setUser(user, token) {
      // Store the entire user object to include all freshman_enrollments fields
      // and maintain backward-compat fields provided by the backend response
      this.user = { ...user }
      this.token = token
      
      // Calculate token expiry (JWT tokens are valid for 1 day)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 1)
      this.tokenExpiry = expiryDate.toISOString()
      
      // Store in localStorage for persistence across browser sessions
      localStorage.setItem('user', JSON.stringify(this.user))
      localStorage.setItem('token', token)
      localStorage.setItem('tokenExpiry', this.tokenExpiry)
      
      // Also store in sessionStorage for current session
      sessionStorage.setItem('user', JSON.stringify(this.user))
      sessionStorage.setItem('token', token)
      sessionStorage.setItem('tokenExpiry', this.tokenExpiry)
    },
    logout() {
      this.user = null
      this.token = null
      this.tokenExpiry = null
      
      // Clear from both storages
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiry')
      
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('tokenExpiry')
    },
    loadFromStorage() {
      // Try sessionStorage first (current session)
      let user = sessionStorage.getItem('user')
      let token = sessionStorage.getItem('token')
      let tokenExpiry = sessionStorage.getItem('tokenExpiry')
      
      // If not in sessionStorage, try localStorage (persistent)
      if (!user || !token) {
        user = localStorage.getItem('user')
        token = localStorage.getItem('token')
        tokenExpiry = localStorage.getItem('tokenExpiry')
        
        // If found in localStorage, also store in sessionStorage
        if (user && token) {
          sessionStorage.setItem('user', user)
          sessionStorage.setItem('token', token)
          sessionStorage.setItem('tokenExpiry', tokenExpiry)
        }
      }
      
      if (user && token) {
        // Check if token is expired
        if (tokenExpiry && new Date(tokenExpiry) > new Date()) {
          this.user = JSON.parse(user)
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
      return !!(this.user && this.token && !this.isTokenExpired())
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
      
      console.log('User store: Initializing cross-tab sync')
      
      // Listen for storage changes in other tabs
      const handleStorageChange = (e) => {
        console.log('User store: Storage event detected', { key: e.key, oldValue: e.oldValue, newValue: e.newValue })
        
        // Check for token removal (logout)
        if (e.key === 'token' && e.newValue === null && e.oldValue !== null) {
          console.log('User store: Logout detected in another tab')
          // Student logged out in another tab
          this.user = null
          this.token = null
          this.tokenExpiry = null
          
          // Also clear sessionStorage
          sessionStorage.removeItem('user')
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('tokenExpiry')
          
          // Redirect to student login if currently on student pages
          const currentPath = window.location.pathname
          if (currentPath.startsWith('/student') || currentPath.startsWith('/dashboard')) {
            console.log('User store: Redirecting to student login')
            window.location.href = '/login'
          }
        } 
        // Check for token addition (login)
        else if (e.key === 'token' && e.newValue && e.oldValue === null) {
          console.log('User store: Login detected in another tab')
          // Student logged in from another tab, reload state
          this.loadFromStorage()
        }
        // Also check for user data changes
        else if (e.key === 'user' && e.newValue === null && e.oldValue !== null) {
          console.log('User store: User data cleared in another tab')
          this.user = null
          this.token = null
          this.tokenExpiry = null
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      
      // Store reference for cleanup if needed
      this._storageHandler = handleStorageChange
      
      console.log('User store: Cross-tab sync initialized')
    }
  },
  getters: {
    getUserFullName: (state) => {
      if (!state.user) return ''
      return `${state.user.first_name} ${state.user.last_name}`.trim()
    },
    getUserRole: (state) => state.user?.role || null,
    isStudent: (state) => state.user?.role === 'student'
  }
}) 