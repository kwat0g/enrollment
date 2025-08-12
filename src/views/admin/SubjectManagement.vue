<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const courses = ref([])
const yearLevels = [
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' }
]
const selectedCourse = ref('')
const selectedYear = ref('')
const subjects = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const addCategory = ref('') // 'major' | 'minor'
const showNotifModal = ref(false)
const showWarnModal = ref(false)
const warnMessage = ref('')
const showConfirmModal = ref(false)
const notifMessage = ref('')
const confirmMessage = ref('')
const confirmCallback = ref(null)
// Add course and year level to newSubject
const newSubject = ref({ code: '', name: '', units: '', type: '', course_id: '', year_level: '' })
const isEditMode = ref(false)
const editingSubjectId = ref(null)
const validationError = ref('')
const originalSubjectData = ref(null)
const showConfirmDeleteModal = ref(false)
const subjectToDelete = ref(null)
const showSaveConfirmModal = ref(false)

async function fetchCourses() {``
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch courses')
    courses.value = data
  } catch (err) {
    validationError.value = err.message
  }
}

async function fetchSubjects() {
  if (!selectedCourse.value || !selectedYear.value) return
  loading.value = true
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/subjects?course_id=${selectedCourse.value}&year_level=${selectedYear.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch subjects')
    subjects.value = data
  } catch (err) {
    // Close any confirm modal first to avoid layering issues
    showConfirmDeleteModal.value = false
    warnMessage.value = err.message || 'Failed to fetch subjects.'
    console.warn('[Subjects] Warning:', warnMessage.value)
    showWarnModal.value = true
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  isEditMode.value = false
  editingSubjectId.value = null
  validationError.value = ''
  addCategory.value = ''
  newSubject.value = { code: '', name: '', units: '', type: '', course_id: selectedCourse.value, year_level: selectedYear.value }
  showAddModal.value = true
}

function closeAddModal() {
  // Check if there are unsaved changes in edit mode
  if (isEditMode.value && hasChanges()) {
    confirmMessage.value = 'You have unsaved changes. Are you sure you want to cancel? Your changes will be lost.';
    confirmCallback.value = () => {
      showAddModal.value = false;
      isEditMode.value = false;
      editingSubjectId.value = null;
      validationError.value = '';
      originalSubjectData.value = null;
    };
    showConfirmModal.value = true;
    return; // Don't close if user cancels the confirmation
  }
  
  showAddModal.value = false
  isEditMode.value = false
  editingSubjectId.value = null
  validationError.value = ''
  originalSubjectData.value = null
  addCategory.value = ''
}

async function openEditModal(subject) {
  if (!subject || !subject.id) {
    notifMessage.value = 'Invalid subject selected.';
    showNotifModal.value = true;
    return;
  }
  try {
    const token = sessionStorage.getItem('admin_token');
    
    console.log('=== OPEN EDIT MODAL DEBUG ===');
    console.log('Subject to edit:', subject);
    
    // Fetch subject data
    const subjectRes = await fetch(`http://localhost:5000/api/admin/subjects/${subject.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subjectData = await subjectRes.json();
    console.log('Subject data from API:', subjectData);
    
    if (!subjectRes.ok) {
      if (subjectRes.status === 404) {
        await fetchSubjects();
        notifMessage.value = 'Subject not found. The list has been refreshed.';
        showNotifModal.value = true;
        return;
      }
      throw new Error(subjectData.error || 'Failed to fetch subject details');
    }
    
    // Fetch schedule data for this subject
    const scheduleRes = await fetch(`http://localhost:5000/api/admin/subjects/${subject.id}/schedule`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const scheduleData = await scheduleRes.json();
    console.log('Schedule data from API:', scheduleData);
    
    // Populate the form with subject data and schedule data
    newSubject.value = {
      code: subjectData.code,
      name: subjectData.name,
      units: subjectData.units,
      course_id: subjectData.course_id,
      year_level: subjectData.year_level,
      day: scheduleData ? scheduleData.day : '',
      start_time: scheduleData ? scheduleData.start_time : '',
      end_time: scheduleData ? scheduleData.end_time : '',
      type: subjectData.type || '',
      room: scheduleData ? scheduleData.room : ''
    };

    
    // Store original data for comparison
    originalSubjectData.value = {
      code: subjectData.code,
      name: subjectData.name,
      units: subjectData.units,
      course_id: subjectData.course_id,
      year_level: subjectData.year_level,
      day: scheduleData ? scheduleData.day : '',
      start_time: scheduleData ? scheduleData.start_time : '',
      end_time: scheduleData ? scheduleData.end_time : '',
      type: subjectData.type || '',
      room: scheduleData ? scheduleData.room : ''
    };  
    
    isEditMode.value = true
    editingSubjectId.value = subjectData.id
    validationError.value = ''
    showAddModal.value = true
  } catch (err) {
    console.error('Error in openEditModal:', err);
    notifMessage.value = err.message;
    showNotifModal.value = true;
  }
}

async function saveSubject() {
  // Clear previous validation error
  validationError.value = ''
  
  // Check if any changes have been made in edit mode
  if (isEditMode.value && !hasChanges()) {
    validationError.value = 'No changes have been made. Please modify at least one field before updating.'
    return;
  }


  
  try {
    const token = sessionStorage.getItem('admin_token')
    
    if (isEditMode.value) {
      // Group-aware update
      if (editIsMajor.value) {
        const items = editGroupItems.value
        if (!items.length) throw new Error('Unable to resolve subject entries for this major code.')
        // Update name for both Lec and Lab; code is locked for Major
        const updates = items.map(it => fetch(`http://localhost:5000/api/admin/subjects/${it.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: newSubject.value.name })
        }).then(r => r.json().then(d => ({ ok: r.ok, d }))))
        const results = await Promise.all(updates)
        const failed = results.find(r => !r.ok)
        if (failed) throw new Error(failed.d?.error || 'Failed to update one of the major subject entries')
      } else {
        // Minor: allow code and name updates
        if (!newSubject.value.code) {
          validationError.value = 'Subject code is required for minor.'
          return;
        }
        const subjectRes = await fetch(`http://localhost:5000/api/admin/subjects/${editingSubjectId.value}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ code: newSubject.value.code, name: newSubject.value.name })
        })
        const subjectResponseData = await subjectRes.json()
        if (!subjectRes.ok) throw new Error(subjectResponseData.error || 'Failed to update subject')
      }

      // Optional: schedule update remains tied to the representative id
      const scheduleData = {
        type: newSubject.value.type,
        day: newSubject.value.day,
        start_time: newSubject.value.start_time,
        end_time: newSubject.value.end_time,
        room: newSubject.value.room
      };
      const scheduleRes = await fetch(`http://localhost:5000/api/admin/subjects/${editingSubjectId.value}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(scheduleData)
      })
      const scheduleResponseData = await scheduleRes.json()
      console.log('Schedule update response:', scheduleResponseData);
      if (!scheduleRes.ok) throw new Error(scheduleResponseData.error || 'Failed to update subject schedule')

      notifMessage.value = 'Subject updated successfully!'
      showNotifModal.value = true;
    } else {
      // Add new subject with category flow
      if (!addCategory.value) {
        validationError.value = 'Please select Major or Minor.'
        return;
      }
      if (!newSubject.value.name) {
        validationError.value = 'Subject name is required.'
        return;
      }
      const payload = {
        category: addCategory.value,
        name: newSubject.value.name,
        course_id: newSubject.value.course_id,
        year_level: newSubject.value.year_level
      };
      if (addCategory.value === 'minor') {
        if (!newSubject.value.code) {
          validationError.value = 'Subject code is required for minor.'
          return;
        }
        payload.code = String(newSubject.value.code).trim()
      }
      const res = await fetch('http://localhost:5000/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add subject')
      // Show generated code and what was created
      if (data && data.code) {
        const created = Array.isArray(data.created) ? data.created.map(c => `${c.type}(${c.units})`).join(' + ') : ''
        notifMessage.value = `Subject added successfully! Code: ${data.code}${created ? ` — Created: ${created}` : ''}`
      } else {
        notifMessage.value = 'Subject added successfully!'
      }
    }
    
    showAddModal.value = false
    showNotifModal.value = true
    await fetchSubjects()
  } catch (err) {
    console.error('Error in saveSubject:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack
    });
    validationError.value = err.message
  }
}

async function deleteSubject(row) {
  // Determine if this is a major group (both Lec and Lab exist) and collect ids to delete
  const code = String(row?.code || '').toUpperCase()
  const items = (subjects.value || []).filter(s => String(s.code || '').toUpperCase() === code)
  const ids = items.map(i => i.id).filter(Boolean)
  subjectToDelete.value = ids.length ? ids : (row?.id ? [row.id] : [])
  showConfirmDeleteModal.value = true;
}

async function confirmDeleteSubject() {
  if (!subjectToDelete.value || subjectToDelete.value.length === 0) return;
  try {
    const token = sessionStorage.getItem('admin_token')
    // Delete all collected ids (handles Major Lec+Lab)
    // Be robust: backend may return empty body or text on error. Parse safely.
    const deletes = subjectToDelete.value.map(id => fetch(`http://localhost:5000/api/admin/subjects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(async (r) => {
      let bodyText = ''
      let data
      try {
        bodyText = await r.text()
        data = bodyText ? JSON.parse(bodyText) : null
      } catch (_) {
        data = bodyText || null
      }
      return { ok: r.ok, status: r.status, d: data }
    }))
    const results = await Promise.all(deletes)
    const failed = results.find(r => !r.ok)
    if (failed) {
      const raw = (failed.d && (failed.d.error || failed.d.message)) || (typeof failed.d === 'string' ? failed.d : '') || 'Failed to delete one or more subject entries'
      console.warn('[Subjects] Delete failed details:', { failed, results })
      const friendly = /assign|section|schedule|foreign key|in use/i.test(raw)
        ? 'Cannot delete this subject because it is assigned to a section or schedule.'
        : raw
      // Close confirm, then show warning modal next tick to avoid overlay conflicts
      showConfirmDeleteModal.value = false
      warnMessage.value = friendly
      // ensure any notif modal is closed
      showNotifModal.value = false
      setTimeout(() => { showWarnModal.value = true }, 0)
      return
    }
    notifMessage.value = subjectToDelete.value.length > 1 ? 'Major subject (Lec+Lab) deleted successfully!' : 'Subject deleted successfully!'
    showNotifModal.value = true
    await fetchSubjects()
  } catch (err) {
    validationError.value = err.message
  } finally {
    showConfirmDeleteModal.value = false;
    subjectToDelete.value = [];
  }
}

function cancelDeleteSubject() {
  showConfirmDeleteModal.value = false;
  subjectToDelete.value = [];
}

function isModalOpen() {
  return showAddModal.value || showNotifModal.value || showConfirmModal.value || showWarnModal.value || showConfirmDeleteModal.value;
}

function confirmAction() {
  if (confirmCallback.value) {
    confirmCallback.value();
  }
  showConfirmModal.value = false;
  confirmMessage.value = '';
  confirmCallback.value = null;
}

function cancelConfirm() {
  showConfirmModal.value = false;
  confirmMessage.value = '';
  confirmCallback.value = null;
}

function hasChanges() {
  if (!isEditMode.value || !originalSubjectData.value) return true;
  
  const current = newSubject.value;
  const original = originalSubjectData.value;
  
  return (
    current.code !== original.code ||
    current.name !== original.name ||
    current.units !== original.units ||
    current.course_id !== original.course_id ||
    current.year_level !== original.year_level ||
    current.type !== original.type ||
    current.day !== original.day ||
    current.start_time !== original.start_time ||
    current.end_time !== original.end_time ||
    current.room !== original.room
  );
}

function trySaveSubject() {
  if (isEditMode.value) {
    showSaveConfirmModal.value = true
  } else {
    saveSubject()
  }
}

function confirmSaveSubject() {
  showSaveConfirmModal.value = false
  saveSubject()
}

function cancelSaveSubject() {
  showSaveConfirmModal.value = false
}

onMounted(fetchCourses)

watch([selectedCourse, selectedYear], fetchSubjects)

// Merge Lec/Lab pairs into a single display row (Major) and mark single Lec as Minor
const groupedSubjects = computed(() => {
  const byCode = new Map()
  for (const s of subjects.value || []) {
    const code = String(s.code || '').toUpperCase()
    if (!byCode.has(code)) {
      byCode.set(code, { items: [], name: s.name, course_id: s.course_id, year_level: s.year_level })
    }
    byCode.get(code).items.push(s)
  }
  const rows = []
  for (const [code, grp] of byCode.entries()) {
    const types = new Set((grp.items || []).map(i => String(i.type || '').toLowerCase()))
    const isMajor = types.has('lec') && types.has('lab') || grp.items.length > 1
    // prefer Lec id if available for edit/delete actions
    let chosen = grp.items.find(i => String(i.type || '').toLowerCase() === 'lec') || grp.items[0]
    rows.push({
      id: chosen?.id,
      code,
      name: grp.name,
      subjectTypeLabel: isMajor ? 'Major' : 'Minor'
    })
  }
  // Optional: sort by code
  rows.sort((a, b) => a.code.localeCompare(b.code))
  return rows
})

// Helpers for edit modal behavior
const editGroupItems = computed(() => {
  if (!isEditMode.value || !newSubject.value?.code) return []
  const code = String(newSubject.value.code || '').toUpperCase()
  return (subjects.value || []).filter(s => String(s.code || '').toUpperCase() === code)
})

const editIsMajor = computed(() => {
  const items = editGroupItems.value
  if (!items.length) return false
  const types = new Set(items.map(i => String(i.type || '').toLowerCase()))
  return (types.has('lec') && types.has('lab')) || items.length > 1
})
</script>

<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Subject Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <select v-model="selectedCourse" class="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-auto">
        <option value="" disabled>Select Course</option>
        <option v-for="course in courses" :key="course.id" :value="course.id">
          {{ course.name }} - {{ course.code }}
        </option>
      </select>
      <select v-model="selectedYear" class="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-auto">
        <option value="" disabled>Select Year Level</option>
        <option v-for="level in yearLevels" :key="level.value" :value="level.value">{{ level.label }}</option>
      </select>
      <button @click="openAddModal" :disabled="isModalOpen() || !selectedCourse || !selectedYear" class="bg-blue-900 text-white px-5 py-2 rounded font-semibold hover:bg-blue-800 transition disabled:opacity-50 w-full sm:w-auto">Add Subject</button>
    </div>

    <!-- Warning Modal (match existing modal design) -->
    <div v-if="showWarnModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto" aria-live="assertive">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative" role="alertdialog" aria-modal="true" aria-label="Warning">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ warnMessage }}</div>
        <button @click="showWarnModal = false" class="px-5 py-2 bg-yellow-400 text-blue-900 rounded font-bold shadow hover:bg-yellow-300 transition">OK</button>
        <button @click="showWarnModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading subjects...</div>
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Code</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Subject Type</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in groupedSubjects" :key="subject.id || subject.code" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ subject.code }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ subject.name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ subject.subjectTypeLabel }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <button class="bg-yellow-400 text-blue-900 px-3 py-1 rounded hover:bg-yellow-300 font-semibold text-xs sm:text-sm" @click="openEditModal(subject)" :disabled="isModalOpen()">Edit</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold text-xs sm:text-sm" @click="deleteSubject(subject)" :disabled="isModalOpen()">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="groupedSubjects.length === 0">
            <td colspan="4" class="text-center text-gray-400 py-6">No subjects found for this course and year level.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Subject Modal -->
    <div v-if="showAddModal">
      <div class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-40"></div>
      <div class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
        <div class="bg-white p-4 sm:p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
          <h3 class="text-xl font-bold mb-6 text-blue-900">{{ isEditMode ? 'Edit Subject' : 'Add Subject' }}</h3>
          
          <!-- Validation Error Display -->
          <div v-if="validationError" class="mt-2 mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {{ validationError }}
          </div>
          
          <!-- Add/Edit Form Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <!-- Edit Mode: grouped behavior -->
            <template v-if="isEditMode">
              <div>
                <label class="block text-gray-700 mb-1 font-semibold">
                  Subject Code
                </label>
                <input
                  v-model="newSubject.code"
                  :readonly="editIsMajor"
                  :aria-readonly="editIsMajor ? 'true' : 'false'"
                  placeholder="e.g. IT101"
                  :title="editIsMajor ? 'Locked for Major (auto-managed). Edit subject name instead.' : ''"
                  class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  :class="{ 'bg-gray-100 text-gray-700 cursor-not-allowed border-dashed': editIsMajor }"
                />
              </div>
              <div>
                <label class="block text-gray-700 mb-1 font-semibold">Subject Name</label>
                <input v-model="newSubject.name" placeholder="Subject Name" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-gray-700 mb-1 font-semibold">
                  Subject Type
                </label>
                <div
                  class="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700 border-dashed cursor-not-allowed"
                  title="Read-only"
                  aria-readonly="true"
                  role="textbox"
                >
                  {{ editIsMajor ? 'Major' : 'Minor' }}
                </div>
              </div>
            </template>

            <!-- Add Mode: choose Major/Minor then only name input -->
            <template v-else>
              <div class="sm:col-span-2">
                <label class="block text-gray-700 mb-1 font-semibold">Subject Category</label>
                <div class="flex gap-4 items-center">
                  <label class="inline-flex items-center gap-2">
                    <input type="radio" value="major" v-model="addCategory" />
                    <span>Major</span>
                  </label>
                  <label class="inline-flex items-center gap-2">
                    <input type="radio" value="minor" v-model="addCategory" />
                    <span>Minor</span>
                  </label>
                </div>
              </div>
              <div v-if="addCategory === 'minor'">
                <label class="block text-gray-700 mb-1 font-semibold">Subject Code</label>
                <input v-model="newSubject.code" placeholder="Enter code (not like IT3NN)" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <div class="text-xs text-gray-600 mt-1">Do not use codes that look like major auto-generated format (e.g., IT301).</div>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-gray-700 mb-1 font-semibold">Subject Name</label>
                <input v-model="newSubject.name" placeholder="Subject Name" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div class="sm:col-span-2 text-xs text-gray-600" v-if="addCategory === 'major'">
                Code, units, and types are auto-generated. System will create Lec(1 unit) and Lab(2 units).
              </div>
              <div class="sm:col-span-2 text-xs text-gray-600" v-else-if="addCategory === 'minor'">
                Code is manual entry; system will create Lec (3 units).
              </div>
            </template>
          </div>
          <div class="flex gap-2 justify-end mt-4">
            <button @click="closeAddModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
            <button @click="trySaveSubject" :disabled="isEditMode && !hasChanges()" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{{ isEditMode ? 'Update' : 'Add' }}</button>
          </div>
          <button @click="closeAddModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
      </div>
    </div>


    <!-- Confirmation Modal for Unsaved Changes -->
    <div v-if="showConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ confirmMessage }}</div>
        <div class="flex gap-2">
          <button @click="cancelConfirm" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="confirmAction" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-800 transition">Yes, Discard</button>
        </div>
        <button @click="cancelConfirm" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Confirmation Modal for Saving Changes -->
    <div v-if="showSaveConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-blue-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-blue-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to save these changes?</div>
        <div class="flex gap-2">
          <button @click="cancelSaveSubject" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="confirmSaveSubject" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-800 transition">Yes, Save</button>
        </div>
        <button @click="cancelSaveSubject" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showConfirmDeleteModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-none">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-red-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to delete this subject?</div>
        <div class="flex gap-2">
          <button @click="cancelDeleteSubject" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="confirmDeleteSubject" class="px-4 py-2 bg-red-400 text-white rounded font-semibold shadow hover:bg-red-500 transition">Yes, Delete</button>
        </div>
        <button @click="cancelDeleteSubject" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
    <!-- Notification Modal -->
    <div v-if="showNotifModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ notifMessage }}</div>
        <button @click="showNotifModal = false" class="px-5 py-2 bg-yellow-400 text-blue-900 rounded font-bold shadow hover:bg-yellow-300 transition">OK</button>
        <button @click="showNotifModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

</template> 