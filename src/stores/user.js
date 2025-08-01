import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    setUser(user, token) {
      this.user = {
        id: user.id,
        student_id: user.student_id,
        last_name: user.last_name,
        first_name: user.first_name,
        middle_name: user.middle_name,
        suffix: user.suffix,
        gender: user.gender,
        address: user.address,
        contact_number: user.contact_number,
        email: user.email,
        year_level: user.year_level,
        course_id: user.course_id,
        course_name: user.course_name,
        course_code: user.course_code,
        role: user.role,
      }
      this.token = token
      sessionStorage.setItem('user', JSON.stringify(this.user))
      sessionStorage.setItem('token', token)
    },
    logout() {
      this.user = null
      this.token = null
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
    },
    loadFromStorage() {
      const user = sessionStorage.getItem('user')
      const token = sessionStorage.getItem('token')
      if (user && token) {
        this.user = JSON.parse(user)
        this.token = token
      }
    }
  }
}) 