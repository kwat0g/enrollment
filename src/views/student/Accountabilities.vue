<template>
  <div class="w-full max-w-full min-w-0 px-2 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Accountabilities</h2>
    <button @click="refresh" class="mb-4 bg-blue-900 text-yellow-300 px-3 py-1 rounded w-full sm:w-auto">Refresh</button>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div v-if="accountabilities.some(item => item.status === 'pending')" class="mb-6">
        <div class="bg-gray-900 text-white p-4 rounded shadow text-center font-semibold">
          You have pending accountabilities. Enrollment is blocked until you settle them.
        </div>
      </div>
      <div class="overflow-x-auto w-full">
        <table class="min-w-[350px] w-full bg-white rounded shadow text-xs sm:text-sm">
          <thead class="bg-gray-100 text-gray-900">
            <tr>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Type</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Description</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Status</th>
              <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in accountabilities.filter(acc => acc.status === 'pending')" :key="item.id" class="text-gray-900">
              <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.type }}</td>
              <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.description }}</td>
              <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
                <span class="text-yellow-700 font-bold">
                  {{ item.status }}
                </span>
              </td>
              <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.amount ? '₱' + item.amount : '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!accountabilities.filter(acc => acc.status === 'pending').length" class="text-center text-green-700 font-bold mt-6 text-sm sm:text-base">No pending accountabilities!</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { initializeAccountabilities } from '@/scripts/student/accountabilities.js'

const { userStore, accountabilities, loading, error, refresh } = initializeAccountabilities()
</script>
