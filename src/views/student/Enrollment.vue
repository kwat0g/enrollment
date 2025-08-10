<script setup>
// Helper to get section name by id from allSections
function getSectionNameById(section_id) {
  // allSections is likely a ref, so use .value
  const sections = Array.isArray(allSections.value) ? allSections.value : allSections;
  const sid = typeof section_id === 'string' ? parseInt(section_id) : section_id;
  const section = sections.find(s => s.id === sid);
  return section ? section.name : section_id;
}

import { computed } from 'vue'

// Group selectedIrregularSubjects by subject_code only (show one row even if Lec/Lab are in different sections)
const groupedSelectedIrregularSubjects = computed(() => {
  const grouped = {}
  selectedIrregularSubjects.value.forEach(subj => {
    const key = `${subj.subject_code}`
    if (!grouped[key]) {
      grouped[key] = {
        subject_code: subj.subject_code,
        subject_name: subj.subject_name,
        section_id: null,
        section_name: null,
        lec: null,
        lab: null
      }
    }
    // Prefer Lec section for display if available, otherwise keep existing or use current
    if (!grouped[key].section_id || (subj.type === 'Lec' && grouped[key].lec === null)) {
      grouped[key].section_id = subj.section_id
      grouped[key].section_name = subj.section_name
    }
    if (subj.type === 'Lec') grouped[key].lec = subj
    if (subj.type === 'Lab') grouped[key].lab = subj
  })
  return Object.values(grouped)
})

import { ref, watch, onMounted } from 'vue'
import { useStudentData } from '@/composables/useStudentData'
import { useNotifications } from '@/composables/useNotifications'
import { useSectionManagement } from '@/composables/useSectionManagement'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { sections, enrollment, accountabilities, loading, error, refresh } = useStudentData()

const { notifications, loading: notifLoading, error: notifError, fetchNotifications, markAsRead } = useNotifications()

const { allSections, loading: sectionsLoading, error: sectionsError, fetchAllSections } = useSectionManagement()

const enrollLoading = ref(false)
const enrollError = ref('')
const enrollSuccess = ref('')

// Track which notifications are auto-dismissing
const autoDismissingNotifIds = ref([])

// Watch for new enrollment notifications and start auto-dismiss timer
watch(
  () => notifications.value.filter(n => n.type === 'enrollment' && !n.is_read),
  (notifs) => {
    notifs.forEach(notif => {
      if (!autoDismissingNotifIds.value.includes(notif.id)) {
        autoDismissingNotifIds.value.push(notif.id)
        setTimeout(() => {
          markAsRead(notif.id)
          // Remove from local state
          autoDismissingNotifIds.value = autoDismissingNotifIds.value.filter(id => id !== notif.id)
        }, 10000)
      }
    })
  },
  { immediate: true }
)

// Dismiss all enrollment notifications after successful enrollment
watch(enrollSuccess, (val) => {
  if (val) {
    notifications.value.filter(n => n.type === 'enrollment' && !n.is_read).forEach(n => markAsRead(n.id))
    autoDismissingNotifIds.value = []
  }
})

// Refetch notifications after enrollment status changes
watch(enrollment, () => {
  fetchNotifications()
})

onMounted(() => {
  fetchNotifications()
  // Ensure section names are available for lookups in previews/tables
  fetchAllSections()
})

// Flag: is current enrollment irregular? (case-insensitive)
const isIrregular = computed(() => ((enrollment.value?.enrollment?.enrollment_type) || '').toLowerCase() === 'irregular')

// Computed rows for registration table: group by subject/section for irregular
const registrationDisplayRows = computed(() => {
  const enr = enrollment.value
  const rows = enr?.schedule || []
  if (!isIrregular.value) return rows
  const map = {}
  rows.forEach((item) => {
    const secId = item.section_id || null
    const secName = item.section_name || (secId ? getSectionNameById(secId) : '')
    const key = `${item.subject_code}_${secId || secName}`
    if (!map[key]) {
      map[key] = {
        subject_code: item.subject_code || item.code,
        subject_name: item.subject_name,
        units: item.units,
        section_id: secId,
        section_name: secName,
        room_name: item.room_name,
        instructor: item.instructor || '',
      }
    }
  })
  return Object.values(map)
})

// For irregular: choose a single display section per subject_code (prefer Lec if available)
const irregularSubjectSectionMap = computed(() => {
  const map = {}
  const rows = enrollment.value?.schedule || []
  rows.forEach(item => {
    const code = item.subject_code || item.code
    const secName = item.section_name || (item.section_id ? getSectionNameById(item.section_id) : null)
    if (!code || !secName) return
    if (!map[code]) {
      map[code] = secName
    }
    if (item.type === 'Lec') {
      map[code] = secName
    }
  })
  return map
})

