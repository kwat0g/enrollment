<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
  <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Course Management</h2>
  <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
    <button @click="showAddModal = true" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Course</button>
  </div>
  <div v-if="loading" class="text-center py-8 text-gray-500">Loading courses...</div>
  <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
    <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
      <thead class="bg-gray-100 text-gray-900">
        <tr>
          <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Code</th>
          <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
          <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="course in courses" :key="course.id" class="text-gray-900">
          <td class="py-2 px-2 sm:px-4 text-center">{{ course.code }}</td>
          <td class="py-2 px-2 sm:px-4 text-center">{{ course.name }}</td>
          <td class="py-2 px-2 sm:px-4 text-center">
            <button @click="editCourse(course)" class="bg-yellow-400 text-blue-900 px-3 py-1 rounded font-semibold hover:bg-yellow-300 transition mr-1">Edit</button>
            <button @click="confirmDelete(course)" class="bg-red-400 text-white px-3 py-1 rounded font-semibold hover:bg-red-500 transition">Delete</button>
          </td>
        </tr>
        <tr v-if="courses.length === 0">
          <td colspan="3" class="text-center text-gray-400 py-6">No courses found.</td>
        </tr>
      </tbody>
    </table>
  </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
  <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
    <h3 class="text-xl font-bold mb-6 text-blue-900">{{ showAddModal ? 'Add Course' : 'Edit Course' }}</h3>
    <div v-if="validationError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ validationError }}
    </div>
    <div class="grid grid-cols-1 gap-2 mb-4">
      <div>
        <label class="block text-gray-700 mb-1 font-semibold">Code</label>
        <input v-model="courseForm.code" @input="clearValidationError" type="text" class="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label class="block text-gray-700 mb-1 font-semibold">Name</label>
        <input v-model="courseForm.name" @input="clearValidationError" type="text" class="w-full border rounded px-2 py-1" />
      </div>
    </div>
    <div class="flex gap-2 justify-end">
      <button @click="closeModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
      <button @click="saveCourse" class="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
    </div>
    <button @click="closeModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
  </div>
</div>
    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
  <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-sm pointer-events-auto relative">
    <h3 class="text-xl font-bold mb-6 text-blue-900">Delete Course</h3>
    <p>Are you sure you want to delete <span class="font-bold">{{ courseToDelete?.name }}</span>?</p>
    <div class="flex gap-2 justify-end mt-4">
      <button @click="closeDeleteModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
      <button @click="deleteCourse" class="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
    </div>
    <button @click="closeDeleteModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
  </div>
</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const courses = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const validationError = ref('')
const courseForm = ref({ id: null, code: '', name: '' })
const courseToDelete = ref(null)
const loading = ref(false)

function clearValidationError() {
  validationError.value = ''
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  courseForm.value = { id: null, code: '', name: '' }
  validationError.value = ''
}

function closeDeleteModal() {
  showDeleteModal.value = false
  courseToDelete.value = null
}

function editCourse(course) {
  courseForm.value = { ...course }
  showEditModal.value = true
}

function confirmDelete(course) {
  courseToDelete.value = course
  showDeleteModal.value = true
}

async function fetchCourses() {
  loading.value = true
  try {
    const res = await fetch('/api/admin/courses', {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    })
    courses.value = await res.json()
  } catch (err) {
    courses.value = []
  }
  loading.value = false
}

async function saveCourse() {
  if (!courseForm.value.code || !courseForm.value.name) {
    validationError.value = 'All fields are required.'
    return
  }
  const method = showAddModal.value ? 'POST' : 'PUT'
  const url = showAddModal.value ? '/api/admin/courses' : `/api/admin/courses/${courseForm.value.id}`
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(courseForm.value)
    })
    const data = await res.json()
    if (!res.ok) {
      validationError.value = data.error || 'An error occurred.'
      return
    }
    closeModal()
    fetchCourses()
  } catch (err) {
    validationError.value = 'An error occurred.'
  }
}

async function deleteCourse() {
  try {
    const res = await fetch(`/api/admin/courses/${courseToDelete.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    })
    if (!res.ok) {
      const data = await res.json()
      validationError.value = data.error || 'An error occurred.'
      return
    }
    closeDeleteModal()
    fetchCourses()
  } catch (err) {
    validationError.value = 'An error occurred.'
  }
}

onMounted(fetchCourses)
</script>
