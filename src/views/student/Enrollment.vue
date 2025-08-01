<template>
  <!-- Enrollment Notifications -->
  <div v-if="!notifLoading && notifications && notifications.length" class="mb-4 mt-2">
    <div v-for="notif in notifications.filter(n => n.type === 'enrollment' && !n.is_read)" :key="notif.id" class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-2 flex justify-between items-center">
      <span>{{ notif.message }}</span>
      <button @click="markAsRead(notif.id)" class="ml-4 text-yellow-800 hover:text-yellow-600 font-bold">Dismiss</button>
    </div>
  </div>

  <div class="w-full max-w-full min-w-0 px-2 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Enrollment</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <!-- Enrollment Status -->
      <div v-if="enrollment" class="mb-6">
        <div class="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded mb-4">
          <h3 class="font-bold">Current Enrollment Status: {{ enrollment.status }}</h3>
          <p v-if="enrollment.section">Enrolled in: {{ enrollment.section.name }}</p>
        </div>
      </div>

      <!-- Pending Accountabilities Warning -->
      <div v-if="accountabilities && accountabilities.some(item => item.status === 'pending')" class="mb-6">
        <div class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded">
          <h3 class="font-bold">⚠️ Enrollment Blocked</h3>
          <p>You have pending accountabilities. Please settle them before enrolling.</p>
        </div>
      </div>

      <!-- Available Sections -->
      <div v-if="!enrollment || enrollment.status !== 'approved'" class="mb-6">
        <h3 class="text-lg font-bold mb-4">Available Sections</h3>
        <div v-if="sections && sections.length" class="overflow-x-auto">
          <table class="min-w-[600px] w-full bg-white rounded shadow text-xs sm:text-sm">
            <thead class="bg-gray-100 text-gray-900">
              <tr>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Section</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Course</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Year Level</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Schedule Type</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Status</th>
                <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="section in sections" :key="section.id" class="text-gray-900">
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.name }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.course_name }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.year_level }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ section.schedule_type }}</td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
                  <span class="px-2 py-1 rounded-full text-xs font-medium" 
                        :class="section.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ section.status }}
                  </span>
                </td>
                <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
                  <button 
                    @click="openEnrollModal(section)"
                    :disabled="section.status !== 'open' || (accountabilities && accountabilities.some(item => item.status === 'pending'))"
                    class="bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    Enroll
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center text-gray-500 py-8">No available sections found.</div>
      </div>

      <!-- Current Enrollment Details -->
      <div v-if="enrollment && enrollment.status === 'approved' && enrollment.schedule" class="mb-6">
        <h3 class="text-lg font-bold mb-4">Your Current Schedule</h3>
        <div class="overflow-x-auto">
          <table class="min-w-[800px] w-full bg-white rounded shadow text-xs sm:text-sm">
            <thead class="bg-gray-100 text-gray-900">
              <tr>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Subject Code</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Subject Name</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Units</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Type</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Day</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Start Time</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">End Time</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Section</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Room</th>
                <th class="border px-2 py-1 text-center whitespace-normal break-words">Instructor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in enrollment.schedule" :key="item.subject_code + '-' + item.day + '-' + item.start_time" class="text-gray-900">
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.subject_code }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.subject_name }}</td>
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

  <!-- Enrollment Modal -->
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
              <td class="py-1 px-2 text-center">{{ formatTimeForDisplay(sched.start_time) }}</td>
              <td class="py-1 px-2 text-center">{{ formatTimeForDisplay(sched.end_time) }}</td>
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

<script setup>
import {
  sections,
  enrollment,
  accountabilities,
  loading,
  error,
  refresh,
  notifications,
  notifLoading,
  notifError,
  fetchNotifications,
  markAsRead,
  enrollLoading,
  enrollError,
  enrollSuccess,
  autoDismissingNotifIds,
  showEnrollModal,
  selectedSection,
  formatTime,
  formatTimeForDisplay,
  openEnrollModal,
  closeEnrollModal,
  confirmEnroll
} from '@/scripts/student/enrollment.js'
</script>
