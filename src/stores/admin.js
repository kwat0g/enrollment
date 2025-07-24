import { defineStore } from 'pinia'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    admins: null,
    token: null,
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
      sessionStorage.setItem('admins', JSON.stringify(this.admins))
      sessionStorage.setItem('admin_token', token)
    },
    logout() {
      this.admins = null
      this.token = null
      sessionStorage.removeItem('admins')
      sessionStorage.removeItem('admin_token')
    },
    loadFromStorage() {
      const admins = sessionStorage.getItem('admins')
      const token = sessionStorage.getItem('admin_token')
      if (admins && token) {
        this.admins = JSON.parse(admins)
        this.token = token
      }
    }
  },
  getters: {
    getAdminUsername: (state) => state.admins ? state.admins.username : '',
  }
}) 