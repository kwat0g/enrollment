<script setup>
import { ref, onMounted, nextTick } from 'vue'
const showScheduleModal = ref(false)
const pendingSchedules = ref([])

const sections = ref([])
const loading = ref(true)
const error = ref('')

const showAddModal = ref(false)
const showNotifModal = ref(false)
const notifMessage = ref('')
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref(null)

const newSection = ref({
  name: '',
  year_level: '',
  course_id: '',
  schedule_type: '', // require selection, no default
  status: 'closed'
})

const courses = ref([])
const yearLevels = [
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' },
  { value: 'summer', label: 'Summer' }
]

// Subject assignment modal state
const showSubjectModal = ref(false)
const subjectOptions = ref([])
const selectedSubjectIds = ref([])
const subjectAssignSectionId = ref(null)
const subjectAssignCourseId = ref(null)
const subjectAssignYearLevel = ref(null)

// Edit Section state
const showEditModal = ref(false)
const editSection = ref({ id: '', name: '', year_level: '', course_id: '', schedule_type: '', status: 'closed' })
const editSubjectOptions = ref([])
const editSelectedSubjectIds = ref([])

// State for unsaved changes and confirmation modals
const originalEditSection = ref(null)
const originalEditSubjectIds = ref([])
const showUnsavedModal = ref(false)

// Add a new state to track if subject editing is blocked
const subjectEditBlocked = ref(false)

// --- Subject schedule editing state and function ---
const showEditSubjectModal = ref(false)
const editSubjectSchedule = ref({})

async function openEditSubjectScheduleModal(sectionId, subjectId) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/sections/${sectionId}/subjects/${subjectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch subject schedule')
    // Flatten schedule fields into main object for easy v-model
    editSubjectSchedule.value = {
      ...data,
      day: data.schedule?.day || '',
      start_time: data.schedule?.start_time || '',
      end_time: data.schedule?.end_time || '',
      type: data.schedule?.type || '',
      room_id: data.schedule?.room_id || '',
      schedule_id: data.schedule?.id || ''
    }
    showEditSubjectModal.value = true
  } catch (err) {
    notifMessage.value = err.message
    showNotifModal.value = true
  }
}

