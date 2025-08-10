<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Accountabilities Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <button @click="showAddModal = true" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Accountability</button>
    </div>
    <div class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Student ID</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Type</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Description</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Status</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Amount</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in accountabilities" :key="item.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.student_id }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.first_name }} {{ item.last_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.type }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.description }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <span :class="item.status === 'pending' ? 'text-yellow-900 font-bold' : 'text-green-600 font-bold'">
                {{ item.status.toUpperCase() }}
              </span>
            </td>
            <td v-if="item.type !== 'Document'" class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.amount ? '\u20b1' + item.amount : '-' }}</td>
<td v-else class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">-</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <button v-if="item.status !== 'cleared'" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-800 transition w-full sm:w-auto text-xs sm:text-sm" @click="tryMarkCleared(item)">Mark as Cleared</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition w-full sm:w-auto text-xs sm:text-sm" @click="tryRemoveAccountability(item)">Remove</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Add Accountability Modal -->
    <div v-if="showAddModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-2 text-blue-900">Add Accountability</h3>
<div v-if="showValidationWarning && validationWarning" class="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">{{ validationWarning }}</div>
        <div class="grid grid-cols-1 gap-3 mb-2">
          <!-- Student Search -->
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Student ID</label>
            <input v-model="studentSearch" @input="onFieldChange();filterStudents()" type="text" placeholder="Search by student ID" class="w-full border rounded px-2 py-1" autocomplete="off" :disabled="!!addForm.student_id" />
            <ul v-if="studentSearch && filteredStudents.length && !addForm.student_id" class="border rounded bg-white mt-1 max-h-40 overflow-y-auto z-10 absolute w-full">
              <li v-for="s in filteredStudents" :key="s.id" @click="selectStudent(s)" class="px-3 py-1 hover:bg-blue-100 cursor-pointer">
                {{ s.student_id }} - {{ s.last_name }}, {{ s.first_name }}
              </li>
            </ul>
            <div v-if="addForm.student_id" class="mt-1 text-green-700 text-sm font-semibold">
              Selected: {{ selectedStudentLabel }}
              <button @click="clearStudent" class="ml-2 text-red-600 underline text-xs">Change</button>
            </div>
          </div>
          <!-- Type Dropdown -->
          <div v-if="addForm.student_id">
            <label class="block text-gray-700 mb-1 font-semibold">Type</label>
            <select v-model="addForm.type" @change="onFieldChange" class="w-full border rounded px-2 py-1">
              <option value="" disabled>Select type</option>
              <option value="Document">Document</option>
              <option value="Balance">Balance</option>
            </select>
          </div>
          <!-- Document Fields -->
          <div v-if="addForm.type === 'Document'">
            <label class="block text-gray-700 mb-1 font-semibold">Description</label>
            <input v-model="addForm.description" @input="onFieldChange" type="text" class="w-full border rounded px-2 py-1" placeholder="Document name or details" />
          </div>
          <!-- Balance Fields -->
          <div v-if="addForm.type === 'Balance'">
            <label class="block text-gray-700 mb-1 font-semibold">Amount</label>
            <input v-model="addForm.amount" @input="onFieldChange" type="number" min="0" class="w-full border rounded px-2 py-1" placeholder="Enter amount" />
            <label class="block text-gray-700 mb-1 font-semibold mt-2">Description</label>
            <input v-model="addForm.description" @input="onFieldChange" type="text" class="w-full border rounded px-2 py-1" placeholder="Description (e.g. Tuition, Misc)" />
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="closeAddModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button @click="onSaveAccountability" class="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
        </div>
        <button @click="closeAddModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
  <!-- Confirmation Modal -->
  <div v-if="showConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-300 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="mb-4 text-gray-800 text-base font-semibold">{{ confirmMessage }}</div>
      <div class="flex gap-2">
        <button @click="closeConfirmModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
        <button @click="handleConfirm" class="px-4 py-2 bg-yellow-300 text-blue-900 rounded font-semibold shadow hover:bg-yellow-400 transition">Confirm</button>
      </div>
      <button @click="closeConfirmModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
    </div>
  </div>
  <!-- Confirmation Modal -->
  <div v-if="showConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-300 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="mb-4 text-gray-800 text-base font-semibold">{{ confirmMessage }}</div>
      <div class="flex gap-2">
        <button @click="closeConfirmModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
        <button @click="handleConfirm" class="px-4 py-2 bg-yellow-300 text-blue-900 rounded font-semibold shadow hover:bg-yellow-400 transition">Confirm</button>
      </div>
      <button @click="closeConfirmModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
    </div>
  </div>
  <!-- Info Modal -->
  <div v-if="showInfoModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-blue-900 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
      <svg class="w-10 h-10 text-blue-900 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01"/>
      </svg>
      <div class="mb-4 text-gray-800 text-base font-semibold">{{ infoMessage }}</div>
      <div class="flex gap-2">
        <button @click="closeInfoModal" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-600 transition">OK</button>
      </div>
      <button @click="closeInfoModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, onMounted, computed } from 'vue'

const validationWarning = ref('')
const showValidationWarning = ref(false)
const addForm = ref({ student_id: '', type: '', description: '', amount: '' })

