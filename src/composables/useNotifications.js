import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

export function useNotifications() {
  const notifications = ref([])
  const loading = ref(false)
  const error = ref(null)
  const userStore = useUserStore()

  const fetchNotifications = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await axios.get('/api/student/notifications', {
        headers: { Authorization: `Bearer ${userStore.token}` }
      })
      notifications.value = res.data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (id) => {
    try {
      await axios.post(`/api/student/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${userStore.token}` }
      })
      // Optionally refresh notifications
      await fetchNotifications()
    } catch (err) {
      // handle error
    }
  }

  onMounted(fetchNotifications)

  return { notifications, loading, error, fetchNotifications, markAsRead }
} 