import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

export function useStudentData() {
  const sections = ref([])
  const enrollment = ref(null)
  const accountabilities = ref([])
  const grades = ref([])
  const loading = ref(false)
  const error = ref(null)

  const userStore = useUserStore()

  // Fetch all data in parallel
  const fetchAll = async () => {
    loading.value = true
    error.value = null
    const config = {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    }
    // Fetch each resource individually to handle errors gracefully
    try {
      const [sectionsRes, enrollmentRes, accountabilitiesRes, gradesRes] = await Promise.allSettled([
        axios.get('/api/student/sections', config),
        axios.get('/api/student/enrollment', config),
        axios.get('/api/student/accountabilities', config),
        axios.get('/api/student/grades', config),
      ])
      // Sections
      if (sectionsRes.status === 'fulfilled') {
        sections.value = sectionsRes.value.data
      } else {
        sections.value = []
        console.error('Sections fetch error:', sectionsRes.reason)
      }
      // Enrollment
      if (enrollmentRes.status === 'fulfilled') {
        enrollment.value = enrollmentRes.value.data
      } else {
        enrollment.value = null
        console.error('Enrollment fetch error:', enrollmentRes.reason)
      }
      // Accountabilities
      if (accountabilitiesRes.status === 'fulfilled') {
        accountabilities.value = accountabilitiesRes.value.data
      } else {
        accountabilities.value = []
        console.error('Accountabilities fetch error:', accountabilitiesRes.reason)
      }
      // Grades
      if (gradesRes.status === 'fulfilled') {
        grades.value = gradesRes.value.data
      } else {
        grades.value = []
        console.error('Grades fetch error:', gradesRes.reason)
      }
    } catch (err) {
      error.value = err
      // Set all to empty/default to avoid stale UI
      sections.value = []
      enrollment.value = null
      accountabilities.value = []
      grades.value = []
      console.error('General fetchAll error:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchAll)

  return {
    sections,
    enrollment,
    accountabilities,
    grades,
    loading,
    error,
    refresh: fetchAll
  }
} 