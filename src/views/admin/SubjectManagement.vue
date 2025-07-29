<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const courses = ref([])
const yearLevels = [
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' }
]
const selectedCourse = ref('')
const selectedYear = ref('')
const subjects = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const showNotifModal = ref(false)
const showConfirmModal = ref(false)
const notifMessage = ref('')
const confirmMessage = ref('')
const confirmCallback = ref(null)
// Add course and year level to newSubject
const newSubject = ref({ code: '', name: '', instructor_name: '', units: '', type: '', course_id: '', year_level: '' })
const isEditMode = ref(false)
const editingSubjectId = ref(null)
const validationError = ref('')
const originalSubjectData = ref(null)
const showConfirmDeleteModal = ref(false)
const subjectToDelete = ref(null)

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
    validationError.value = err.message
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  isEditMode.value = false
  editingSubjectId.value = null
  validationError.value = ''
  newSubject.value = { code: '', name: '', instructor_name: '', units: '', type: '', course_id: selectedCourse.value, year_level: selectedYear.value }
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
      instructor_name: subjectData.instructor || '',
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
      instructor_name: subjectData.instructor || '',
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

  // Instructor Name validation (required)
  if (!newSubject.value.instructor_name || !newSubject.value.instructor_name.toString().trim()) {
    validationError.value = 'Instructor name is required.';
    return;
  }
  
  try {
    const token = sessionStorage.getItem('admin_token')
    
    if (isEditMode.value) {
      
      const subjectData = {
        code: newSubject.value.code,
        name: newSubject.value.name,
        units: newSubject.value.units,
        instructor: newSubject.value.instructor_name
      };
      
      // Update existing subject
      const subjectRes = await fetch(`http://localhost:5000/api/admin/subjects/${editingSubjectId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subjectData)
      })
      
      const subjectResponseData = await subjectRes.json()
      
      if (!subjectRes.ok) throw new Error(subjectResponseData.error || 'Failed to update subject')
      
      // Update schedule data
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
      
      console.log('=== END FRONTEND EDIT DEBUG ===');
      notifMessage.value = 'Subject updated successfully!'
      showNotifModal.value = true;
    } else {
      // Add new subject
      // Map instructor_name to instructor for backend
      const subjectPayload = { ...newSubject.value, instructor: newSubject.value.instructor_name };
      delete subjectPayload.instructor_name;
      const res = await fetch('http://localhost:5000/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subjectPayload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add subject')
      notifMessage.value = 'Subject added successfully!'
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

async function deleteSubject(id) {
  subjectToDelete.value = id;
  showConfirmDeleteModal.value = true;
}

async function confirmDeleteSubject() {
  if (!subjectToDelete.value) return;
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/subjects/${subjectToDelete.value}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete subject')
    notifMessage.value = 'Subject deleted successfully!'
    showNotifModal.value = true
    await fetchSubjects()
  } catch (err) {
    validationError.value = err.message
  } finally {
    showConfirmDeleteModal.value = false;
    subjectToDelete.value = null;
  }
}

function cancelDeleteSubject() {
  showConfirmDeleteModal.value = false;
  subjectToDelete.value = null;
}

function isModalOpen() {
  return showAddModal.value || showNotifModal.value || showConfirmModal.value;
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
    current.instructor_name !== original.instructor_name ||
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

onMounted(fetchCourses)

watch([selectedCourse, selectedYear], fetchSubjects)
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
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading subjects...</div>
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Code</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Units</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in subjects" :key="subject.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ subject.code }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ subject.name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ subject.units }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <button class="bg-yellow-400 text-blue-900 px-3 py-1 rounded hover:bg-yellow-300 font-semibold text-xs sm:text-sm" @click="openEditModal(subject)" :disabled="isModalOpen()">Edit</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold text-xs sm:text-sm" @click="deleteSubject(subject.id)" :disabled="isModalOpen()">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="subjects.length === 0">
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
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div>
              <label class="block text-gray-700 mb-1 font-semibold">Subject Code</label>
              <input v-model="newSubject.code" placeholder="e.g. IT101" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label class="block text-gray-700 mb-1 font-semibold">Subject Name</label>
              <input v-model="newSubject.name" placeholder="Subject Name" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label class="block text-gray-700 mb-1 font-semibold">Units</label>
              <input v-model="newSubject.units" type="number" min="1" max="10" placeholder="Units" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div>
              <label class="block text-gray-700 mb-1 font-semibold">Type</label>
              <select v-model="newSubject.type" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="" disabled>Select Type</option>
                <option value="Lec">Lecture</option>
                <option value="Lab">Laboratory</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-gray-700 mb-1 font-semibold">Instructor Name</label>
              <input v-model="newSubject.instructor_name" placeholder="Instructor Name" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>
          <div class="flex gap-2 justify-end mt-4">
            <button @click="closeAddModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Cancel</button>
            <button @click="saveSubject" :disabled="isEditMode && !hasChanges()" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{{ isEditMode ? 'Update' : 'Add' }}</button>
          </div>
          <button @click="closeAddModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
      </div>
    </div>


    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-none">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-orange-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-orange-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ confirmMessage }}</div>
        <div class="flex gap-2">
          <button @click="cancelConfirm" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="confirmAction" class="px-4 py-2 bg-orange-400 text-white rounded font-semibold shadow hover:bg-orange-500 transition">Yes, Discard</button>
        </div>
        <button @click="cancelConfirm" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
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