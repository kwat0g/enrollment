<template>
  <div class="w-full max-w-full min-w-0 px-2 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Grades</h2>
    <div class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[350px] w-full text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Subject</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Description</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Units</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Grade</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in grades" :key="item.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.subject_code }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.subject_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.units }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.grade }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.remarks }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useStudentData } from '@/composables/useStudentData'
const { grades } = useStudentData()
</script> 