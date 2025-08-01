<template>
  <div class="w-full max-w-full min-w-0 px-2 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Grades</h2>
    
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8 text-gray-500">
      Loading grades...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8 text-red-500">
      Error: {{ error.message }}
    </div>

    <!-- Grades Table -->
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <!-- Filter Controls -->
      <div class="mb-4 flex flex-col sm:flex-row gap-2">
        <select v-model="selectedSemester" class="border rounded px-3 py-2">
          <option value="">All Semesters</option>
          <option v-for="semester in semesters" :key="semester.value" :value="semester.value">
            {{ semester.label }}
          </option>
        </select>
        <select v-model="selectedYearLevel" class="border rounded px-3 py-2">
          <option value="">All Year Levels</option>
          <option v-for="year in yearLevels" :key="year.value" :value="year.value">
            {{ year.label }}
          </option>
        </select>
        <input
          v-model="selectedSubject"
          type="text"
          placeholder="Search subjects..."
          class="flex-1 border rounded px-3 py-2"
        />
        <button @click="clearFilters" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Clear Filters
        </button>
      </div>

      <!-- GPA Summary -->
      <div v-if="filteredGrades.length > 0" class="mb-4 p-4 bg-blue-50 rounded-lg">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold" :class="getGPAClass(gpa)">{{ gpa }}</div>
            <div class="text-sm text-gray-600">GPA</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ totalUnits }}</div>
            <div class="text-sm text-gray-600">Total Units</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">{{ passedUnits }}</div>
            <div class="text-sm text-gray-600">Passed Units</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-600">{{ failedUnits }}</div>
            <div class="text-sm text-gray-600">Failed Units</div>
          </div>
        </div>
      </div>

      <!-- Grades Table -->
      <table class="min-w-[600px] w-full text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Subject Code</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Subject Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Units</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Grade</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Description</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Semester</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Year Level</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredGrades.length === 0">
            <td colspan="7" class="text-center text-gray-400 py-6">No grades found.</td>
          </tr>
          <tr v-else v-for="item in filteredGrades" :key="item.id" class="text-gray-900 hover:bg-gray-50">
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words font-medium">{{ item.subject_code }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ item.subject_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ formatUnits(item.units) }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getGradeClass(item.grade)">
                {{ item.grade }}
              </span>
            </td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ getGradeDescription(item.grade) }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ getSemesterDisplayName(item.semester) }}</td>
            <td class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">{{ getYearLevelDisplayName(item.year_level) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Academic Standing -->
      <div v-if="filteredGrades.length > 0" class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-bold mb-2">Academic Standing</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span class="font-medium">Current Status: </span>
            <span :class="getAcademicStanding().class">{{ getAcademicStanding().status }}</span>
          </div>
          <div>
            <span class="font-medium">Honors Eligible: </span>
            <span :class="isEligibleForHonors() ? 'text-green-600 font-bold' : 'text-gray-600'">
              {{ isEligibleForHonors() ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex gap-2">
        <button @click="printGrades" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Print Grades
        </button>
        <button @click="exportGrades" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Export CSV
        </button>
        <button @click="generateTranscript" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Generate Transcript
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  grades,
  loading,
  error,
  selectedSemester,
  selectedYearLevel,
  selectedSubject,
  semesters,
  yearLevels,
  filteredGrades,
  gpa,
  totalUnits,
  passedUnits,
  failedUnits,
  clearFilters,
  getGradeClass,
  getGradeDescription,
  getGPAClass,
  getSemesterDisplayName,
  getYearLevelDisplayName,
  formatUnits,
  getAcademicStanding,
  isEligibleForHonors,
  printGrades,
  exportGrades,
  generateTranscript,
  fetchGrades
} from '@/scripts/student/grades.js'
</script>
