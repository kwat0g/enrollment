<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Accountabilities Management</h2>
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
              <span :class="item.status === 'pending' ? 'text-yellow-700 font-bold' : 'text-green-600 font-bold'">
                {{ item.status }}
              </span>
            </td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.amount ? '\u20b1' + item.amount : '-' }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <button v-if="item.status !== 'cleared'" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-800 transition w-full sm:w-auto text-xs sm:text-sm" @click="markCleared(item)">Mark as Cleared</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition w-full sm:w-auto text-xs sm:text-sm" @click="removeAccountability(item)">Remove</button>
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

const accountabilities = ref([])
const loading = ref(true)
const error = ref('')

async function fetchAccountabilities() {
  loading.value = true
  error.value = ''
  try {
    const token = sessionStorage.getItem('token')
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

async function markCleared(item) {
  try {
    const token = sessionStorage.getItem('token')
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

async function removeAccountability(item) {
  if (!confirm('Remove this accountability?')) return
  try {
    const token = sessionStorage.getItem('token')
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

onMounted(fetchAccountabilities)
</script> 