<template>
  <div class="pt-5">
    <h2 class="text-2xl font-bold text-ncst-maroon mb-4 sm:mb-6">Reports</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      <div class="bg-white rounded shadow p-4 sm:p-6 w-full max-w-sm mx-auto">
        <h3 class="text-lg font-semibold text-ncst-maroon mb-2">Enrollment Stats</h3>
        <p class="text-ncst-maroon">Total Enrolled: <span class="font-bold">{{ totalEnrolled }}</span></p>
        <p class="text-ncst-maroon">Pending Enrollments: <span class="font-bold">{{ pendingEnrollments }}</span></p>
      </div>
      <!-- You can add more dynamic report cards here -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const enrollmentStats = ref([])
const loading = ref(true)
const error = ref('')

async function fetchEnrollmentStats() {
  loading.value = true
  error.value = ''
  try {
    const token = sessionStorage.getItem('token')
    const res = await fetch('http://localhost:5000/api/admin/reports/enrollments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to fetch enrollment stats')
    enrollmentStats.value = data
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchEnrollmentStats)

const totalEnrolled = computed(() => {
  return enrollmentStats.value.reduce((sum, stat) => stat.status === 'approved' ? sum + stat.count : sum, 0)
})
const pendingEnrollments = computed(() => {
  return enrollmentStats.value.reduce((sum, stat) => stat.status === 'pending' ? sum + stat.count : sum, 0)
})
</script> 