async function saveEditSubjectSchedule() {
  try {
    const token = sessionStorage.getItem('admin_token')
    // Update the schedule row
    const res = await fetch(`http://localhost:5000/api/admin/schedules/${editSubjectSchedule.value.schedule_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        day: editSubjectSchedule.value.day,
        start_time: editSubjectSchedule.value.start_time,
        end_time: editSubjectSchedule.value.end_time,
        type: editSubjectSchedule.value.type,
        room_id: editSubjectSchedule.value.room_id
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update schedule')
    showEditSubjectModal.value = false
    notifMessage.value = 'Subject schedule updated!'
    showNotifModal.value = true
    // Optionally refresh assigned subjects/schedules here
  } catch (err) {
    notifMessage.value = err.message
    showNotifModal.value = true
  }
}
function closeEditSubjectModal() {
  showEditSubjectModal.value = false
}

// Helper to check if there are unsaved changes
function hasEditChanges() {
  if (!originalEditSection.value) return false
  const sectionChanged = JSON.stringify({
    name: editSection.value.name,
    year_level: editSection.value.year_level,
    course_id: editSection.value.course_id,
    schedule_type: editSection.value.schedule_type
  }) !== JSON.stringify({
    name: originalEditSection.value.name,
    year_level: originalEditSection.value.year_level,
    course_id: originalEditSection.value.course_id,
    schedule_type: originalEditSection.value.schedule_type
  })
  const subjectsChanged = JSON.stringify([...editSelectedSubjectIds.value].sort()) !== JSON.stringify([...originalEditSubjectIds.value].sort())
  return sectionChanged || subjectsChanged
}

async function fetchSections() {
  loading.value = true
  error.value = ''
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/sections', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sections')
    sections.value = data
  } catch (err) {
    error.value = err.message
    showNotification(err.message)
    showNotifModal.value = true
  } finally {
    loading.value = false
  }
}

async function fetchCourses() {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch courses')
    courses.value = data
  } catch (err) {
    showNotification(err.message)
  }
}

function openAddModal() {
  showAddModal.value = true
}
function closeAddModal() {
  showAddModal.value = false
  newSection.value = { name: '', year_level: '', course_id: '', schedule_type: '', status: 'closed' }
}

// Fetch subjects for a course/year
async function fetchSubjectsForSection(courseId, yearLevel) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/subjects?course_id=${courseId}&year_level=${yearLevel}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch subjects')
    subjectOptions.value = data
  } catch (err) {
    showNotification(err.message)
  }
}

// Show subject assignment modal after section creation
async function showAssignSubjectsModal(sectionId, courseId, yearLevel) {
  subjectAssignSectionId.value = sectionId
  subjectAssignCourseId.value = courseId
  subjectAssignYearLevel.value = yearLevel
  selectedSubjectIds.value = []
  await fetchSubjectsForSection(courseId, yearLevel)
  showSubjectModal.value = true
}

// Helper to get current schedules for assigned subjects
async function getCurrentSchedulesForSection(sectionId, subjectIds) {
  const token = sessionStorage.getItem('admin_token');
  const schedules = [];
  for (const subjectId of subjectIds) {
    const res = await fetch(`http://localhost:5000/api/admin/sections/${sectionId}/subjects/${subjectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subject = await res.json();
    schedules.push({
      subject_id: subject.id,
      code: subject.code,
      name: subject.name,
      type: subject.type,
      day: subject.schedule?.day || '',
      start_time: subject.schedule?.start_time || '',
      end_time: subject.schedule?.end_time || '',
      room: subject.room || ''
    });
  }
  return schedules;
}

// assignSubjectsToSection: always prefill with all current schedules for all assigned subjects
async function assignSubjectsToSection() {
  try {
    await fetchRooms();
    showSubjectModal.value = false;
    const token = sessionStorage.getItem('admin_token');
    // Get all assigned subject IDs (not just new ones)
    const allAssignedIds = [...editSelectedSubjectIds.value];
    // Get current schedules for all assigned subjects
    const allSchedules = await getCurrentSchedulesForSection(editSection.value.id, allAssignedIds);
    pendingSchedules.value = allSchedules;
    showScheduleModal.value = true;
  } catch (err) {
    showNotification(err.message || 'Failed to prepare schedule assignment.');
  }
}

// Modified addSection to show subject modal after creation
async function addSection() {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newSection.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to add section')
    showAddModal.value = false
    showNotification('Section added successfully!')
    await fetchSections()
    // Find the new section (assume last added)
    const courseId = newSection.value.course_id
    const yearLevel = newSection.value.year_level
    let newSec = null
    if (data.id) {
      newSec = { id: data.id, course_id: courseId, year_level: yearLevel }
    } else {
      // fallback: find by name/year/course
      newSec = sections.value.find(s => s.name === newSection.value.name && s.course_id == courseId && s.year_level == yearLevel)
    }
    if (newSec && newSec.id) {
      await showAssignSubjectsModal(newSec.id, courseId, yearLevel)
    }
    newSection.value = { name: '', year_level: '', course_id: '', schedule_type: '', status: 'closed' }
  } catch (err) {
    showNotification(err.message)
  }
}

function openConfirmModal(message, action) {
  confirmMessage.value = message
  confirmAction.value = action
  showConfirmModal.value = true
}
function closeConfirmModal() {
  showConfirmModal.value = false
  confirmMessage.value = ''
  confirmAction.value = null
}
async function handleConfirm() {
  if (confirmAction.value) await confirmAction.value()
  closeConfirmModal()
}