// Format time as 12-hour with AM/PM
function formatTime(timeStr) {
  if (!timeStr) return '';
  // Try to parse as HH:mm or H:mm
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  let hour = h % 12;
  if (hour === 0) hour = 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`;
}

// Modal state
const showEnrollModal = ref(false)
const showAvailableSectionsModal = ref(false)
const showIrregularEnrollModal = ref(false)
const selectedSection = ref(null)

// Irregular enrollment state
const allScheduledSubjects = ref([])
const selectedIrregularSubjects = ref([])
const irregularLoading = ref(false)
const irregularError = ref('')
const selectedScheduleOptions = ref({})
const expandedSubjects = ref({})

async function openEnrollModal(section) {
  selectedSection.value = section
  
  // Fetch complete schedule data with subject type and instructor
  try {
    const response = await axios.get(`/api/admin/sections/${section.id}/schedules`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    
    // Update the selected section with complete schedule data
    selectedSection.value = {
      ...section,
      schedules: response.data
    }
  } catch (err) {
    console.error('Failed to fetch complete schedule data:', err)
    // Fall back to original schedule data if API fails
  }
  
  showEnrollModal.value = true
}

function closeEnrollModal() {
  showEnrollModal.value = false
  selectedSection.value = null
}

function openAvailableSectionsModal() {
  fetchAllSections()
  showAvailableSectionsModal.value = true
}

function closeAvailableSectionsModal() {
  showAvailableSectionsModal.value = false
}

// Irregular enrollment functions
async function openIrregularEnrollModal() {
  showIrregularEnrollModal.value = true
  selectedIrregularSubjects.value = []
  irregularError.value = ''
  
  // Fetch all available subjects first
  await fetchAllScheduledSubjects()
  
  // Check if student has pending irregular enrollment and auto-fill
  await checkAndAutoFillPendingIrregularEnrollment()
}

// Check for pending irregular enrollment and auto-fill subjects
async function checkAndAutoFillPendingIrregularEnrollment() {
  try {
    // Check if student has a pending irregular enrollment
    const enrollmentData = enrollment.value?.enrollment
    if (enrollmentData && enrollmentData.status === 'pending' && enrollmentData.enrollment_type === 'irregular') {
      // Fetch the irregular enrollment details
      const response = await axios.get(`/api/admin/enrollments/${enrollmentData.id}/irregular-details`, {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      })
      
      const { subjects: pendingSubjects } = response.data
      
      if (pendingSubjects && pendingSubjects.length > 0) {
        // Map pending subjects to match the format expected by selectedIrregularSubjects
        const mappedSubjects = pendingSubjects.map(subject => {
          // Create subject object with all required fields for the template
          return {
            id: subject.schedule_id,
            subject_id: subject.subject_id,
            section_id: subject.section_id,
            subject_code: subject.subject_code,
            subject_name: subject.subject_name,
            type: subject.type,
            section_name: subject.section_name,
            day: subject.day,
            start_time: subject.start_time,
            end_time: subject.end_time,
            room_name: subject.room_name,
            instructor: subject.instructor,
            instructor_name: subject.instructor_name || subject.instructor
          }
        })
        
        // Auto-fill the selected subjects
        selectedIrregularSubjects.value = [...mappedSubjects]
        
        // Force Vue to update the template
        await nextTick()
        
        // Show a message to indicate auto-fill
        irregularError.value = 'Your pending irregular enrollment has been loaded. You can modify your selections below.'
      }
    }
  } catch (error) {
    console.error('Error checking pending irregular enrollment:', error)
    // Don't show error to user as this is optional functionality
  }
}

function closeIrregularEnrollModal() {
  showIrregularEnrollModal.value = false
  allScheduledSubjects.value = []
  selectedIrregularSubjects.value = []
  selectedScheduleOptions.value = {}
  expandedSubjects.value = {}
  irregularError.value = ''
}

// Toggle subject dropdown
function toggleSubjectDropdown(subjectCode) {
  expandedSubjects.value = {
    ...expandedSubjects.value,
    [subjectCode]: !expandedSubjects.value[subjectCode]
  }
}

// Get subject units
function getSubjectUnits(subjectCode) {
  const subject = allScheduledSubjects.value.find(s => s.subject_code === subjectCode)
  return subject ? subject.units : 0
}

// Get subject prerequisites
function getSubjectPrerequisites(subjectCode) {
  const subject = allScheduledSubjects.value.find(s => s.subject_code === subjectCode)
  return subject?.prerequisites || null
}

// Get subject year level
function getSubjectYearLevel(subjectCode) {
  const subject = allScheduledSubjects.value.find(s => s.subject_code === subjectCode)
  return subject?.year_level || null
}

// Get subject semester
function getSubjectSemester(subjectCode) {
  const subject = allScheduledSubjects.value.find(s => s.subject_code === subjectCode)
  return subject?.semester ? 
    (subject.semester === 1 ? '1st' : 
     subject.semester === 2 ? '2nd' : 
     subject.semester === 3 ? 'Summer' : '') : 
    null
}

// Get section schedule type (Morning/Afternoon)
function getSectionScheduleType(schedules) {
  const schedule = schedules.lec || schedules.lab
  if (!schedule) return ''
  
  const hour = new Date(`2000-01-01T${schedule.start_time}`).getHours()
  return hour < 12 ? 'Morning' : 'Afternoon'      
}

// Get instructor name by ID
async function getInstructorName(instructorId) {
  if (!instructorId) return 'TBA';
  
  try {
    // First check if it's already a name (in case it's already been fetched)
    if (typeof instructorId === 'string' && instructorId.trim() !== '' && isNaN(instructorId)) {
      return instructorId;
    }
    
    // If it's a number or numeric string, try to fetch the name
    const response = await axios.get(`/api/instructors/${instructorId}`, {
      headers: { Authorization: `Bearer ${userStore.token}` }
    });
    
    return response.data.name || `Instructor ${instructorId}`;
  } catch (error) {
    console.error('Error fetching instructor:', error);
    return `Instructor ${instructorId}`;
  }
}

// Fetch all scheduled subjects from all sections
async function fetchAllScheduledSubjects() {
  irregularLoading.value = true
  irregularError.value = ''
  try {
    console.log('Fetching all scheduled subjects...') // Debug log
    const response = await axios.get('/api/student/subjects/all-scheduled', {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    console.log('API Response:', response.data) // Debug log
    allScheduledSubjects.value = response.data
    console.log('All scheduled subjects:', allScheduledSubjects.value) // Debug log
  } catch (err) {
    console.error('Error fetching scheduled subjects:', err) // Debug log
    irregularError.value = err.response?.data?.error || err.message || 'Failed to fetch subjects'
    allScheduledSubjects.value = []
  } finally {
    irregularLoading.value = false
  }
}

// Toggle subject selection with auto-pairing logic
function toggleSubjectSelection(subject) {
  const isSelected = selectedIrregularSubjects.value.some(s => s.id === subject.id)
  
  if (isSelected) {
    // Find paired subject (lecture/lab with same subject_code but different type)
    const pairedSubject = allScheduledSubjects.value.find(s => 
      s.subject_code === subject.subject_code && 
      s.type !== subject.type
    )
    
    // Remove both the subject and its paired subject
    selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(s => {
      if (pairedSubject) {
        return s.id !== subject.id && s.id !== pairedSubject.id
      } else {
        return s.id !== subject.id
      }
    })
  } else {
    // Add subject
    selectedIrregularSubjects.value.push(subject)
    
    // Auto-add paired subject (lecture/lab)
    const pairedSubject = allScheduledSubjects.value.find(s => 
      s.subject_code === subject.subject_code && 
      s.type !== subject.type
    )
    
    if (pairedSubject && !selectedIrregularSubjects.value.some(s => s.id === pairedSubject.id)) {
      selectedIrregularSubjects.value.push(pairedSubject)
    }
  }
}

// Check if subject is selected
function isSubjectSelected(subject) {
  return selectedIrregularSubjects.value.some(s => s.id === subject.id)
}

// Group subjects by subject code and section to show all available options
function getGroupedSubjects() {
  const grouped = {}
  allScheduledSubjects.value.forEach(subject => {
    // Create unique key combining subject_code and section_id
    const key = `${subject.subject_code}_${subject.section_id}`
    
    if (!grouped[key]) {
      grouped[key] = {
        code: subject.subject_code,
        name: subject.subject_name,
        units: subject.units,
        section_name: subject.section_name,
        section_id: subject.section_id,
        lecture: null,
        laboratory: null,
        hasMultipleTypes: false
      }
    }
    
    if (subject.type === 'Lec') {
      grouped[key].lecture = subject
    } else if (subject.type === 'Lab') {
      grouped[key].laboratory = subject
    }
  })
  
  // Mark subjects that have both lecture and lab
  Object.values(grouped).forEach(group => {
    group.hasMultipleTypes = group.lecture && group.laboratory
  })
  
  return Object.values(grouped)
}

// Get unique subject codes for dropdown interface
function getUniqueSubjectCodes() {
  const codes = [...new Set(allScheduledSubjects.value.map(s => s.subject_code))]
  return codes.sort()
}

// Get subject name by code
function getSubjectName(subjectCode) {
  const subject = allScheduledSubjects.value.find(s => s.subject_code === subjectCode)
  return subject ? subject.subject_name : ''
}

// Get all schedules for a specific subject code
function getSchedulesForSubject(subjectCode) {
  return allScheduledSubjects.value.filter(s => s.subject_code === subjectCode)
}

// Group schedules by section, merging lecture and lab
function getMergedSchedules(subjectCode) {
  const schedules = getSchedulesForSubject(subjectCode)
  console.log('Schedules for', subjectCode, ':', schedules) // Debug log
  
  const merged = {}
  
  // Group by section and type
  schedules.forEach(schedule => {
    const sectionName = schedule.section_name
    const type = schedule.type.toLowerCase() // Convert to lowercase to match expected values
    
    if (!merged[sectionName]) {
      merged[sectionName] = {}
    }
    
    // Store the schedule with the type as the key (lecture/laboratory)
    merged[sectionName][type] = {
      ...schedule,
      // Ensure all required fields exist
      day: schedule.day || '',
      start_time: schedule.start_time || '00:00:00',
      end_time: schedule.end_time || '00:00:00',
      room_name: schedule.room_name || 'TBA',
      instructor_name: schedule.instructor || 'TBA'
    }
  })
  
  console.log('Merged schedules:', merged) // Debug log
  return merged
}

// Check if all schedules for a subject/section are selected
function isSubjectSectionSelected(subjectCode, sectionName) {
  const merged = getMergedSchedules(subjectCode)[sectionName]
  if (!merged) return false
  // Check if all schedules (lec/lab) for this section are in the selected list
  return Object.values(merged).every(sched =>
    selectedIrregularSubjects.value.some(sel => sel.id === sched.id)
  )
}

// Remove all schedules for a subject/section from selectedIrregularSubjects
function removeSubjectSection(subjectCode, sectionName) {
  const merged = getMergedSchedules(subjectCode)[sectionName]
  if (!merged) return
  const idsToRemove = Object.values(merged).map(sched => sched.id)
  selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(sel => !idsToRemove.includes(sel.id))
}

// Enroll in a specific section (both lecture and lab if available)
function enrollInSection(subjectCode, schedules) {
  // Remove any existing enrollments for this subject code
  selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(
    s => s.subject_code !== subjectCode
  )
  
  // Add all schedules (both lecture and lab if they exist)
  Object.values(schedules).forEach(schedule => {
    if (schedule) {
      selectedIrregularSubjects.value.push(schedule)
    }
  })
}

// Get schedule options for dropdown
function getScheduleOptions(subjectCode) {
  const schedules = getSchedulesForSubject(subjectCode)
  const options = []
  
  // Group by section and type
  const grouped = {}
  schedules.forEach(schedule => {
    const key = `${schedule.section_name}_${schedule.type}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(schedule)
  })
  
  // Create options for each section/type combination
  Object.entries(grouped).forEach(([key, scheduleList]) => {
    const [sectionName, type] = key.split('_')
    const schedule = scheduleList[0] // Take first schedule (should be only one per section/type)
    
    const label = `${type} - ${sectionName} | ${schedule.day} ${formatTime(schedule.start_time)}-${formatTime(schedule.end_time)} | ${schedule.room_name || 'TBA'}`
    options.push({
      value: schedule.id,
      label: label,
      schedule: schedule
    })
  })
  
  return options
}

