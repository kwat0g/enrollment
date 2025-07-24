import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './main.css'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Restore session from sessionStorage before mounting
const userStore = useUserStore()
const adminStore = useAdminStore()
userStore.loadFromStorage()
adminStore.loadFromStorage()

// Register navigation guard after Pinia is ready
router.beforeEach((to, from, next) => {
  // Admin routes
  if (to.path.startsWith('/admin')) {
    if (!adminStore.token || !adminStore.admins || adminStore.admins.role !== 'admin') {
      next('/@dminlogin-');
    } else {
      next();
    }
  }
  // Student routes
  else if (to.path.startsWith('/student')) {
    if (!userStore.token || !userStore.user || userStore.user.role !== 'student') {
      next('/login');
    } else {
      next();
    }
  }
  // Other routes
  else {
    next();
  }
})

app.use(router)
app.mount('#app')