async function toggleSectionStatus(section) {
  const newStatus = section.status === 'open' ? 'closed' : 'open'
  openConfirmModal(
    `Are you sure you want to ${newStatus === 'open' ? 'open' : 'close'} this section?`,
    async () => {
      try {
        const token = sessionStorage.getItem('admin_token')
        const res = await fetch(`http://localhost:5000/api/admin/sections/${section.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update section status')
        showNotification('Section status updated.')
        await fetchSections()
      } catch (err) {
        showNotification(err.message)
      }
    }
  )
}

// Add this method to the script section
async function fetchEnrollmentStatus(sectionId) {
  try {
    const token = sessionStorage.getItem('admin_token');
    const res = await fetch(`http://localhost:5000/api/admin/sections/${sectionId}/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.status === 'approved' || data.status === 'pending') {
      return data.status;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// Update openEditModal to use fetchEnrollmentStatus
async function openEditModal(section) {
  // Check if section is open - prevent editing if open
  if (section.status === 'open') {
    showNotification('Cannot edit section: section is currently open for enrollment.');
    return;
  }
  
  editSection.value = { ...section, schedule_type: section.schedule_type || '' }
  await fetchEditSubjects(section.course_id, section.year_level)
  await fetchAssignedSubjects(section.id)
  // Check if editing is blocked (students enrolled or pending for current term)
  subjectEditBlocked.value = await fetchEnrollmentStatus(section.id);
  
  // Additional check: if there are enrolled or pending students, prevent editing
  if (subjectEditBlocked.value === 'approved') {
    showNotification('Cannot edit section: students are already enrolled in this section for the current term.');
    return;
  }
  if (subjectEditBlocked.value === 'pending') {
    showNotification('Cannot edit section: there are pending enrollments for this section in the current term.');
    return;
  }
  
  // Store original state for change detection
  originalEditSection.value = { ...section, schedule_type: section.schedule_type || '' }
  originalEditSubjectIds.value = [...editSelectedSubjectIds.value]
  showEditModal.value = true
}

// Fetch subjects for edit modal
async function fetchEditSubjects(courseId, yearLevel) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/subjects?course_id=${courseId}&year_level=${yearLevel}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch subjects')
    editSubjectOptions.value = data
  } catch (err) {
    showNotification(err.message)
  }
}
// Fetch assigned subject IDs for section
async function fetchAssignedSubjects(sectionId) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/sections/${sectionId}/schedules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch assigned subjects')
    editSelectedSubjectIds.value = data.map(s => s.subject_id)
  } catch (err) {
    showNotification(err.message)
  }
}
// Refactor saveEditSection to ensure the schedule modal is always shown for new subjects and backend is only called after modal is completed
async function saveEditSection() {
  if (subjectEditBlocked.value === 'approved') {
    showNotification('Cannot edit section: students are already enrolled in this section for the current term.');
    return;
  }
  if (subjectEditBlocked.value === 'pending') {
    showNotification('Cannot edit section:  pending enrollment in this section for the current term.');
    return;
  }
  if (!hasEditChanges()) {
    showEditModal.value = false;
    showNotification('No changes to save.');
    return;
  }
  try {
    // Find newly assigned subjects
    const oldIds = [...originalEditSubjectIds.value].map(String);
    const newIds = [...editSelectedSubjectIds.value].map(String);
    const newSubjectIds = newIds.filter(id => !oldIds.includes(id));
    if (newSubjectIds.length > 0) {
      await fetchRooms();
      // Prepare pendingSchedules for the new subjects
      const token = sessionStorage.getItem('admin_token');
      const assignedSubjects = [];
      for (const subjectId of newSubjectIds) {
        const res = await fetch(`http://localhost:5000/api/admin/subjects/${subjectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subject = await res.json();
        assignedSubjects.push({
          subject_id: subject.id,
          code: subject.code,
          name: subject.name,
          type: subject.type,
          day: '',
          start_time: '',
          end_time: '',
          room: ''
        });
      }
      pendingSchedules.value = assignedSubjects;
      // Do NOT close the edit modal when opening the schedule modal
      // showEditModal.value = false;
      await nextTick(); // Wait for DOM update
      showScheduleModal.value = true;
      saveEditSectionAfterSchedules.value = true;
      // Do not proceed to backend call yet
      return;
    }
    // If no new subjects, proceed to backend call
    await saveSectionAndSubjects();
  } catch (err) {
    showNotification(err.message || 'Failed to update section or subjects.');
    return;
  }
}

// Helper to save section and subjects to backend
async function saveSectionAndSubjects() {
  const oldIds = [...originalEditSubjectIds.value].map(String);
  const newIds = [...editSelectedSubjectIds.value].map(String);
  const token = sessionStorage.getItem('admin_token');
  // Update section info
  const res = await fetch(`http://localhost:5000/api/admin/sections/${editSection.value.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(editSection.value)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update section');
  // Only update assigned subjects if changed
  if (oldIds.sort().join(',') !== newIds.sort().join(',')) {
    const res2 = await fetch(`http://localhost:5000/api/admin/sections/${editSection.value.id}/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ subjectIds: editSelectedSubjectIds.value })
    });
    const data2 = await res2.json();
    if (!res2.ok) throw new Error(data2.error || 'Failed to update subjects');
  }
  showEditModal.value = false;
  showNotification('Section updated successfully!');
  await fetchSections();
}

// Add a flag to indicate if saveEditSection should continue after schedule modal
const saveEditSectionAfterSchedules = ref(false)

// Close Edit Modal with unsaved changes check
function closeEditModal() {
  if (hasEditChanges()) {
    showUnsavedModal.value = true
  } else {
    showEditModal.value = false
  }
}
function discardEditChanges() {
  showEditModal.value = false
  showUnsavedModal.value = false
}
function saveFromUnsavedModal() {
  showUnsavedModal.value = false
  saveEditSection()
}
// Save confirmation
const showSaveSchedulesConfirm = ref(false)

function confirmSaveSchedules() {
  showSaveSchedulesConfirm.value = true
}

function handleSaveSchedulesConfirm() {
  showSaveSchedulesConfirm.value = false
  saveAssignedSchedules()
}

const showUnassignWarning = ref(false)
const unassignWarningMessage = ref('')
let pendingSaveEditSection = null

function saveEditSectionWithUnassignWarning() {
  // Find removed subjects
  const oldIds = [...originalEditSubjectIds.value].map(String)
  const newIds = [...editSelectedSubjectIds.value].map(String)
  const removedIds = oldIds.filter(id => !newIds.includes(id))
  if (removedIds.length > 0) {
    unassignWarningMessage.value = 'Removing a subject will also delete the schedule of that subject. Do you want to continue?'
    showUnassignWarning.value = true
    pendingSaveEditSection = saveEditSection
  } else {
    // Directly call saveEditSection, do not show save schedules confirmation here
    saveEditSection()
  }
}

function confirmSaveEditSection() {
  showSaveSchedulesConfirm.value = true
}

function handleUnassignWarningConfirm() {
  showUnassignWarning.value = false
  if (pendingSaveEditSection) {
    // Check if we're only removing subjects (no new subjects being added)
    const oldIds = [...originalEditSubjectIds.value].map(String)
    const newIds = [...editSelectedSubjectIds.value].map(String)
    const newSubjectIds = newIds.filter(id => !oldIds.includes(id))
    
    if (newSubjectIds.length === 0) {
      // Only unassigning subjects, no new subjects - call saveSectionAndSubjects directly
      saveSectionAndSubjects()
    } else {
      // Adding new subjects - go through schedule assignment flow
      confirmSaveEditSection()
    }
    pendingSaveEditSection = null
  }
}
function handleUnassignWarningCancel() {
  showUnassignWarning.value = false
  pendingSaveEditSection = null
}
// Delete section
function openDeleteSectionModal(section) {
  openConfirmModal('Are you sure you want to delete this section? This will remove all assigned subjects and schedules.', async () => {
    await deleteSection(section.id)
  })
}

async function deleteSection(sectionId) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/sections/${sectionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete section')
    showNotification('Section deleted.')
    await fetchSections()
  } catch (err) {
    showNotification(err.message)
  }
}

// Add the removeSubjectFromSection method
// async function removeSubjectFromSection(subjectId) {
//   if (!editSection.value.id) return;
//   try {
//     const token = sessionStorage.getItem('admin_token');
//     const res = await fetch(`http://localhost:5000/api/admin/sections/${editSection.value.id}/subjects/${subjectId}`, {
//       method: 'DELETE',
//       headers: { 'Authorization': `Bearer ${token}` }
//     });
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || 'Failed to remove subject');
//     showNotification('Subject removed from section!')
//     // Remove from UI
//     editSelectedSubjectIds.value = editSelectedSubjectIds.value.filter(id => id !== subjectId);
//     await fetchAssignedSubjects(editSection.value.id);
//   } catch (err) {
//     showNotification(err.message);
//   }
// }

const mobileDropdownOpen = ref(null)

// Utility: show notification and close all modals that could overlap
function showNotification(message) {
  notifMessage.value = message
  showNotifModal.value = true
  showEditModal.value = false
  showAddModal.value = false
  showSubjectModal.value = false
  showConfirmModal.value = false
  showUnsavedModal.value = false
}

// Add state for room schedules modal
const showRoomSchedulesModal = ref(false)
const roomSchedules = ref([])
const roomSchedulesTitle = ref('')

async function showRoomSchedules(room, day) {
  if (!room) return
  try {
    const token = sessionStorage.getItem('admin_token')
    let url = `http://localhost:5000/api/admin/rooms/${encodeURIComponent(room)}/schedules`
    if (day) url += `?day=${encodeURIComponent(day)}`
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    const data = await res.json()
    roomSchedules.value = data
    roomSchedulesTitle.value = `${room}${day ? ' - ' + day : ''}`
    showRoomSchedulesModal.value = true
  } catch (err) {
    notifMessage.value = 'Failed to fetch room schedules.'
    showNotifModal.value = true
  }
}

// Add frontend conflict checking before saving schedules
function timesOverlap(start1, end1, start2, end2) {
  // Convert to minutes since midnight
  const toMinutes = t => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1), e1 = toMinutes(end1);
  const s2 = toMinutes(start2), e2 = toMinutes(end2);
  // No overlap if one ends exactly when the other starts
  return s1 < e2 && s2 < e1;
}

async function saveAssignedSchedules() {
  try {
    const token = sessionStorage.getItem('admin_token')
    let hasError = false
    // Check for missing fields
    for (const sched of pendingSchedules.value) {
      sched._missing = []
      if (!sched.day) sched._missing.push('day')
      if (!sched.start_time) sched._missing.push('start_time')
      if (!sched.end_time) sched._missing.push('end_time')
      if (!sched.room) sched._missing.push('room')
      if (sched._missing.length > 0) hasError = true
    }
    if (hasError) {
      notifMessage.value = 'Please fill in all schedule fields for each subject.'
      showNotifModal.value = true
      return
    }
    // Debug log: what is being sent to the backend
    console.log('SENDING SCHEDULES:', JSON.stringify(pendingSchedules.value, null, 2));
    // Check for conflicts among pending schedules
    for (let i = 0; i < pendingSchedules.value.length; i++) {
      for (let j = i + 1; j < pendingSchedules.value.length; j++) {
        const a = pendingSchedules.value[i]
        const b = pendingSchedules.value[j]
        if (a.room === b.room && a.day === b.day && timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)) {
          notifMessage.value = `Schedule conflict: ${a.code} and ${b.code} in room ${a.room} on ${a.day}`
          showNotifModal.value = true
          return
        }
      }
    }
    // Check for conflicts with existing schedules in the database
    for (const sched of pendingSchedules.value) {
      const url = `http://localhost:5000/api/admin/rooms/${encodeURIComponent(sched.room)}/schedules?day=${encodeURIComponent(sched.day)}`
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      for (const existing of data) {
        if (timesOverlap(sched.start_time, sched.end_time, existing.start_time, existing.end_time)) {
          notifMessage.value = `Schedule conflict: ${sched.code} conflicts with ${existing.subject_code} (${existing.section_name || 'Unassigned'}) in room ${sched.room} on ${sched.day}`
          showNotifModal.value = true
          return
        }
      }
    }
    // Send both subjectIds and schedules to backend
    const sectionId = showEditModal.value ? editSection.value.id : subjectAssignSectionId.value
    if (!pendingSchedules.value.length) {
      notifMessage.value = 'No schedules to save.'
      showNotifModal.value = true
      return
    }
    const res = await fetch(`http://localhost:5000/api/admin/sections/${sectionId}/assign-with-schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        subjectIds: pendingSchedules.value.map(s => s.subject_id),
        schedules: pendingSchedules.value
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to assign subjects and schedules')
    showScheduleModal.value = false
    notifMessage.value = 'Subjects and schedules assigned successfully!'
    showNotifModal.value = true
    await fetchSections()
    if (saveEditSectionAfterSchedules.value) {
      saveEditSectionAfterSchedules.value = false
      // After schedules are saved, proceed to save section and subjects
      await saveSectionAndSubjects()
    }
  } catch (err) {
    notifMessage.value = err.message
    showNotifModal.value = true
  }
}

// Add state for the confirm unassign modal
const showUnassignConfirmModal = ref(false)
const subjectToUnassign = ref(null)

// Function to trigger the confirm modal
function confirmUnassignSubject(sectionId, subjectId) {
  subjectToUnassign.value = { sectionId, subjectId }
  showUnassignConfirmModal.value = true
}

// Function to actually unassign after confirmation
async function unassignSubjectAfterConfirm() {
  if (!subjectToUnassign.value) return
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/sections/${subjectToUnassign.value.sectionId}/subjects/${subjectToUnassign.value.subjectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to unassign subject')
    showUnassignConfirmModal.value = false
    subjectToUnassign.value = null
    notifMessage.value = 'Subject and its schedule have been deleted from this section.'
    showNotifModal.value = true
    await fetchSections()
  } catch (err) {
    notifMessage.value = err.message
    showNotifModal.value = true
  }
}

const rooms = ref([])

async function fetchRooms() {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/rooms', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    rooms.value = data
  } catch (err) {
    showNotification('Failed to fetch rooms.')
  }
}

function formatTime12h(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${m.padStart(2, '0')} ${ampm}`;
}

onMounted(() => {
  fetchSections()
  fetchCourses()
})

const showSaveConfirmModal = ref(false)

function trySaveEditSection() {
  if (!showEditModal.value) return;
  // Find newly assigned subjects
  const oldIds = [...originalEditSubjectIds.value].map(String);
  const newIds = [...editSelectedSubjectIds.value].map(String);
  const newSubjectIds = newIds.filter(id => !oldIds.includes(id));
  if (newSubjectIds.length > 0) {
    // There are new subjects, go directly to schedule assignment
    saveEditSectionWithUnassignWarning();
  } else {
    // No new subjects, show confirmation modal
    showSaveConfirmModal.value = true;
  }
}

function confirmSaveEditSectionModal() {
  showSaveConfirmModal.value = false
  saveEditSectionWithUnassignWarning()
}

function cancelSaveEditSectionModal() {
  showSaveConfirmModal.value = false
}

</script>

<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Section Management</h2>
    <div class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Section</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Year Level</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Course</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Status</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="section in sections.filter(s => s.id !== 0)" :key="section.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.year_level }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.course_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <span :class="section.status === 'open' ? 'text-green-600 font-bold' : 'text-yellow-700 font-bold'">
                {{ section.status.toUpperCase() }}
              </span>
            </td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words relative">
              <!-- Desktop: row of buttons -->
              <div class="hidden sm:flex flex-row gap-2 justify-center">
                <button class="bg-gray-200 text-gray-900 px-3 py-1 rounded hover:bg-gray-300 transition w-full sm:w-auto text-xs sm:text-sm" @click="() => toggleSectionStatus(section)">
                  {{ section.status === 'open' ? 'Close' : 'Open' }}
                </button>
                <button class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 font-semibold w-full sm:w-auto text-xs sm:text-sm" @click="() => openEditModal(section)">Edit</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold w-full sm:w-auto text-xs sm:text-sm" @click="() => openDeleteSectionModal(section)">Delete</button>
              </div>
              <!-- Mobile: dropdown -->
              <div class="sm:hidden flex justify-center">
                <button class="bg-gray-200 text-gray-900 px-3 py-1 rounded hover:bg-gray-300 transition w-full text-xs" @click="mobileDropdownOpen === section.id ? mobileDropdownOpen = null : mobileDropdownOpen = section.id">
                  Actions
                  <svg class="inline w-4 h-4 ml-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div v-if="mobileDropdownOpen === section.id" class="absolute z-20 mt-10 left-1/2 -translate-x-1/2 w-40 bg-white border border-gray-200 rounded shadow-lg flex flex-col text-left">
                  <button class="text-left px-4 py-2 hover:bg-gray-100 text-xs text-gray-900" @click="toggleSectionStatus(section); mobileDropdownOpen = null">
                    {{ section.status === 'open' ? 'Close' : 'Open' }}
                  </button>
                  <button class="text-left px-4 py-2 hover:bg-gray-100 text-xs text-blue-900" @click="openEditModal(section); mobileDropdownOpen = null">Edit</button>
                  <button class="text-left px-4 py-2 hover:bg-gray-100 text-xs text-red-700" @click="openDeleteSectionModal(section); mobileDropdownOpen = null">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex justify-end">
        <button class="bg-gray-900 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700 transition text-xs sm:text-sm" @click="openAddModal">Add Section</button>
      </div>
    </div>

    <!-- Add Section Modal -->
    <div v-if="showAddModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-8 rounded-lg shadow-2xl shadow-blue-900/20 border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Add Section</h3>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Section Name</label>
          <input v-model="newSection.name" placeholder="Section Name" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Year Level</label>
          <select v-model="newSection.year_level" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="" disabled>Select Year Level</option>
            <option v-for="level in yearLevels" :key="level.value" :value="level.value">{{ level.label }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Course</label>
          <select v-model="newSection.course_id" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="" disabled>Select Course</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.code }} - {{ course.name }}
            </option>
          </select>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 mb-1 font-semibold">Schedule Type</label>
          <select v-model="newSection.schedule_type" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="" disabled>Select Schedule Type</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="closeAddModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
          <button @click="addSection" :disabled="!newSection.name || !newSection.year_level || !newSection.course_id || !newSection.schedule_type" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold disabled:opacity-50">Add</button>
        </div>
        <button @click="closeAddModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-6 rounded shadow w-full max-w-sm text-center pointer-events-auto">
        <div class="mb-4">{{ confirmMessage }}</div>
        <div class="flex gap-2 justify-center">
          <button @click="closeConfirmModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button @click="handleConfirm" class="px-4 py-2 bg-blue-900 text-white rounded">Yes</button>
        </div>
      </div>
    </div>

    <!-- Assign Subjects Modal -->
    <div v-if="showSubjectModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-8 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Assign Subjects to Section</h3>
        <div v-if="subjectOptions.length === 0" class="text-gray-500 mb-4">No subjects found for this course and year level.</div>
        <div v-else class="mb-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          <label v-for="subject in subjectOptions" :key="subject.id" class="flex items-center gap-2">
            <input type="checkbox" v-model="selectedSubjectIds" :value="subject.id" />
            <span>{{ subject.code }} - {{ subject.name }} ({{ subject.units }} units)</span>
          </label>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="showSubjectModal = false" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
          <button @click="assignSubjectsToSection" :disabled="selectedSubjectIds.length === 0" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold disabled:opacity-50">Assign</button>
        </div>
        <button @click="showSubjectModal = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Edit Section Modal -->
    <div v-if="showEditModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-8 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Edit Section</h3>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Section Name</label>
          <input v-model="editSection.name" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Year Level</label>
          <select v-model="editSection.year_level" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="" disabled>Select Year Level</option>
            <option v-for="level in yearLevels" :key="level.value" :value="level.value">{{ level.label }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Course</label>
          <select v-model="editSection.course_id" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="" disabled>Select Course</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.code }} - {{ course.name }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Schedule Type</label>
          <select v-model="editSection.schedule_type" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option value="" disabled>Select Schedule Type</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 mb-1 font-semibold">  Subjects</label>
          <div v-if="editSubjectOptions.length === 0" class="text-gray-500 mb-2">No subjects found for this course and year level.</div>
          <div v-else class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            <div v-for="subject in editSubjectOptions" :key="subject.id" class="flex items-center gap-2">
              <input type="checkbox" v-model="editSelectedSubjectIds" :value="subject.id" />
              <span>{{ subject.code }} - {{ subject.name }} <span v-if="subject.type">({{ subject.type.toUpperCase() }})</span></span>
            </div>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="closeEditModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
          <button @click="trySaveEditSection"
            :disabled="!editSection.name || !editSection.year_level || !editSection.course_id || !editSection.schedule_type || !hasEditChanges()"
            class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold disabled:opacity-50">
            Save
          </button>
        </div>
        <button @click="closeEditModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Unsaved Changes Modal -->
    <div v-if="showUnsavedModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">You have unsaved changes. Are you sure you want to cancel?</div>
        <div class="flex gap-2">
          <button @click="discardEditChanges" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Yes, Cancel</button>
          <button @click="() => { showUnsavedModal = false }" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-800 transition">No, Stay</button>
        </div>
        <button @click="() => { showUnsavedModal = false }" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Edit Subject Schedule Modal -->
    <div v-if="showEditSubjectModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Edit Subject Schedule</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Day</label>
            <select v-model="editSubjectSchedule.day" class="w-full border rounded px-3 py-2">
              <option value="" disabled>Select Day</option>
              <option value="mon">Monday</option>
              <option value="tue">Tuesday</option>
              <option value="wed">Wednesday</option>
              <option value="thu">Thursday</option>
              <option value="fri">Friday</option>
              <option value="sat">Saturday</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Type</label>
            <select v-model="editSubjectSchedule.type" class="w-full border rounded px-3 py-2">
              <option value="" disabled>Select Type</option>
              <option value="Lec">Lecture</option>
              <option value="Lab">Laboratory</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Start Time</label>
            <input v-model="editSubjectSchedule.start_time" type="time" class="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">End Time</label>
            <input v-model="editSubjectSchedule.end_time" type="time" class="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Room</label>
            <input v-model="editSubjectSchedule.room_id" placeholder="Room ID" class="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="closeEditSubjectModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
          <button @click="saveEditSubjectSchedule" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold">Save</button>
        </div>
        <button @click="closeEditSubjectModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Schedule Assignment Modal -->
    <div v-if="showScheduleModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Assign Subject Schedules</h3>
        <div v-if="pendingSchedules.length === 0" class="text-gray-500 mb-4">No subjects to assign schedules for.</div>
        <div v-else class="mb-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div v-for="(subject, idx) in pendingSchedules" :key="subject.subject_id" class="border rounded p-3 flex flex-col gap-2">
            <div class="font-semibold text-blue-900">
              {{ subject.code }} - {{ subject.name }}
              <span v-if="subject.type">({{ subject.type.toUpperCase() }})</span>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600">Day</label>
              <select v-model="subject.day" :class="subject._missing && subject._missing.includes('day') ? 'border-red-500' : ''" class="border rounded px-2 py-1">
                <option value="" disabled>Select Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600">Start Time</label>
              <input v-model="subject.start_time" type="time" :class="subject._missing && subject._missing.includes('start_time') ? 'border-red-500' : ''" class="border rounded px-2 py-1" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600">End Time</label>
              <input v-model="subject.end_time" type="time" :class="subject._missing && subject._missing.includes('end_time') ? 'border-red-500' : ''" class="border rounded px-2 py-1" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-600">Room</label>
              <select v-model="subject.room" :class="subject._missing && subject._missing.includes('room') ? 'border-red-500' : ''" class="border rounded px-2 py-1">
                <option value="" disabled>Select Room</option>
                <option v-for="room in rooms" :key="room.id" :value="room.name">{{ room.name }}</option>
              </select>
              <button @click="() => { 
  if (!subject.room && !subject.day) { 
    showNotification('Please select a room and a day first.');
  } else if (!subject.room) { 
    showNotification('Please select a room first.');
  } else if (!subject.day) { 
    showNotification('Please select a day first.');
  } else { 
    showRoomSchedules(subject.room, subject.day); 
  } 
}" class="mt-1 text-xs text-blue-600 hover:underline">Show Room Schedules</button>
            </div>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="showScheduleModal = false" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
          <button @click="confirmSaveSchedules" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold">Save Schedules</button>
        </div>
        <button @click="showScheduleModal = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Confirm Unassign Modal -->
    <div v-if="showUnassignConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-red-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to unassign this subject? This will <span class='text-red-600 font-bold'>delete its schedule</span> from this section.</div>
        <div class="flex gap-2">
          <button @click="showUnassignConfirmModal = false" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="unassignSubjectAfterConfirm" class="px-4 py-2 bg-red-400 text-white rounded font-semibold shadow hover:bg-red-500 transition">Yes, Unassign</button>
        </div>
        <button @click="showUnassignConfirmModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Room Schedules Modal -->
    <div v-if="showRoomSchedulesModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">{{ roomSchedulesTitle }}</h3>
        <div v-if="roomSchedules.length === 0" class="text-gray-500 mb-4">No schedules found for this room and day.</div>
        <div v-else class="mb-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <div v-for="(sched, idx) in roomSchedules" :key="idx" class="border rounded p-3 flex flex-col gap-2">
            <div class="font-semibold text-blue-900">
              {{ sched.subject_code }} - {{ sched.subject_name }} ({{ sched.section_name }})
            </div>
            <div class="text-xs text-gray-600">
              Day: {{ sched.day }}, Start: {{ formatTime12h(sched.start_time) }}, End: {{ formatTime12h(sched.end_time) }}
            </div>
          </div>
        </div>
        <div class="flex justify-end">
          <button @click="showRoomSchedulesModal = false" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Close</button>
        </div>
        <button @click="showRoomSchedulesModal = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
  <!-- Notification Modal (moved outside main container for highest z-index) -->
  <div v-if="showNotifModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <div class="mb-4 text-gray-800 text-base font-semibold">{{ notifMessage }}</div>
      <button @click="showNotifModal = false" class="px-5 py-2 bg-yellow-400 text-blue-900 rounded font-bold shadow hover:bg-yellow-300 transition">OK</button>
      <button @click="showNotifModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
    </div>
  </div>

  <!-- Save Schedules Confirmation Modal -->
  <div v-if="showSaveSchedulesConfirm" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to save these schedules?</div>
      <div class="flex gap-2 justify-center">
        <button @click="() => { showSaveSchedulesConfirm.value = false }" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button @click="handleSaveSchedulesConfirm" class="px-4 py-2 bg-blue-900 text-white rounded">Yes, Save</button>
      </div>
    </div>
  </div>

  <!-- Unassign Warning Modal -->
  <div v-if="showUnassignWarning" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <div class="mb-4 text-gray-800 text-base font-semibold">{{ unassignWarningMessage }}</div>
      <div class="flex gap-2 justify-center">
        <button @click="handleUnassignWarningCancel" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button @click="handleUnassignWarningConfirm" class="px-4 py-2 bg-red-500 text-white rounded">Continue</button>
      </div>
    </div>
  </div>

  <!-- Save Edit Section Confirmation Modal -->
  <div v-if="showSaveConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <div class="mb-4 text-gray-800 text-base font-semibold">You have unsaved changes. Are you sure you want to save?</div>
      <div class="flex gap-2 justify-center">
        <button @click="cancelSaveEditSectionModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button @click="confirmSaveEditSectionModal" class="px-4 py-2 bg-blue-900 text-white rounded">Yes, Save</button>
      </div>
    </div>
  </div>
</template>
