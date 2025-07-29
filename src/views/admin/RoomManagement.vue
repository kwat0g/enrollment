<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Room Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <button @click="showAddModal = true" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Room</button>
    </div>
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading rooms...</div>
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Room Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in rooms" :key="room.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center">{{ room.name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">
              <button @click="editRoom(room)" class="bg-yellow-400 text-blue-900 px-3 py-1 rounded font-semibold hover:bg-yellow-300 transition mr-1">Edit</button>
              <button @click="confirmDelete(room)" class="bg-red-400 text-white px-3 py-1 rounded font-semibold hover:bg-red-500 transition mr-1">Delete</button>
              <button @click="openScheduleModal(room)" class="bg-blue-200 text-blue-900 px-3 py-1 rounded font-semibold hover:bg-blue-300 transition">View Schedule</button>
            </td>
          </tr>
          <tr v-if="rooms.length === 0">
            <td colspan="2" class="text-center text-gray-400 py-6">No rooms found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">{{ showAddModal ? 'Add Room' : 'Edit Room' }}</h3>
        <div v-if="validationError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ validationError }}
        </div>
        <div class="grid grid-cols-1 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Room Name</label>
            <input v-model="roomForm.name" @input="clearValidationError" type="text" class="w-full border rounded px-2 py-1" />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="closeModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button v-if="showAddModal" @click="saveRoom" class="px-4 py-2 bg-blue-900 text-white rounded">Save</button>
          <button v-else @click="updateRoom" class="px-4 py-2 bg-blue-900 text-white rounded">Update</button>
        </div>
        <button @click="closeModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-sm pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Delete Room</h3>
        <div v-if="deleteError" class="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{{ deleteError }}</div>
        <p>Are you sure you want to delete <span class="font-bold">{{ roomToDelete?.name }}</span>?</p>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="closeDeleteModal" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button @click="deleteRoom" class="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
        </div>
        <button @click="closeDeleteModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- View Schedule Modal -->
    <div v-if="showScheduleModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-2xl pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">Weekly Schedule for {{ selectedRoom?.name }}</h3>
        <div v-if="scheduleLoading" class="text-center py-6 text-gray-500">Loading schedule...</div>
        <div v-else>
          <table v-if="roomSchedule.length > 0" class="min-w-full border text-xs sm:text-sm mb-4">
            <thead class="bg-gray-100 text-gray-900">
              <tr>
                <th class="py-2 px-2 sm:px-4 text-center">Day</th>
                <th class="py-2 px-2 sm:px-4 text-center">Start Time</th>
                <th class="py-2 px-2 sm:px-4 text-center">End Time</th>
                <th class="py-2 px-2 sm:px-4 text-center">Subject</th>
                <th class="py-2 px-2 sm:px-4 text-center">Section</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sched in roomSchedule" :key="sched.id">
                <td class="py-2 px-2 sm:px-4 text-center">{{ sched.day }}</td>
                <td class="py-2 px-2 sm:px-4 text-center">{{ formatTime(sched.start_time) }}</td>
                <td class="py-2 px-2 sm:px-4 text-center">{{ formatTime(sched.end_time) }}</td>
                <td class="py-2 px-2 sm:px-4 text-center">{{ sched.subject_name }}</td>
                <td class="py-2 px-2 sm:px-4 text-center">{{ sched.section_name }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="text-center text-gray-400 py-6">No schedules for this room.</div>
        </div>
        <button @click="closeScheduleModal" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const rooms = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const validationError = ref('')
const roomForm = ref({ id: null, name: '' })
const roomToDelete = ref(null)
const loading = ref(false)
const deleteError = ref('')

// View Schedule Modal State
const showScheduleModal = ref(false)
const selectedRoom = ref(null)
const roomSchedule = ref([])
const scheduleLoading = ref(false)

function openScheduleModal(room) {
  selectedRoom.value = room
  showScheduleModal.value = true
  fetchRoomSchedule(room)
}
function closeScheduleModal() {
  showScheduleModal.value = false
  selectedRoom.value = null
  roomSchedule.value = []
}
async function fetchRoomSchedule(room) {
  scheduleLoading.value = true
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/rooms/${encodeURIComponent(room.name)}/schedules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch schedule')
    roomSchedule.value = data
  } catch (err) {
    roomSchedule.value = []
  } finally {
    scheduleLoading.value = false
  }
}

function clearValidationError() {
  validationError.value = ''
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  roomForm.value = { id: null, name: '' }
  validationError.value = ''
}

function closeDeleteModal() {
  showDeleteModal.value = false
  roomToDelete.value = null
  deleteError.value = ''
}

function editRoom(room) {
  roomForm.value = { ...room }
  validationError.value = ''
  showEditModal.value = true
}

function confirmDelete(room) {
  roomToDelete.value = room
  showDeleteModal.value = true
}

async function fetchRooms() {
  loading.value = true
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/rooms', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch rooms')
    rooms.value = data
  } catch (err) {
    rooms.value = []
  } finally {
    loading.value = false
  }
}

async function saveRoom() {
  validationError.value = ''
  if (!roomForm.value.name.trim()) {
    validationError.value = 'Room name is required.'
    return
  }
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: roomForm.value.name.trim() })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to add room')
    closeModal()
    await fetchRooms()
  } catch (err) {
    validationError.value = err.message
  }
}

async function updateRoom() {
  validationError.value = ''
  if (!roomForm.value.name.trim()) {
    validationError.value = 'Room name is required.'
    return
  }
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/rooms/${roomForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: roomForm.value.name.trim() })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update room')
    closeModal()
    await fetchRooms()
  } catch (err) {
    validationError.value = err.message
  }
}

async function deleteRoom() {
  if (!roomToDelete.value) return
  deleteError.value = ''
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/rooms/${roomToDelete.value.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete room')
    closeDeleteModal()
    await fetchRooms()
  } catch (err) {
    deleteError.value = err.message
  }
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  // Handles both 24hr (07:00, 13:30) and 12hr (7:00AM) formats
  if (/AM|PM/i.test(timeStr)) return timeStr.replace(/\s+/g, '').toUpperCase()
  const [h, m] = timeStr.split(':').map(Number)
  if (h === 7 && m === 0) return '7:00AM'
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`
}

onMounted(fetchRooms)
</script>
