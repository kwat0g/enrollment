<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Room Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <button @click="showAddModal = true" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Room</button>
    </div>
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading rooms...</div>
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <!-- Room Info Table -->
      <div class="bg-white rounded-xl shadow p-4 mb-6">
        <h3 class="text-lg font-bold text-blue-900 mb-2">Room Information</h3>
        <div class="overflow-x-auto">
        <table class="min-w-[600px] w-full border text-xs sm:text-sm">

          <thead class="bg-gray-100 text-gray-900">
            <tr>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Room Name</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Capacity</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Type</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Facilities</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Status</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in rooms" :key="room.id" class="text-gray-900">
              <td class="py-2 px-2 sm:px-4 text-center">{{ room.name }}</td>
              <td class="py-2 px-2 sm:px-4 text-center">{{ room.capacity }}</td>
              <td class="py-2 px-2 sm:px-4 text-center">{{ room.type }}</td>
              <td class="py-2 px-2 sm:px-4 text-center">{{ room.facilities }}</td>
              <td class="py-2 px-2 sm:px-4 text-center">
                <span :class="room.status === 'active' ? 'text-green-600 font-bold' : 'text-gray-400 font-semibold'">
                  {{ room.status && typeof room.status === 'string' && room.status.length > 0
                    ? room.status.charAt(0).toUpperCase() + room.status.slice(1)
                    : 'Unknown' }}
                </span>
              </td>
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
  <div>
    <label class="block text-gray-700 mb-1 font-semibold">Capacity</label>
    <input v-model.number="roomForm.capacity" @input="clearValidationError" type="number" min="1" class="w-full border rounded px-2 py-1" />
  </div>
  <div>
    <label class="block text-gray-700 mb-1 font-semibold">Type</label>
    <select v-model="roomForm.type" @change="clearValidationError" class="w-full border rounded px-2 py-1">
      <option value="">Select Type</option>
      <option value="Lecture">Lecture</option>
      <option value="Laboratory">Laboratory</option>
      <option value="Computer Lab">Computer Lab</option>
      <option value="Other">Other</option>
    </select>
  </div>
  <div>
    <label class="block text-gray-700 mb-1 font-semibold">Facilities <span class="text-xs text-gray-400">(comma separated)</span></label>
    <input v-model="roomForm.facilities" @input="clearValidationError" type="text" class="w-full border rounded px-2 py-1" placeholder="e.g., Projector, AC, Whiteboard" />
  </div>
  <div>
    <label class="block text-gray-700 mb-1 font-semibold">Status</label>
    <select v-model="roomForm.status" @change="clearValidationError" class="w-full border rounded px-2 py-1">
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  </div>
</div>
        <div class="flex gap-2 justify-end">
          <button @click="handleCancel" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">Cancel</button>
          <button v-if="showAddModal" @click="saveRoom" class="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition">Save</button>
          <button v-else @click="tryUpdateRoom" :disabled="!hasRoomChanges" class="px-4 py-2 rounded transition" :class="hasRoomChanges ? 'bg-blue-900 text-white hover:bg-blue-800' : 'bg-gray-400 text-gray-600 cursor-not-allowed'">Update</button>
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
    <!-- Notification Modal -->
    <div v-if="showNotifModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ notifMessage }}</div>
        <button @click="showNotifModal = false" class="px-5 py-2 bg-yellow-400 text-blue-900 rounded font-bold shadow hover:bg-yellow-300 transition">OK</button>
        <button @click="showNotifModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
    </div>
  </div>
      <!-- Room Availability Calendar -->
      <!-- Collapsible Room Availability Calendar -->
      <div class="mb-8 bg-white rounded-xl shadow p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-bold text-blue-900">Room Availability Calendar</h3>
          <button @click="showCalendar = !showCalendar" class="px-3 py-1 rounded bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 transition">
            {{ showCalendar ? 'Hide Calendar' : 'Show Calendar' }}
          </button>
        </div>
        <div v-show="showCalendar">
          <div class="flex gap-2 items-center mb-2">
            <label class="font-semibold text-gray-700">Select Room:</label>
            <select v-model="calendarRoomId" @change="fetchCalendarSchedules" class="border rounded px-2 py-1">
              <option :value="null">-- Select Room --</option>
              <option v-for="room in rooms" :value="room.id" :key="room.id">{{ room.name }}</option>
            </select>
          </div>
          <div v-if="calendarRoomId">
            <div v-if="calendarLoading" class="text-center text-gray-400 py-4">Loading calendar...</div>
            <div v-else class="overflow-x-auto">
              <table class="min-w-[700px] w-full border text-xs sm:text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="py-1 px-2 w-25 text-center">Time</th>
                    <th v-for="day in days" :key="day" class="py-1 px-2 text-center">{{ day }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(time, timeIndex) in timeSlots" :key="time">
                    <td class="py-1 px-2 text-center font-semibold">{{ time }}</td>
                    <template v-for="day in days" :key="`${day}-${time}`">
                      <td 
                        v-if="shouldShowSection(day, timeIndex)"
                        class="py-1 px-2 text-center w-32"
                        :rowspan="isSlotBooked(day, time) ? getRowSpan(day, timeIndex) : 1"
                        :class="{ 'bg-red-100 rounded': isSlotBooked(day, time), 'bg-green-50 rounded': !isSlotBooked(day, time) }"
                      >
                        <div v-if="isSlotBooked(day, time)" class="font-semibold text-xs text-red-900">
                          {{ getSectionName(day, time) }}
                        </div>
                        <div v-else class="text-green-700">Available</div>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="text-gray-400 py-4 text-center">No room selected. Please select a room to view its availability calendar.</div>
        </div>
      </div>
    </div>
  </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-green-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-green-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">{{ successMessage }}</div>
        <button @click="showSuccessModal = false" class="px-5 py-2 bg-green-400 text-white rounded font-bold shadow hover:bg-green-300 transition">OK</button>
        <button @click="showSuccessModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Unsaved Changes Warning Modal -->
    <div v-if="showUnsavedWarningModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-yellow-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-yellow-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">You have unsaved changes. Are you sure you want to cancel?</div>
        <div class="flex gap-2">
          <button @click="confirmCancel" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Yes, Cancel</button>
          <button @click="showUnsavedWarningModal = false" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-800 transition">No, Stay</button>
        </div>
        <button @click="showUnsavedWarningModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
    <!-- Save Confirmation Modal -->
    <div v-if="showSaveConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-blue-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-blue-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to save these changes?</div>
        <div class="flex gap-2">
          <button @click="confirmUpdateRoom" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-800 transition">Yes, Save</button>
          <button @click="cancelUpdateRoom" class="px-4 py-2 bg-gray-300 rounded font-semibold shadow hover:bg-gray-400 transition">Cancel</button>
        </div>
        <button @click="showSaveConfirmModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'

// Notification modal state
const notifMessage = ref('')
const showNotifModal = ref(false)

// Success modal state
const showSuccessModal = ref(false)
const successMessage = ref('')

// Unsaved changes warning modal state
const showUnsavedWarningModal = ref(false)

// Utility: show notification and close all modals that could overlap
function showNotification(message) {
  notifMessage.value = message
  showNotifModal.value = true
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
  // Optionally close other modals if you add more
}

// Utility: show success modal
function showSuccess(message) {
  successMessage.value = message
  showSuccessModal.value = true
  showAddModal.value = false
  showEditModal.value = false
  showDeleteModal.value = false
}

// Function to handle cancel with unsaved changes check
function handleCancel() {
  if (showEditModal.value && hasRoomChanges.value) {
    showUnsavedWarningModal.value = true
  } else {
    closeModal()
  }
}

// Function to confirm cancel (when user clicks "Yes, Cancel")
function confirmCancel() {
  showUnsavedWarningModal.value = false
  closeModal()
}


const rooms = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const validationError = ref('')

// Room Availability Calendar State
const showCalendar = ref(true)
const calendarRoomId = ref(null) // Default: no room selected
const calendarLoading = ref(false)
const calendarSchedules = ref([])
const days = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]
const timeSlots = [
  '7:00AM', '8:00AM', '9:00AM', '10:00AM', '11:00AM',
  '12:00PM', '1:00PM', '2:00PM', '3:00PM', '4:00PM', 
  '5:00PM', '6:00PM', '7:00PM', '8:00PM', '9:00PM', '10:00PM'
]

