<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Student Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <button @click="openAddModal" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Student</button>
    </div>
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading students...</div>
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Student ID</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Course</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Year Level</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.student_id }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.last_name }}, {{ student.first_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.course_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.year_level }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">
              <button @click="openEditModal(student)" class="bg-yellow-400 text-blue-900 px-3 py-1 rounded font-semibold hover:bg-yellow-300 transition mr-1">Edit</button>
              <button @click="confirmDeleteStudent(student)" class="bg-red-400 text-white px-3 py-1 rounded font-semibold hover:bg-red-500 transition">Delete</button>
            </td>
          </tr>
          <tr v-if="students.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-6">No students found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Student Modal -->
    <div v-if="showAddModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">{{ isEditMode ? 'Edit Student' : 'Add Student' }}</h3>
        <div v-if="validationError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ validationError }}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Student ID</label>
            <input v-model="studentForm.student_id" type="text" class="w-full border rounded px-2 py-1 bg-gray-100 font-mono font-semibold" :disabled="true" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">First Name</label>
            <input v-model="studentForm.first_name" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Middle Name</label>
            <input v-model="studentForm.middle_name" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Last Name</label>
            <input v-model="studentForm.last_name" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Suffix <span class="text-xs text-gray-400">(optional)</span></label>
            <input v-model="studentForm.suffix" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Gender</label>
            <select v-model="studentForm.gender" class="w-full border rounded px-2 py-1" @change="clearValidationError">
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Address</label>
            <input v-model="studentForm.address" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Contact Number</label>
            <input v-model="studentForm.contact_number" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Email</label>
            <input v-model="studentForm.email" type="email" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Year Level</label>
            <select v-model="studentForm.year_level" class="w-full border rounded px-2 py-1" @change="clearValidationError">
              <option value="" disabled>Select Year Level</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
              <option value="summer">Summer</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-gray-700 mb-1 font-semibold">Course</label>
            <select v-model="studentForm.course_id" class="w-full border rounded px-2 py-1" @change="clearValidationError">
              <option value="" disabled>Select Course</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.name }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="closeAddModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button @click="saveStudent" class="px-4 py-2 bg-blue-900 text-white rounded">{{ isEditMode ? 'Save Changes' : 'Add Student' }}</button>
        </div>
        <button @click="closeAddModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Notification Modal -->
    <div v-if="showNotifModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ notifMessage }}</div>
        <button @click="showNotifModal = false" class="px-5 py-2 bg-yellow-400 text-blue-900 rounded font-bold shadow hover:bg-yellow-300 transition">OK</button>
        <button @click="showNotifModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showConfirmDeleteModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-red-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to delete this student?</div>
        <div class="flex gap-2">
          <button @click="cancelDeleteStudent" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="confirmDeleteStudentAction" class="px-4 py-2 bg-red-400 text-white rounded font-semibold shadow hover:bg-red-500 transition">Yes, Delete</button>
        </div>
        <button @click="cancelDeleteStudent" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const students = ref([])
const courses = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const isEditMode = ref(false)
const showNotifModal = ref(false)
const notifMessage = ref('')
const showConfirmDeleteModal = ref(false)
const validationError = ref('')
const studentForm = ref({ student_id: '', first_name: '', last_name: '', middle_name: '', suffix: '', gender: '', address: '', contact_number: '', email: '', course_id: '', year_level: '' })

function clearValidationError() {
  validationError.value = ''
}
const studentToEdit = ref(null)
const studentToDelete = ref(null)

function fetchStudents() {
  loading.value = true
  fetch('http://localhost:5000/api/admin/students', {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      students.value = data
      loading.value = false
    })
    .catch(() => {
      notifMessage.value = 'Failed to fetch students.'
      showNotifModal.value = true
      loading.value = false
    })
}

function fetchCourses() {
  fetch('http://localhost:5000/api/admin/courses', {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      courses.value = data
    })
    .catch(() => {
      notifMessage.value = 'Failed to fetch courses.'
      showNotifModal.value = true
    })
}

async function openAddModal() {
  isEditMode.value = false
  validationError.value = ''
  studentForm.value = { student_id: '', first_name: '', last_name: '', course_id: '', year_level: '' }
  // Fetch next student ID from backend
  try {
    const res = await fetch('http://localhost:5000/api/admin/students/next-id', {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    });
    const data = await res.json();
    studentForm.value.student_id = data.nextId;
  } catch (e) {
    studentForm.value.student_id = '';
  }
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false
  validationError.value = ''
}

function saveStudent() {
  // Only check for required fields except student_id (which is auto-filled and disabled)

  // If student_id is still empty, show error
  if (!studentForm.value.student_id) {
    validationError.value = 'Student ID could not be generated.';
    return;
  }
  const method = isEditMode.value ? 'PUT' : 'POST'
  const url = isEditMode.value
    ? `http://localhost:5000/api/admin/students/${studentForm.value.student_id}`
    : 'http://localhost:5000/api/admin/students'
  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
    },
    body: JSON.stringify(studentForm.value)
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        validationError.value = data.error
        return
      }
      showAddModal.value = false
      fetchStudents()
      notifMessage.value = isEditMode.value ? 'Student updated!' : 'Student added!'
      showNotifModal.value = true
    })
    .catch(() => {
      validationError.value = 'Failed to save student.'
    })
}

function openEditModal(student) {
  isEditMode.value = true
  validationError.value = ''
  studentForm.value = { ...student }
  showAddModal.value = true
}

function confirmDeleteStudent(student) {
  studentToDelete.value = student
  showConfirmDeleteModal.value = true
}

function cancelDeleteStudent() {
  studentToDelete.value = null
  showConfirmDeleteModal.value = false
}

function confirmDeleteStudentAction() {
  if (!studentToDelete.value) return
  fetch(`http://localhost:5000/api/admin/students/${studentToDelete.value.student_id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      showConfirmDeleteModal.value = false
      if (data.error) {
        notifMessage.value = data.error
        showNotifModal.value = true
        return
      }
      fetchStudents()
      notifMessage.value = 'Student deleted!'
      showNotifModal.value = true
    })
    .catch(() => {
      notifMessage.value = 'Failed to delete student.'
      showNotifModal.value = true
    })
}

onMounted(() => {
  fetchStudents()
  fetchCourses()
})
</script>