// Handle schedule selection from dropdown
function handleScheduleSelection(subjectCode, schedule) {
  // This function will be called when dropdown changes
  // The actual enrollment happens when the Enroll button is clicked
}

// Enroll in selected schedule from dropdown
function enrollInSelectedSchedule(subjectCode) {
  const selectedScheduleId = selectedScheduleOptions.value[subjectCode]
  if (!selectedScheduleId) return
  
  const selectedSchedule = allScheduledSubjects.value.find(s => s.id == selectedScheduleId)
  if (!selectedSchedule) return
  
  // Check for existing enrollment in the same subject code from different section
  const existingSubjects = selectedIrregularSubjects.value.filter(s => s.subject_code === subjectCode)
  
  if (existingSubjects.length > 0) {
    // Remove existing subjects with same code (from different section)
    selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(s => s.subject_code !== subjectCode)
  }
  
  // Find paired subject (lecture/lab) in the same section
  const pairedSubject = allScheduledSubjects.value.find(s => 
    s.subject_code === subjectCode && 
    s.section_id === selectedSchedule.section_id &&
    s.type !== selectedSchedule.type
  )
  
  // Add selected schedule
  selectedIrregularSubjects.value.push(selectedSchedule)
  
  // Auto-add paired subject if it exists
  if (pairedSubject) {
    selectedIrregularSubjects.value.push(pairedSubject)
  }
  
  // Clear the dropdown selection
  selectedScheduleOptions.value[subjectCode] = ''
}