// Convert time string to minutes since midnight
function toMinutes(t) {
  if (!t) return NaN;
  
  // 12-hour format (e.g. 1:00PM)
  const ampmMatch = t.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (ampmMatch) {
    let [ , h, m, ap ] = ampmMatch;
    let hour = parseInt(h, 10);
    if (ap.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (ap.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return hour * 60 + parseInt(m, 10);
  }
  
  // 24-hour format with seconds (e.g. 13:00:00)
  const time24Match = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (time24Match) {
    const [ , h, m ] = time24Match;
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  // 24-hour format (e.g. 13:00)
  const h24Match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    let [ , h, m ] = h24Match;
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }
  return NaN;
}

function isSlotBooked(day, time) {
  // Find if any schedule matches the day and overlaps with the time slot
  const schedules = calendarSchedules.value || [];
  const slotStart = toMinutes(time);
  const slotEnd = slotStart + 60;
  
  return schedules.some(sch => {
    if (!sch.day || !sch.start_time || !sch.end_time) return false;
    if (sch.day !== day) return false;
    const schStart = toMinutes(sch.start_time);
    const schEnd = toMinutes(sch.end_time);
    // Overlap if slotStart < schEnd and slotEnd > schStart
    return slotStart < schEnd && slotEnd > schStart;
  });
}

function getSectionName(day, time) {
  const schedule = getScheduleForSlot(day, time);
  return schedule ? schedule.section_name || 'Occupied' : 'Available';
}

function getScheduleForSlot(day, time) {
  const schedules = calendarSchedules.value || [];
  const slotStart = toMinutes(time);
  const slotEnd = slotStart + 60;
  
  return schedules.find(sch => {
    if (!sch.day || !sch.start_time || !sch.end_time) return false;
    if (sch.day !== day) return false;
    const schStart = toMinutes(sch.start_time);
    const schEnd = toMinutes(sch.end_time);
    return slotStart < schEnd && slotEnd > schStart;
  });
}

function getRowSpan(day, timeIndex) {
  const time = timeSlots[timeIndex];
  const schedule = getScheduleForSlot(day, time);
  
  if (!schedule || !schedule.end_time || !schedule.start_time) return 1;
  
  const scheduleStartTime = toMinutes(schedule.start_time);
  const scheduleEndTime = toMinutes(schedule.end_time);
  const duration = scheduleEndTime - scheduleStartTime;
  
  // Calculate how many time slots this section spans
  const slots = Math.ceil(duration / 60);
  return Math.max(1, slots);
}

function shouldShowSection(day, timeIndex) {
  const time = timeSlots[timeIndex];
  const schedule = getScheduleForSlot(day, time);
  
  // If no schedule or first time this section appears in the column
  if (!schedule) return true;
  
  // Check if this is the first time slot for this section
  if (timeIndex === 0) return true;
  
  const prevTime = timeSlots[timeIndex - 1];
  const prevSchedule = getScheduleForSlot(day, prevTime);
  
  // Show if previous time slot has a different section or is available
  return !prevSchedule || prevSchedule.section_name !== schedule.section_name;
}

function isPartOfSection(day, timeIndex) {
  if (timeIndex === 0) return false;
  
  const time = timeSlots[timeIndex];
  const schedule = getScheduleForSlot(day, time);
  const prevTime = timeSlots[timeIndex - 1];
  const prevSchedule = getScheduleForSlot(day, prevTime);
  
  return schedule && prevSchedule && schedule.section_name === prevSchedule.section_name;
}

async function fetchCalendarSchedules() {
  if (!calendarRoomId.value) return
  calendarLoading.value = true
  calendarSchedules.value = []
  try {
    const token = sessionStorage.getItem('admin_token')
    const url = `http://localhost:5000/api/admin/rooms/${calendarRoomId.value}/schedules`
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to fetch schedules`)
    }
    
    calendarSchedules.value = data || []
    
  } catch (err) {
    showNotification(`Error loading room schedules: ${err.message}`)
    calendarSchedules.value = []
  } finally {
    calendarLoading.value = false
  }
}


const roomForm = ref({ id: null, name: '', capacity: 1, type: '', facilities: '', status: 'active' })
const originalRoomData = ref(null)
const roomToDelete = ref(null)
const loading = ref(false)
const deleteError = ref('')

// Computed property to check if room data has changed
const hasRoomChanges = computed(() => {
  if (!originalRoomData.value || !showEditModal.value) return false
  
  return (
    roomForm.value.name !== originalRoomData.value.name ||
    roomForm.value.capacity !== originalRoomData.value.capacity ||
    roomForm.value.type !== originalRoomData.value.type ||
    roomForm.value.facilities !== originalRoomData.value.facilities ||
    roomForm.value.status !== originalRoomData.value.status
  )
})

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
    const res = await fetch(`http://localhost:5000/api/admin/rooms/${room.id}/schedules`, {
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
  roomForm.value = { id: null, name: '', capacity: 1, type: '', facilities: '', status: 'active' }
  originalRoomData.value = null
  validationError.value = ''
}

function closeDeleteModal() {
  showDeleteModal.value = false
  roomToDelete.value = null
  deleteError.value = ''
}

function editRoom(room) {
  roomForm.value = { ...room }
  originalRoomData.value = { ...room } // Store original data
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
  if (!roomForm.value.name || !roomForm.value.name.trim()) {
    validationError.value = 'Room name is required.'
    return
  }
  if (roomForm.value.capacity == null || isNaN(Number(roomForm.value.capacity)) || Number(roomForm.value.capacity) < 1) {
    validationError.value = 'Room capacity must be a positive number.'
    return
  }
  if (!roomForm.value.type || !roomForm.value.type.trim()) {
    validationError.value = 'Room type is required.'
    return
  }
  if (!roomForm.value.status || !['active','inactive'].includes(roomForm.value.status)) {
    validationError.value = 'Room status must be active or inactive.'
    return
  }
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch('http://localhost:5000/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: roomForm.value.name.trim(),
        capacity: Number(roomForm.value.capacity),
        type: roomForm.value.type.trim(),
        facilities: roomForm.value.facilities ? roomForm.value.facilities.trim() : '',
        status: roomForm.value.status
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to add room')
    closeModal()
    await fetchRooms()
  } catch (err) {
    // Show backend errors (including schedule conflict) in notification modal
    showNotification(err.message)
  }
}

async function updateRoom() {
  validationError.value = ''
  if (!roomForm.value.name || !roomForm.value.name.trim()) {
    validationError.value = 'Room name is required.'
    return
  }
  if (roomForm.value.capacity == null || isNaN(Number(roomForm.value.capacity)) || Number(roomForm.value.capacity) < 1) {
    validationError.value = 'Room capacity must be a positive number.'
    return
  }
  if (!roomForm.value.type || !roomForm.value.type.trim()) {
    validationError.value = 'Room type is required.'
    return
  }
  if (!roomForm.value.status || !['active','inactive'].includes(roomForm.value.status)) {
    validationError.value = 'Room status must be active or inactive.'
    return
  }
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/rooms/${roomForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: roomForm.value.name.trim(),
        capacity: Number(roomForm.value.capacity),
        type: roomForm.value.type.trim(),
        facilities: roomForm.value.facilities ? roomForm.value.facilities.trim() : '',
        status: roomForm.value.status
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update room')
    closeModal()
    await fetchRooms()
    showSuccess('Room updated successfully!')
  } catch (err) {
    // Show backend errors (including schedule conflict) in notification modal
    showNotification(err.message)
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
    // Show backend errors in notification modal
    showNotification(err.message)
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

const showSaveConfirmModal = ref(false)

function tryUpdateRoom() {
  if (showEditModal.value) {
    showSaveConfirmModal.value = true
  } else {
    saveRoom()
  }
}

function confirmUpdateRoom() {
  showSaveConfirmModal.value = false
  updateRoom()
}

function cancelUpdateRoom() {
  showSaveConfirmModal.value = false
}

onMounted(fetchRooms)

</script>