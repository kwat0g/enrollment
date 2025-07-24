<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStudentData } from '@/composables/useStudentData'
import { useNotifications } from '@/composables/useNotifications'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { sections, enrollment, accountabilities, loading, error, refresh } = useStudentData()

const { notifications, loading: notifLoading, error: notifError, fetchNotifications, markAsRead } = useNotifications()

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
const selectedSection = ref(null)

function openEnrollModal(section) {
  selectedSection.value = section
  showEnrollModal.value = true
}
function closeEnrollModal() {
  showEnrollModal.value = false
  selectedSection.value = null
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
        <h3 class="text-lg font-semibold mb-2">Available Sections</h3>
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
              <tr v-for="section in sections.filter(s => s.status === 'open')" :key="section.id" class="text-gray-900">
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.name }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.schedule_type.toUpperCase() }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
                  <button
                    class="bg-gray-200 text-gray-900 px-4 py-1 rounded hover:bg-gray-300 transition"
                    :disabled="enrollLoading"
                    @click="openEnrollModal(section)"
                  >
                    {{ enrollLoading ? 'Enrolling...' : 'Enroll' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else>
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
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ enrollment.section?.name || 'N/A' }}</td>
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

  <div v-if="showEnrollModal && selectedSection" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-4 text-blue-900">Subjects for {{ selectedSection.name }}</h3>
      <div v-if="selectedSection.schedules && selectedSection.schedules.length">
        <table class="w-full text-sm mb-4">
          <thead>
            <tr class="bg-gray-100 text-gray-900">
              <th class="py-2 px-2 text-center">Code</th>
              <th class="py-2 px-2 text-center">Name</th>
              <th class="py-2 px-2 text-center">Units</th>
              <th class="py-2 px-2 text-center">Day</th>
              <th class="py-2 px-2 text-center">Start</th>
              <th class="py-2 px-2 text-center">End</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sched in selectedSection.schedules" :key="sched.subject_code + '-' + sched.day + '-' + sched.start_time">
              <td class="py-1 px-2 text-center">{{ sched.subject_code }}</td>
              <td class="py-1 px-2 text-center">{{ sched.subject_name }}</td>
              <td class="py-1 px-2 text-center">{{ sched.units }}</td>
              <td class="py-1 px-2 text-center">{{ sched.day }}</td>
              <td class="py-1 px-2 text-center">{{ sched.start_time }}</td>
              <td class="py-1 px-2 text-center">{{ sched.end_time }}</td>
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
</template>
