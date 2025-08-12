<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Enrollment Approvals</h2>
    <div class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Student ID</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Section</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Status</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="enrollment in enrollments" :key="enrollment.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ enrollment.student_id }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ enrollment.first_name.toUpperCase() }} {{ enrollment.last_name.toUpperCase() }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ enrollment.section_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <span :class="enrollment.status === 'pending' ? 'text-yellow-700 font-bold' : 'text-green-600 font-bold'">
                {{ enrollment.status }}
              </span>
            </td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <button class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-800 transition w-full sm:w-auto text-xs sm:text-sm" @click="openConfirmModal('approve', enrollment)">Approve</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition w-full sm:w-auto text-xs sm:text-sm" @click="openConfirmModal('reject', enrollment)">Reject</button>
              </div>

            <!-- Confirmation Modal -->
            <div v-if="showConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
              <div class="bg-white p-6 rounded shadow w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative border-l-8 border-yellow-400">
                <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="mb-4 text-gray-800 text-base font-semibold">{{ confirmMessage }}</div>
                <div class="flex gap-2">
                  <button @click="cancelConfirm" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
                  <button @click="confirmAction" class="px-4 py-2 bg-yellow-400 text-white rounded font-semibold shadow hover:bg-yellow-500 transition">Confirm</button>
                </div>
                <button @click="cancelConfirm" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
              </div>
            </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const enrollments = ref([])
const loading = ref(true)
const error = ref('')

// Standard admin modal state for confirmation
const showConfirmModal = ref(false)
const confirmMessage = ref('')
let confirmAction = null

function openConfirmModal(action, enrollment) {
  confirmMessage.value = action === 'approve'
    ? 'Are you sure you want to approve this enrollment?'
    : 'Are you sure you want to reject this enrollment?';
  confirmAction = async () => {
    if (action === 'approve') {
      await approveEnrollment(enrollment)
    } else if (action === 'reject') {
      await rejectEnrollment(enrollment)
    }
    showConfirmModal.value = false
  }
  showConfirmModal.value = true
}
function cancelConfirm() {
  showConfirmModal.value = false
  confirmAction = null
}

async function fetchEnrollments() {
  loading.value = true
  error.value = ''
  try {
    const token = sessionStorage.getItem('admin_token')
    if (!token) {
      throw new Error('Not authenticated. Please sign in as admin.')
    }
    const res = await fetch('http://localhost:5000/api/admin/enrollments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch enrollments')
    enrollments.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function approveEnrollment(enrollment) {
  try {
    const token = sessionStorage.getItem('admin_token')
    if (!token) throw new Error('Not authenticated. Please sign in as admin.')
    const res = await fetch(`http://localhost:5000/api/admin/enrollments/${enrollment.id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to approve enrollment')
    await fetchEnrollments()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

async function rejectEnrollment(enrollment) {
  try {
    const token = sessionStorage.getItem('admin_token')
    if (!token) throw new Error('Not authenticated. Please sign in as admin.')
    const res = await fetch(`http://localhost:5000/api/admin/enrollments/${enrollment.id}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to reject enrollment')
    await fetchEnrollments()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

onMounted(fetchEnrollments)
</script> 