// Check if a subject group is selected (both lecture and lab if applicable)
function isSubjectGroupSelected(group) {
  if (group.hasMultipleTypes) {
    // Both lecture and lab must be selected
    return group.lecture && group.laboratory && 
           selectedIrregularSubjects.value.some(s => s.id === group.lecture.id) &&
           selectedIrregularSubjects.value.some(s => s.id === group.laboratory.id)
  } else {
    // Single type subject
    const subject = group.lecture || group.laboratory
    return subject && selectedIrregularSubjects.value.some(s => s.id === subject.id)
  }
}

// Enroll in subject group with duplicate validation
function enrollInSubjectGroup(group) {
  const isCurrentlySelected = isSubjectGroupSelected(group)
  
  if (isCurrentlySelected) {
    // Remove the current selection
    if (group.hasMultipleTypes) {
      selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(s => 
        s.id !== group.lecture.id && s.id !== group.laboratory.id
      )
    } else {
      const subject = group.lecture || group.laboratory
      selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(s => s.id !== subject.id)
    }
  } else {
    // Check for existing enrollment in the same subject code from different section
    const existingSubjects = selectedIrregularSubjects.value.filter(s => s.subject_code === group.code)
    
    if (existingSubjects.length > 0) {
      // Remove existing subjects with same code (from different section)
      selectedIrregularSubjects.value = selectedIrregularSubjects.value.filter(s => s.subject_code !== group.code)
    }
    
    // Add new selection
    if (group.hasMultipleTypes) {
      selectedIrregularSubjects.value.push(group.lecture)
      selectedIrregularSubjects.value.push(group.laboratory)
    } else {
      const subject = group.lecture || group.laboratory
      selectedIrregularSubjects.value.push(subject)
    }
  }
}

