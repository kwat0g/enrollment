/**
 * Section Management Composable
 * Core logic for section management operations
 */

import { ref } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

export function useSectionManagement() {
  const allSections = ref([])
  const loading = ref(false)
  const error = ref(null)

  const userStore = useUserStore()

  const fetchAllSections = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/student/sections/all', {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      })
      allSections.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || err.message || 'Failed to fetch sections'
      allSections.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    allSections,
    loading,
    error,
    fetchAllSections
  }
}