function validateAccountabilityFields() {
  if (!addForm.value.student_id) {
    validationWarning.value = 'Please select a student.'
    return false
  }
  if (!addForm.value.type) {
    validationWarning.value = 'Please select an accountability type.'
    return false
  }
  if (addForm.value.type === 'Balance' && (!addForm.value.amount || addForm.value.amount === '')) {
    validationWarning.value = 'Amount is required for Balance type.'
    return false
  }
  if (!addForm.value.description) {
    validationWarning.value = 'Description is required.'
    return false
  }
  validationWarning.value = ''
  return true
}

function onSaveAccountability() {
  showValidationWarning.value = true
  if (validateAccountabilityFields()) {
    openConfirmModal(
      'Are you sure you want to add this accountability?',
      () => {
        saveAccountability()
        showValidationWarning.value = false
      }
    )
  }
}


// (addForm already declared above for watcher safety)

const accountabilities = ref([])
const loading = ref(true)
const error = ref('')
const showAddModal = ref(false)
const students = ref([])
const studentSearch = ref('')
const filteredStudents = ref([])

function filterStudents() {
  const search = studentSearch.value.trim().toLowerCase()
  if (!search) {
    filteredStudents.value = []
    return
  }
  filteredStudents.value = students.value.filter(s => s.student_id.toLowerCase().includes(search))
}

function selectStudent(s) {
  addForm.value.student_id = s.student_id
  studentSearch.value = ''
  filteredStudents.value = []
  addForm.value.type = ''
  addForm.value.description = ''
  addForm.value.amount = ''
}

function clearStudent() {
  addForm.value.student_id = ''
  addForm.value.type = ''
  addForm.value.description = ''
  addForm.value.amount = ''
  studentSearch.value = ''
  filteredStudents.value = []
}

const selectedStudentLabel = computed(() => {
  const s = students.value.find(stu => stu.student_id === addForm.value.student_id)
  return s ? `${s.student_id} - ${s.last_name}, ${s.first_name}` : ''
})

function closeAddModal() {
  showAddModal.value = false
  addForm.value = { student_id: '', type: '', description: '', amount: '' }
  showValidationWarning.value = false
  validationWarning.value = ''
}

function onFieldChange() {
  if (showValidationWarning.value) {
    showValidationWarning.value = false
    validationWarning.value = ''
  }
}

async function saveAccountability() {
  // Resolve numeric student id without mutating the form prematurely
  const sid = addForm.value.student_id
  let numericId = null
  if (typeof sid === 'number') {
    numericId = sid
  } else if (typeof sid === 'string' && sid.trim()) {
    const student = students.value.find(s => s.student_id === sid.trim())
    numericId = student?.id ?? null
  }

  if (!Number.isInteger(numericId)) {
    alert('Please select a valid student from the list.')
    return
  }

  // Build payload to ensure correct types
  const payload = {
    student_id: numericId,
    type: addForm.value.type,
    description: addForm.value.description,
    amount: addForm.value.type === 'Balance' ? Number(addForm.value.amount) : undefined,
    status: addForm.value.status || 'pending',
  }

  if (payload.type === 'Balance' && (isNaN(payload.amount) || payload.amount === undefined)) {
    alert('Amount is required and must be a number for Balance type.')
    return
  }

  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/accountabilities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to add accountability')
    closeAddModal()
    fetchAccountabilities()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

async function fetchAccountabilities() {
  loading.value = true
  error.value = ''
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/accountabilities', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch accountabilities')
    accountabilities.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// --- Confirmation Modal State ---
const showConfirmModal = ref(false)
const confirmMessage = ref('')
let confirmAction = null

function openConfirmModal(message, action) {
  confirmMessage.value = message
  confirmAction = action
  showConfirmModal.value = true
}
function closeConfirmModal() {
  showConfirmModal.value = false
  confirmMessage.value = ''
  confirmAction = null
}
function handleConfirm() {
  if (confirmAction) confirmAction()
  closeConfirmModal()
}

function tryMarkCleared(item) {
  openConfirmModal(
    `Are you sure you want to mark this accountability as cleared?`,
    () => markCleared(item)
  )
}

async function markCleared(item) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/accountabilities/${item.id}/clear`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to mark as cleared')
    await fetchAccountabilities()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

const showInfoModal = ref(false)
const infoMessage = ref('')
function openInfoModal(message) {
  infoMessage.value = message
  showInfoModal.value = true
}
function closeInfoModal() {
  showInfoModal.value = false
  infoMessage.value = ''
}

function tryRemoveAccountability(item) {
  if (item.status !== 'cleared') {
    openInfoModal('You can only delete accountabilities that are already cleared.')
    return
  }
  openConfirmModal('Are you sure you want to delete this record?', () => removeAccountability(item))
}


async function removeAccountability(item) {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/accountabilities/${item.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to remove accountability')
    await fetchAccountabilities()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}


async function fetchStudents() {
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch students')
    students.value = data
  } catch (err) {
    students.value = []
  }
}

onMounted(() => {
  fetchAccountabilities()
  fetchStudents()
})
</script> 