// Toggle subject group selection (lecture and lab together) - kept for compatibility
function toggleSubjectGroupSelection(group) {
  enrollInSubjectGroup(group)
}

// Confirm irregular enrollment
async function confirmIrregularEnroll() {
  if (selectedIrregularSubjects.value.length === 0) {
    irregularError.value = 'Please select at least one subject.'
    return
  }

  irregularLoading.value = true
  irregularError.value = ''

  try {
    const school_year = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    const semester = '1st Semester'

    // Detect if editing a pending irregular enrollment
    let enrollment_id = null
    const enrollmentData = enrollment.value?.enrollment
    if (enrollmentData && enrollmentData.status === 'pending' && enrollmentData.enrollment_type === 'irregular') {
      enrollment_id = enrollmentData.id
    }

    await axios.post('/api/student/enroll/irregular', {
      subject_schedules: selectedIrregularSubjects.value.map(s => ({
        subject_id: s.subject_id,
        schedule_id: s.id,
        section_id: s.section_id
      })),
      school_year,
      semester,
      ...(enrollment_id ? { enrollment_id } : {})
    }, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })

    enrollSuccess.value = enrollment_id
      ? 'Irregular enrollment updated successfully!'
      : 'Irregular enrollment request submitted!'
    await refresh()
    closeIrregularEnrollModal()
  } catch (err) {
    irregularError.value = err.response?.data?.error || err.message || 'Irregular enrollment failed.'
  } finally {
    irregularLoading.value = false
  }
}

