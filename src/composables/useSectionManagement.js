/**
 * Section Management Composable
 * Core logic for section management operations
 */

import { ref, computed, onMounted } from 'vue'
import sectionsApi from '@/services/api/sections.js'
import { useNotifications } from './useNotifications.js'
import { formatSectionName, formatScheduleDisplay } from '@/utils/formatters.js'
import { validateSection } from '@/utils/validators.js'

export function useSectionManagement() {
  // State
  const sections = ref([])
  const courses = ref([])
  const subjects = ref([])
  const rooms = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Notifications
  const { showSuccess, showError } = useNotifications()

  // Computed
  const sectionsWithFormattedNames = computed(() => {
    return sections.value.map(section => ({
      ...section,
      displayName: formatSectionName(section)
    }))
  })

  // Methods
  const fetchSections = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await sectionsApi.getAll()
      sections.value = response.sections || []
    } catch (err) {
      error.value = err.message
      showError('Failed to fetch sections: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        courses.value = data.courses || []
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/subjects', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        subjects.value = data.subjects || []
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/rooms', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        rooms.value = data.rooms || []
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    }
  }

  const createSection = async (sectionData) => {
    // Validate section data
    const validation = validateSection(sectionData)
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(', ')
      showError('Validation failed: ' + errorMessage)
      return { success: false, errors: validation.errors }
    }

    loading.value = true
    
    try {
      const response = await sectionsApi.create(sectionData)
      
      if (response.success) {
        await fetchSections() // Refresh sections list
        showSuccess('Section created successfully')
        return { success: true, section: response.section }
      } else {
        showError('Failed to create section: ' + response.error)
        return { success: false, error: response.error }
      }
    } catch (err) {
      showError('Failed to create section: ' + err.message)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateSection = async (sectionId, sectionData) => {
    loading.value = true
    
    try {
      const response = await sectionsApi.update(sectionId, sectionData)
      
      if (response.success) {
        await fetchSections() // Refresh sections list
        showSuccess('Section updated successfully')
        return { success: true }
      } else {
        showError('Failed to update section: ' + response.error)
        return { success: false, error: response.error }
      }
    } catch (err) {
      showError('Failed to update section: ' + err.message)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteSection = async (sectionId) => {
    loading.value = true
    
    try {
      const response = await sectionsApi.delete(sectionId)
      
      if (response.success) {
        await fetchSections() // Refresh sections list
        showSuccess('Section deleted successfully')
        return { success: true }
      } else {
        showError('Failed to delete section: ' + response.error)
        return { success: false, error: response.error }
      }
    } catch (err) {
      showError('Failed to delete section: ' + err.message)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const toggleSectionStatus = async (sectionId, newStatus) => {
    loading.value = true
    
    try {
      const response = await sectionsApi.toggleStatus(sectionId, newStatus)
      
      if (response.success) {
        await fetchSections() // Refresh sections list
        showSuccess(`Section ${newStatus} successfully`)
        return { success: true }
      } else {
        showError('Failed to update section status: ' + response.error)
        return { success: false, error: response.error }
      }
    } catch (err) {
      showError('Failed to update section status: ' + err.message)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Initialize data on mount
  onMounted(() => {
    fetchSections()
    fetchCourses()
    fetchSubjects()
    fetchRooms()
  })

  return {
    // State
    sections: computed(() => sections.value),
    courses: computed(() => courses.value),
    subjects: computed(() => subjects.value),
    rooms: computed(() => rooms.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    sectionsWithFormattedNames,

    // Methods
    fetchSections,
    fetchCourses,
    fetchSubjects,
    fetchRooms,
    createSection,
    updateSection,
    deleteSection,
    toggleSectionStatus
  }
}

export default useSectionManagement
