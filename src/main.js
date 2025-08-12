import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './main.css'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'
import SanitizeDirective from '@/directives/sanitize'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Register global input sanitization directive
app.directive('sanitize', SanitizeDirective)

// Restore session from sessionStorage before mounting
const userStore = useUserStore()
const adminStore = useAdminStore()
userStore.loadFromStorage()
adminStore.loadFromStorage()

app.use(router)
app.mount('#app')