async function confirmEnroll() {
  if (!selectedSection.value) return
  enrollLoading.value = true
  enrollError.value = ''
  enrollSuccess.value = ''
  try {
    const school_year = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    const semester = '1st Semester' // or get from user selection
    await axios.post('/api/student/enroll', {
      section_id: selectedSection.value.id,
      school_year,
      semester,
    }, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    enrollSuccess.value = 'Enrollment request submitted!'
    await refresh()
    closeEnrollModal()
    closeAvailableSectionsModal()
  } catch (err) {
    enrollError.value = err.response?.data?.error || err.message || 'Enrollment failed.'
  } finally {
    enrollLoading.value = false
  }
}
</script>

<template>
  <!-- Enrollment Notifications -->
  <div v-if="!notifLoading && notifications && notifications.length" class="mb-4 mt-2">
    <div v-for="notif in notifications.filter(n => n.type === 'enrollment' && !n.is_read)" :key="notif.id" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-2 rounded flex items-center justify-between">
      <span>{{ notif.message }}</span>
      <button @click="markAsRead(notif.id)" class="ml-4 text-yellow-800 hover:text-yellow-600 font-bold">Dismiss</button>
    </div>
  </div>

  <div class="w-full max-w-full min-w-0 px-2 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Enrollment</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>

      <div v-if="!enrollment || enrollment.enrollment === null">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Available Sections</h3>
          <button
            v-if="!(accountabilities && accountabilities.some(a => a.status === 'pending'))"
            @click="openIrregularEnrollModal"
            class="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition font-semibold"
          >
            Irregular Enrollment
          </button>
        </div>
        <div v-if="accountabilities && accountabilities.some(a => a.status === 'pending')" class="mb-4 bg-yellow-100 text-yellow-800 p-3 rounded">
          You have pending accountabilities. Enrollment is blocked until you settle them.
        </div>
        <div v-if="enrollSuccess" class="text-green-700 font-bold mb-2">{{ enrollSuccess }}</div>
        <div v-if="enrollError" class="text-red-600 font-bold mb-2">{{ enrollError }}</div>
        <div v-if="!(accountabilities && accountabilities.some(a => a.status === 'pending'))" class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
          <table class="min-w-[350px] w-full text-xs sm:text-sm mb-6">
            <thead class="bg-gray-100 text-gray-900">
              <tr>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Section</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Schedule Type</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="section in sections" :key="section.id" class="text-gray-900">
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.name }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.schedule_type.toUpperCase() }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
                  <button
                    v-if="section.status === 'open'"
                    class="bg-gray-200 text-gray-900 px-4 py-1 rounded hover:bg-gray-300 transition"
                    :disabled="enrollLoading"
                    @click="openEnrollModal(section)"
                  >
                    {{ enrollLoading ? 'Enrolling...' : 'Enroll' }}
                  </button>
                  <span v-else class="text-red-600 font-medium px-4 py-1">
                    Closed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else>
        <!-- Available Sections Button for Pending Enrollments -->
        <div v-if="enrollment.enrollment && enrollment.enrollment.status === 'pending'" class="mb-4">
          <div class="flex gap-4 mb-6">
            <button @click="openAvailableSectionsModal" class="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold">
              Change Section
            </button>
            <button
              v-if="!(accountabilities && accountabilities.some(a => a.status === 'pending'))"
              @click="openIrregularEnrollModal"
              class="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
            >
              Irregular Enrollment
            </button>
          </div>
        </div>
        
        <div class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
          <div v-if="enrollment.enrollment && enrollment.enrollment.reference_number" class="mb-4 text-xs">
            Reference: {{ enrollment.enrollment.reference_number }}
          </div>
          <div v-else="enrollment.enrollment === null || enrollment.enrollment === undefined" class="mb-4 text-xs text-red-600">
            Reference: Pending
          </div>
          <!-- Registration Form Header and Subject Table as one scrollable unit -->
          <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-4">
            <tbody>
              <tr>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Student No.</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.student_id }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Last Name</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.last_name }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">First Name</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.first_name }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Middle Name</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.middle_name }}</td>
              </tr>
              <tr>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Address</td>
                <td class="border px-2 py-1 whitespace-normal break-words" colspan="3">{{ userStore.user.address }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Contact No.</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.contact_number }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Gender</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.gender }}</td>
              </tr>
              <tr>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Course Code</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.course_id }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Year Level</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ userStore.user.year_level }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Semester</td>
                <td class="border px-2 py-1 whitespace-normal break-words" colspan="3">{{ enrollment.enrollment?.semester || 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
          <table class="min-w-[600px] w-full border text-xs sm:text-sm mt-2">
            <thead>
              <tr class="bg-gray-50 text-gray-900">
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Code</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Description</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Units</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Type</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Days</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Start</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">End</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Section</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Room</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Instructor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in enrollment.schedule || []" :key="item.id">
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.subject_code || item.code }}</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ item.subject_name }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.units }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.type }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.day }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ formatTime(item.start_time) }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ formatTime(item.end_time) }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">
                  {{
                    isIrregular
                      ? (irregularSubjectSectionMap[item.subject_code || item.code] || (item.section_name || (item.section_id ? getSectionNameById(item.section_id) : 'N/A')))
                      : (enrollment.section?.name || 'N/A')
                  }}
                </td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.room_name }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.instructor || '' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="border px-2 py-1 text-right font-semibold whitespace-normal break-words" colspan="2">Total Units:</td>
                <td class="border px-2 py-1 text-center font-bold whitespace-normal break-words">{{ (enrollment.schedule || []).reduce((sum, item) => sum + (item.units || 0), 0) }}</td>
                <td class="border px-2 py-1 whitespace-normal break-words" colspan="7"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showEnrollModal && selectedSection" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-[60] pointer-events-auto">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
      <h3 class="text-xl font-bold mb-4 text-blue-900">Subjects for {{ selectedSection.name }}</h3>
      <div v-if="selectedSection.schedules && selectedSection.schedules.length">
        <table class="w-full text-sm mb-4">
          <thead>
            <tr class="bg-gray-100">
              <th class="py-2 px-2 text-left">Subject Code</th>
              <th class="py-2 px-2 text-left">Subject Name</th>
              <th class="py-2 px-2 text-center">Type</th>
              <th class="py-2 px-2 text-center">Day</th>
              <th class="py-2 px-2 text-center">Time</th>
              <th class="py-2 px-2 text-left">Instructor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sched in selectedSection.schedules" :key="sched.id || (sched.section_id + '-' + sched.subject_code)" class="border-b">
              <td class="py-2 px-2 font-semibold">{{ sched.subject_code }}</td>
              <td class="py-2 px-2">{{ sched.subject_name }}</td>
              <td class="py-2 px-2 text-center">
                <span class="px-2 py-1 text-xs rounded" :class="sched.type === 'Lec' ? 'bg-blue-100 text-blue-800' : sched.type === 'Lab' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                  {{ sched.type || 'TBD' }}
                </span>
              </td>
              <td class="py-1 px-2 text-center">{{ sched.day }}</td>
              <td class="py-1 px-2 text-center">
                <div class="text-xs">
                  {{ formatTime(sched.start_time) }} - {{ formatTime(sched.end_time) }}
                </div>
              </td>
              <td class="py-1 px-2">{{ sched.instructor || 'TBA' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="mb-4 text-gray-500">No subjects assigned to this section.</div>
      <div class="flex gap-2 justify-end mt-4">
        <button @click="closeEnrollModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
        <button @click="confirmEnroll" :disabled="enrollLoading" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold disabled:opacity-50">Confirm Enroll</button>
      </div>
      <button @click="closeEnrollModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      <div v-if="enrollError" class="text-red-600 font-bold mt-2">{{ enrollError }}</div>
    </div>
  </div>

  <!-- Available Sections Modal -->
  <div v-if="showAvailableSectionsModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
      <h3 class="text-xl font-bold mb-4 text-blue-900">Available Sections</h3>
      
      <div v-if="sectionsLoading" class="text-center py-8">
        <div class="text-gray-600">Loading available sections...</div>
      </div>
      
      <div v-else-if="sectionsError" class="text-red-600 font-bold mb-4">{{ sectionsError }}</div>
      
      <div v-else-if="allSections && allSections.length > 0">
        <div class="mb-4 text-sm text-gray-600">
          You can change your enrollment by selecting a different section below.
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-[600px] w-full text-sm">
            <thead class="bg-gray-100 text-gray-900">
              <tr>
                <th class="py-2 px-4 text-center">Section</th>
                <th class="py-2 px-4 text-center">Schedule Type</th>
                <th class="py-2 px-4 text-center">Status</th>
                <th class="py-2 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="section in allSections" :key="section.id" class="text-gray-900 border-b">
                <td class="py-3 px-4 text-center">{{ section.name }}</td>
                <td class="py-3 px-4 text-center">{{ section.schedule_type.toUpperCase() }}</td>
                <td class="py-3 px-4 text-center">
                  <span :class="section.status === 'open' ? 'text-green-600' : 'text-red-600'" class="font-semibold">
                    {{ section.status.toUpperCase() }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <button
                    v-if="section.status === 'open'"
                    class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold"
                    :disabled="enrollLoading"
                    @click="openEnrollModal(section)"
                  >
                    {{ enrollLoading ? 'Enrolling...' : 'Enroll' }}
                  </button>
                  <span v-else class="text-gray-500">Closed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-else class="text-center py-8 text-gray-600">
        No available sections found for your year level and course.
      </div>
      
      <div class="flex justify-end mt-6">
        <button @click="closeAvailableSectionsModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Close</button>
      </div>
      
      <button @click="closeAvailableSectionsModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
    </div>
  </div>

  <!-- Irregular Enrollment Modal -->
  <div v-if="showIrregularEnrollModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden relative flex flex-col">
      <h3 class="text-lg font-bold mb-4">Select Subjects</h3>
      
      <div v-if="irregularLoading" class="text-center py-8">
        <div class="text-gray-600">Loading...</div>
      </div>
      
      <div v-else-if="irregularError" class="text-red-600 mb-4">{{ irregularError }}</div>
      
      <div v-else-if="allScheduledSubjects && allScheduledSubjects.length > 0" class="flex gap-4 min-h-0 h-[70vh]">
        <!-- Left Side: Available Subjects -->
        <div class="flex-1 flex flex-col min-h-0 h-full">
          <h4 class="font-medium mb-2 text-sm">Available Subjects:</h4>
          <div class="flex-1 overflow-y-auto border rounded">
            <div v-for="subjectCode in getUniqueSubjectCodes()" :key="subjectCode" 
                 class="border-b">
              <div class="p-3">
                <div class="flex items-center justify-between cursor-pointer" @click="toggleSubjectDropdown(subjectCode)">
                  <div class="font-medium text-sm">
                    {{ subjectCode }} - {{ getSubjectName(subjectCode) }}
                  </div>
                  <div class="ml-2 flex-shrink-0">
                    <svg class="w-4 h-4 transition-transform duration-200 text-gray-600" 
                         :class="{ 'rotate-180': expandedSubjects[subjectCode] }" 
                         fill="none" 
                         stroke="currentColor" 
                         viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                
                <!-- Dropdown Content -->
                <div v-if="expandedSubjects[subjectCode]" class="mt-1 space-y-1">
                  <div v-for="(schedules, sectionName) in getMergedSchedules(subjectCode)" 
                       :key="sectionName"
                       class="bg-white border rounded overflow-hidden">
                    <div class="p-2">
                      <!-- Schedule Details -->
                      <div class="space-y-1">
                        <!-- Lecture Schedule -->
                        <div v-if="schedules.lec" class="text-sm flex justify-between items-center">
                          <div>
                            <span class="font-medium text-blue-700">Lec {{ sectionName }}</span>
                            <span> | </span>
                            <span>{{ schedules.lec.day }} {{ formatTime(schedules.lec.start_time) }}-{{ formatTime(schedules.lec.end_time) }}</span>
                            <span> | </span>
                            <span>{{ schedules.lec.room_name || 'TBA' }}</span>
                            <span> | </span>
                            <span>{{ schedules.lec.instructor_name || schedules.lec.instructor || 'TBA' }}</span>
                          </div>
                          <button v-if="!isSubjectSectionSelected(subjectCode, sectionName)"
                                  @click="enrollInSection(subjectCode, schedules)"
                                  class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 ml-2">
                            Enroll
                          </button>
                          <button v-else
                                  @click="removeSubjectSection(subjectCode, sectionName)"
                                  class="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 ml-2">
                            Remove
                          </button>
                        </div>
                        
                        <!-- Lab Schedule -->
                        <div v-if="schedules.lab" class="text-sm">
                          <span class="font-medium text-green-700">Lab {{ sectionName }}</span>
                          <span> | </span>
                          <span>{{ schedules.lab.day }} {{ formatTime(schedules.lab.start_time) }}-{{ formatTime(schedules.lab.end_time) }}</span>
                          <span> | </span>
                          <span>{{ schedules.lab.room_name || 'TBA' }}</span>
                          <span> | </span>
                          <span>{{ schedules.lab.instructor_name || schedules.lab.instructor || 'TBA' }}</span>
                        </div>
                        
                        <!-- Lab Only with Enroll Button -->
                        <div v-if="!schedules.lec && schedules.lab" class="text-xs flex justify-between items-center">
                          <div>
                            <span class="font-medium text-green-700">Lab {{ sectionName }}</span>
                            <span> | </span>
                            <span>{{ schedules.lab.day }} {{ formatTime(schedules.lab.start_time) }}-{{ formatTime(schedules.lab.end_time) }}</span>
                            <span> | </span>
                            <span>{{ schedules.lab.room_name || 'TBA' }}</span>
                            <span> | </span>
                            <span>{{ schedules.lab.instructor_name || schedules.lab.instructor || 'TBA' }}</span>
                          </div>
                          <button @click="enrollInSection(subjectCode, schedules)" 
                                  class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 ml-2">
                            Enroll
                          </button>
                        </div>
                        
                        <!-- No Schedule Warning -->
                        <div v-if="!schedules.lec && !schedules.lab" class="text-xs text-gray-500 italic">
                          No schedule information available
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right Side: Selected Subjects Preview -->
        <div class="w-80 flex flex-col min-h-0 h-full border-l pl-4">
          <h4 class="font-medium mb-2 text-sm">Selected: ({{ groupedSelectedIrregularSubjects.length }})</h4>
          <div class="flex-1 overflow-y-auto">
            
            <div v-if="selectedIrregularSubjects.length > 0" class="space-y-1">
              <div v-for="group in groupedSelectedIrregularSubjects" :key="group.subject_code + '_' + group.section_id" 
                   class="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ group.subject_code }} - {{ group.subject_name }}</div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-gray-700 truncate">
                      Section {{
                        group.section_name
                          || group.lec?.section_name
                          || group.lab?.section_name
                          || (group.section_id ? getSectionNameById(group.section_id) : (group.lec ? getSectionNameById(group.lec.section_id) : getSectionNameById(group.lab?.section_id)))
                      }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span v-if="group.lec" class="px-2 py-0.5 bg-white border rounded text-[10px] sm:text-xs text-gray-700">
                      Lec: {{ group.lec.day }} {{ formatTime(group.lec.start_time) }} - {{ formatTime(group.lec.end_time) }}
                    </span>
                    <span v-if="group.lab" class="px-2 py-0.5 bg-white border rounded text-[10px] sm:text-xs text-gray-700">
                      Lab: {{ group.lab.day }} {{ formatTime(group.lab.start_time) }} - {{ formatTime(group.lab.end_time) }}
                    </span>
                  </div>
                </div>
                <div class="flex-shrink-0 ml-2">
                  <button @click="removeSubjectSection(group.subject_code, group.section_name || (group.lec ? group.lec.section_name : group.lab?.section_name))"
                          class="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                          title="Remove Section">
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500 text-xs py-4 text-center">
              No subjects selected yet.
              <br>Click subjects on the left to add them.
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-8 text-gray-600">
        No subjects available.
      </div>
      
      <div class="flex justify-between mt-6 pt-4 border-t">
        <button @click="closeIrregularEnrollModal" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          Cancel
        </button>
        <button @click="confirmIrregularEnroll" 
                :disabled="selectedIrregularSubjects.length === 0 || irregularLoading" 
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
          {{ irregularLoading ? 'Enrolling...' : `Enroll` }}
        </button>
      </div>
      
      <button @click="closeIrregularEnrollModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
    </div>
  </div>
</template>
