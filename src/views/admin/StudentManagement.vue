<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Student Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <button @click="openAddModal" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Student</button>
      <button @click="openPendingModal" class="bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-500 transition">Show Pending Enrollment</button>
    </div>
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading students...</div>
    <div v-else class="overflow-x-auto bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
      <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-6">
        <thead class="bg-gray-100 text-gray-900">
          <tr>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Student ID</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Name</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Course</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Year Level</th>
            <th class="py-2 px-2 sm:px-4 text-center whitespace-normal break-words">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id" class="text-gray-900">
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.student_id }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.last_name }}, {{ student.first_name }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">{{ (coursesMap[student.course_id] && coursesMap[student.course_id].name) || student.course_id || '' }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">{{ student.year_level }}</td>
            <td class="py-2 px-2 sm:px-4 text-center">
              <button @click="openEditModal(student)" class="bg-yellow-400 text-blue-900 px-3 py-1 rounded font-semibold hover:bg-yellow-300 transition mr-1">Edit</button>
              <button @click="confirmDeleteStudent(student)" class="bg-red-400 text-white px-3 py-1 rounded font-semibold hover:bg-red-500 transition">Delete</button>
            </td>
          </tr>
          <tr v-if="students.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-6">No students found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Student Modal -->
    <div v-if="showAddModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl pointer-events-auto relative">
        <h3 class="text-xl font-bold mb-6 text-blue-900">{{ isEditMode ? 'Edit Student' : 'Add Student' }}</h3>
        <div v-if="validationError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {{ validationError }}
        </div>
        <!-- Student ID always visible -->
        <div class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Student ID</label>
          <input v-model="studentForm.student_id" type="text" class="w-full border rounded px-2 py-1 bg-gray-100 font-mono font-semibold" :disabled="true" />
        </div>

        <!-- Steps Content -->
        <!-- 1) Personal -->
        <h3 v-if="currentStep === 0" class="text-lg font-semibold text-blue-900 mb-1">Personal Information</h3>
        <div v-if="currentStep === 0" class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1">First Name<span class="text-red-600">*</span></label>
            <input v-model.trim="freshmanForm.first_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Last Name<span class="text-red-600">*</span></label>
            <input v-model.trim="freshmanForm.last_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Middle Name</label>
            <input v-model.trim="freshmanForm.middle_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Suffix (Optional)</label>
            <input v-model.trim="freshmanForm.suffix" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="10" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Birthdate<span class="text-red-600">*</span></label>
            <input v-model="freshmanForm.birthdate" type="date" class="w-full border rounded px-3 py-1.5 text-sm" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Gender</label>
            <select v-model="freshmanForm.sex" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Civil Status</label>
            <select v-model="freshmanForm.civil_status" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select --</option>
              <option>Single</option>
              <option>Married</option>
              <option>Separated</option>
              <option>Widowed</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Nationality<span class="text-red-600">*</span></label>
            <select v-model="freshmanForm.nationality" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select --</option>
              <option value="Filipino">Filipino</option>
              <option value="American">American</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Indian">Indian</option>
              <option value="Malaysian">Malaysian</option>
              <option value="Indonesian">Indonesian</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Place of Birth</label>
            <input v-model.trim="freshmanForm.place_of_birth" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="150" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Religion</label>
            <select v-model="freshmanForm.religion" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select --</option>
              <option>Roman Catholic</option>
              <option>Protestant</option>
              <option>Iglesia ni Cristo</option>
              <option>Islam</option>
              <option>Buddhist</option>
              <option>Hindu</option>
              <option>Jehovah's Witnesses</option>
              <option>Seventh-day Adventist</option>
              <option>None</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <!-- 2) Contact + Address -->
        <h3 v-if="currentStep === 1" class="text-lg font-semibold text-blue-900 mb-1">Contact Information</h3>
        <div v-if="currentStep === 1" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Email</label>
            <input v-model.trim="freshmanForm.email" type="email" class="w-full border rounded px-2 py-1" maxlength="150" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Mobile</label>
            <input v-model.trim="freshmanForm.mobile" type="text" class="w-full border rounded px-2 py-1" maxlength="11" placeholder="09xxxxxxxxx" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Region Code</label>
            <input v-model.trim="freshmanForm.region_code" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Province Code</label>
            <input v-model.trim="freshmanForm.province_code" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">City/Municipality Code</label>
            <input v-model.trim="freshmanForm.city_code" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Barangay Code</label>
            <input v-model.trim="freshmanForm.barangay_code" type="text" class="w-full border rounded px-2 py-1" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Address Line</label>
            <input v-model.trim="freshmanForm.address_line" type="text" class="w-full border rounded px-2 py-1" maxlength="255" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">ZIP</label>
            <input v-model.trim="freshmanForm.zip" type="text" class="w-full border rounded px-2 py-1" maxlength="10" @input="clearValidationError" />
          </div>
        </div>

        <!-- 3) Parent/Guardian Information -->
        <h3 v-if="currentStep === 2" class="text-lg font-semibold text-blue-900 mb-1">Parent/Guardian Information</h3>
        <div v-if="currentStep === 2" class="mb-4">
          <!-- Father Information -->
          <div class="mb-2">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Father Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Full Name</label>
                <input v-model.trim="freshmanForm.father_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Occupation</label>
                <input v-model.trim="freshmanForm.father_occupation" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Contact Number</label>
                <input v-model.trim="freshmanForm.father_contact" type="tel" inputmode="numeric" pattern="^09\\d{9}$" maxlength="11" class="w-full border rounded px-3 py-1.5 text-sm" placeholder="09XXXXXXXXX" @input="clearValidationError" />
              </div>
            </div>
          </div>

          <!-- Mother Information -->
          <div class="mb-2">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Mother Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Full Name</label>
                <input v-model.trim="freshmanForm.mother_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Occupation</label>
                <input v-model.trim="freshmanForm.mother_occupation" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Contact Number</label>
                <input v-model.trim="freshmanForm.mother_contact" type="tel" inputmode="numeric" pattern="^09\\d{9}$" maxlength="11" class="w-full border rounded px-3 py-1.5 text-sm" placeholder="09XXXXXXXXX" @input="clearValidationError" />
              </div>
            </div>
          </div>

          <!-- Guardian Information -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Guardian Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Full Name</label>
                <input v-model.trim="freshmanForm.guardian_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Relationship</label>
                <select v-model="freshmanForm.guardian_relation" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
                  <option value="">-- Select --</option>
                  <option>Grandparent</option>
                  <option>Sibling</option>
                  <option>Aunt/Uncle</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Contact Number</label>
                <input v-model.trim="freshmanForm.guardian_contact" type="tel" inputmode="numeric" pattern="^09\\d{9}$" maxlength="11" class="w-full border rounded px-3 py-1.5 text-sm" placeholder="09XXXXXXXXX" @input="clearValidationError" />
              </div>
            </div>
          </div>
        </div>

        <!-- 4) Academic Background -->
        <h3 v-if="currentStep === 3" class="text-lg font-semibold text-blue-900 mb-1">Academic Background</h3>
        <div v-if="currentStep === 3" class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1">Senior High School Name</label>
            <input v-model.trim="freshmanForm.shs_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="150" @input="clearValidationError" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Track/Strand</label>
            <input v-model.trim="freshmanForm.shs_track" type="text" class="w-full border rounded px-3 py-1.5 text-sm" maxlength="100" @input="clearValidationError" />
          </div>
        </div>

        <!-- 5) Desired Program -->
        <h3 v-if="currentStep === 4" class="text-lg font-semibold text-blue-900 mb-1">Desired Program</h3>
        <div v-if="currentStep === 4" class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label class="block text-gray-700 mb-1">Course<span class="text-red-600">*</span></label>
            <select v-model="studentForm.course_id" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="" disabled>-- Select --</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Preferred Schedule</label>
            <select v-model="freshmanForm.preferred_sched" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select --</option>
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Admission Type</label>
            <select v-model="freshmanForm.admission_type" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select Type --</option>
              <option>Freshman</option>
              <option>Transferee</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Year Level</label>
            <select v-model="freshmanForm.year_level" :disabled="freshmanForm.admission_type === 'Freshman'" class="w-full border rounded px-3 py-1.5 text-sm" @change="clearValidationError">
              <option value="">-- Select Year --</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </div>
        </div>

        <!-- Step Navigation with centered indicator -->
        <div class="grid grid-cols-3 items-center mb-2">
          <div class="justify-self-start">
            <button class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50" :disabled="currentStep === 0" @click="prevStep">Back</button>
          </div>
          <div class="justify-self-center">
            <div class="flex items-center justify-center gap-2">
              <template v-for="n in stepNames.length" :key="n">
                <div :class="['h-2 rounded-full transition-all', (n-1) <= currentStep ? 'bg-blue-900' : 'bg-blue-100', (n-1) === currentStep ? 'w-10' : 'w-6']"></div>
              </template>
            </div>
          </div>
          <div class="justify-self-end">
            <button v-if="currentStep < stepNames.length - 1" class="px-3 py-1 bg-blue-600 text-white rounded" @click="nextStep">Next</button>
            <span v-else class="text-gray-500 text-sm">Review and click {{ isEditMode ? 'Save Changes' : 'Add Student' }}</span>
          </div>
        </div>
        <div v-if="currentStep >= stepNames.length - 1" class="flex gap-2 justify-end">
          <button
            @click="trySaveStudent"
            :disabled="!isAllValid || (isEditMode && !hasChanges)"
            :class="['px-4 py-2 rounded text-white font-semibold', (!isAllValid || (isEditMode && !hasChanges)) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800']"
          >
            {{ isEditMode ? 'Save Changes' : 'Add Student' }}
          </button>
        </div>
        <button @click="handleCancel" class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
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

    <!-- Confirm Delete Modal -->
    <div v-if="showConfirmDeleteModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border-l-8 border-red-400 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <svg class="w-10 h-10 text-red-400 mb-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div class="mb-4 text-gray-800 text-base font-semibold">Are you sure you want to delete this student?</div>
        <div class="flex gap-2">
          <button @click="cancelDeleteStudent" class="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300 transition">Cancel</button>
          <button @click="confirmDeleteStudentAction" class="px-4 py-2 bg-red-400 text-white rounded font-semibold shadow hover:bg-red-500 transition">Yes, Delete</button>
        </div>
        <button @click="cancelDeleteStudent" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Unsaved Changes Warning Modal -->
    <div v-if="showUnsavedWarningModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-70 pointer-events-auto">
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
    <div v-if="showSaveConfirmModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-sm text-center pointer-events-auto flex flex-col items-center relative">
        <h3 class="text-xl font-bold mb-4 text-blue-900">Confirm Save</h3>
        <p class="mb-4 text-gray-800 text-base">You have unsaved changes. Are you sure you want to save?</p>
        <div class="flex gap-2">
          <button @click="confirmSaveStudent" class="px-4 py-2 bg-blue-900 text-white rounded font-semibold shadow hover:bg-blue-800 transition">Yes, Save</button>
          <button @click="cancelSaveStudent" class="px-4 py-2 bg-gray-300 rounded font-semibold shadow hover:bg-gray-400 transition">Cancel</button>
        </div>
        <button @click="showSaveConfirmModal = false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Pending Freshman Enrollments Modal -->
    <div v-if="showPendingModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-4 sm:p-6 w-auto max-w-[95vw] relative">
        <h3 class="text-lg font-bold text-blue-900 mb-4">Pending Freshman Enrollments</h3>
        <div v-if="pendingLoading" class="text-gray-500 py-4">Loading pending enrollments...</div>
        <div v-else>
          <div v-if="pendingError" class="mb-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{{ pendingError }}</div>
          <div class="overflow-x-auto">
            <table class="min-w-[980px] w-full border text-xs sm:text-sm">
              <thead class="bg-gray-100 text-gray-900">
                <tr>
                  <th class="py-2 px-2 text-center">Name</th>
                  <th class="py-2 px-2 text-center">Email</th>
                  <th class="py-2 px-2 text-center">Mobile</th>
                  <th class="py-2 px-2 text-center">Course</th>
                  <th class="py-2 px-2 text-center">Admission</th>
                  <th class="py-2 px-2 text-center">Year</th>
                  <th class="py-2 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in pendingEnrollments" :key="e.id" class="border-b">
                  <td class="py-2 px-2 text-center">{{ e.last_name }}, {{ e.first_name }}</td>
                  <td class="py-2 px-2 text-center">{{ e.email }}</td>
                  <td class="py-2 px-2 text-center">{{ e.mobile }}</td>
                  <td class="py-2 px-2 text-center">{{ (coursesMap[e.course_id]?.code) || (coursesMap[e.course_id]?.name) || '-' }}</td>
                  <td class="py-2 px-2 text-center">{{ e.admission_type }}</td>
                  <td class="py-2 px-2 text-center">{{ e.year_level }}</td>
                  <td class="py-2 px-2 text-center">
                    <div class="flex gap-2 justify-center">
                      <button @click="viewEnrollment(e)" class="px-2 py-1 bg-blue-100 text-blue-900 rounded hover:bg-blue-200">View</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="pendingEnrollments.length === 0">
                  <td colspan="7" class="text-center text-gray-400 py-6">No pending enrollments found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <button @click="closePendingModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
    
    <!-- Enrollment Details Modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-4 sm:p-6 w-11/12 max-w-3xl relative max-h-[85vh] flex flex-col">
        <h3 class="text-lg font-bold text-blue-900 mb-4">Enrollment Details</h3>
        <div class="overflow-y-auto max-h-[60vh] sm:max-h-[65vh] pr-1">
          <div v-if="detailsLoading" class="text-gray-500">Loading details...</div>
          <div v-else-if="!selectedEnrollment" class="text-gray-500">No data.</div>
          <div v-else class="space-y-6 text-sm">
            <!-- Personal -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Personal</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">Name</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.last_name }}, {{ selectedEnrollment.first_name }} <span v-if="selectedEnrollment.middle_name">{{ selectedEnrollment.middle_name }}</span></div>
                <div class="text-gray-500">Birthdate</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.birthdate }}</div>
                <div class="text-gray-500">Gender</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.sex }}</div>
                <div class="text-gray-500">Civil Status</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.civil_status }}</div>
                <div class="text-gray-500">Nationality</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.nationality }}</div>
                <div class="text-gray-500">Religion</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.religion }}</div>
                <div class="text-gray-500">Admission Type</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.admission_type }}</div>
              </div>
            </div>

            <!-- Contact -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Contact</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">Address</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.address_line }}, {{ selectedEnrollment.barangay }}, {{ selectedEnrollment.city }}, {{ selectedEnrollment.province }} ({{ selectedEnrollment.zip }})</div>
                <div class="text-gray-500">Email</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.email }}</div>
                <div class="text-gray-500">Mobile</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.mobile }}</div>
              </div>
            </div>

            <!-- Father -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Father</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">Name</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.father_name }}</div>
                <div class="text-gray-500">Occupation</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.father_occupation || '-' }}</div>
                <div class="text-gray-500">Contact</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.father_contact || '-' }}</div>
              </div>
            </div>

            <!-- Mother -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Mother</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">Name</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.mother_name }}</div>
                <div class="text-gray-500">Occupation</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.mother_occupation || '-' }}</div>
                <div class="text-gray-500">Contact</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.mother_contact || '-' }}</div>
              </div>
            </div>

            <!-- Guardian -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Guardian</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">Name</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.guardian_name }}</div>
                <div class="text-gray-500">Relationship</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.guardian_relation }}</div>
                <div class="text-gray-500">Contact</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.guardian_contact || '-' }}</div>
              </div>
            </div>

            <!-- Academics -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Academics</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">SHS</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.shs_name || '-' }}<span v-if="selectedEnrollment.shs_track"> | {{ selectedEnrollment.shs_track }}</span></div>
              </div>
            </div>

            <!-- Preferences -->
            <div>
              <h4 class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Preferences</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-1">
                <div class="text-gray-500">Course</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ (coursesMap[selectedEnrollment.course_id]?.name) || selectedEnrollment.course_id || '-' }}</div>
                <div class="text-gray-500">Year Level</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.year_level || '-' }}</div>
                <div class="text-gray-500">Preferred Schedule</div>
                <div class="col-span-1 sm:col-span-2 text-gray-900">{{ selectedEnrollment.preferred_sched || '-' }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex gap-2 justify-end">
          <button @click="showDetailsModal=false" class="px-4 py-2 bg-gray-200 rounded">Close</button>
          <button v-if="selectedEnrollment" @click="acceptEnrollment(selectedEnrollment.id)" class="px-4 py-2 bg-emerald-600 text-white rounded">Accept</button>
          <button v-if="selectedEnrollment" @click="rejectEnrollment(selectedEnrollment.id)" class="px-4 py-2 bg-red-500 text-white rounded">Reject</button>
        </div>
        <button @click="showDetailsModal=false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const students = ref([])
const courses = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const isEditMode = ref(false)
const showNotifModal = ref(false)
const notifMessage = ref('')
const showConfirmDeleteModal = ref(false)
const validationError = ref('')
const studentForm = ref({
  student_id: '', first_name: '', middle_name: '', last_name: '', suffix: '',
  gender: '', address: '', contact_number: '', email: '',
  course_id: '', year_level: ''
})

// Freshman Enrollment full form (parity with FreshmanEnrollment.vue)
const freshmanForm = ref({
  // Personal
  first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', sex: '', civil_status: '', nationality: '', religion: '', place_of_birth: '',
  // Contact + PSGC
  email: '', mobile: '', region_code: '', province_code: '', city_code: '', barangay_code: '', region: '', province: '', city: '', barangay: '', address_line: '', zip: '',
  // Guardian
  father_name: '', father_occupation: '', father_contact: '',
  mother_name: '', mother_occupation: '', mother_contact: '',
  guardian_name: '', guardian_relation: '', guardian_contact: '',
  // Academic/Program
  shs_name: '', shs_track: '', preferred_sched: '', year_level: '', admission_type: 'Freshman',
})
const originalStudentData = ref(null)
const originalFreshmanData = ref(null)

// Unsaved changes warning modal state
const showUnsavedWarningModal = ref(false)

// Stepper state (match Freshman Enrollment steps)
const stepNames = ['Personal', 'Contact & Address', 'Guardian Info', 'Academic', 'Program']
const currentStep = ref(0)
const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === stepNames.length - 1)
function nextStep() { if (!isLastStep.value) currentStep.value++ }
function prevStep() { if (!isFirstStep.value) currentStep.value-- }

// Computed property to check if student data has changed
const hasStudentChanges = computed(() => {
  if (!originalStudentData.value || !isEditMode.value) return false
  
  return (
    studentForm.value.first_name !== originalStudentData.value.first_name ||
    studentForm.value.last_name !== originalStudentData.value.last_name ||
    studentForm.value.middle_name !== originalStudentData.value.middle_name ||
    studentForm.value.suffix !== originalStudentData.value.suffix ||
    studentForm.value.gender !== originalStudentData.value.gender ||
    studentForm.value.address !== originalStudentData.value.address ||
    studentForm.value.contact_number !== originalStudentData.value.contact_number ||
    studentForm.value.email !== originalStudentData.value.email ||
    studentForm.value.course_id !== originalStudentData.value.course_id ||
    studentForm.value.year_level !== originalStudentData.value.year_level
  )
})

// Computed property to check if freshman enrollment data has changed
const hasFreshmanChanges = computed(() => {
  if (!originalFreshmanData.value || !isEditMode.value) return false
  const f = freshmanForm.value
  const o = originalFreshmanData.value
  return (
    // Personal
    f.first_name !== o.first_name ||
    f.middle_name !== o.middle_name ||
    f.last_name !== o.last_name ||
    f.suffix !== o.suffix ||
    f.birthdate !== o.birthdate ||
    f.sex !== o.sex ||
    f.civil_status !== o.civil_status ||
    f.nationality !== o.nationality ||
    f.place_of_birth !== o.place_of_birth ||
    f.religion !== o.religion ||
    // Contact + PSGC
    f.email !== o.email ||
    f.mobile !== o.mobile ||
    f.region_code !== o.region_code ||
    f.province_code !== o.province_code ||
    f.city_code !== o.city_code ||
    f.barangay_code !== o.barangay_code ||
    f.region !== o.region ||
    f.province !== o.province ||
    f.city !== o.city ||
    f.barangay !== o.barangay ||
    f.address_line !== o.address_line ||
    f.zip !== o.zip ||
    // Guardian
    f.father_name !== o.father_name ||
    f.father_occupation !== o.father_occupation ||
    f.father_contact !== o.father_contact ||
    f.mother_name !== o.mother_name ||
    f.mother_occupation !== o.mother_occupation ||
    f.mother_contact !== o.mother_contact ||
    f.guardian_name !== o.guardian_name ||
    f.guardian_relation !== o.guardian_relation ||
    f.guardian_contact !== o.guardian_contact ||
    // Academic/Program
    f.shs_name !== o.shs_name ||
    f.shs_track !== o.shs_track ||
    f.preferred_sched !== o.preferred_sched ||
    f.year_level !== o.year_level ||
    f.admission_type !== o.admission_type ||
    f.course_id !== o.course_id
  )
})

// Combined change detection for edit mode
const hasChanges = computed(() => hasStudentChanges.value || hasFreshmanChanges.value)

// Live validity state to control Save button enabling
const isFormValid = computed(() => {
  const f = studentForm.value || {}
  const nameRe = /^[A-Za-z ]+$/
  const phoneRe = /^(09\d{9}|\d{10,11})$/
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const first = (f.first_name || '').trim()
  const middle = (f.middle_name || '').trim()
  const last = (f.last_name || '').trim()
  const gender = (f.gender || '').trim()
  const address = (f.address || '').trim()
  const contact = (f.contact_number || '').trim()
  const email = (f.email || '').trim()
  const year = (f.year_level || '').trim()
  const course = f.course_id

  if (!first || !nameRe.test(first)) return false
  if (!last || !nameRe.test(last)) return false
  if (middle && !nameRe.test(middle)) return false
  if (!gender) return false
  if (!address) return false
  if (!contact || !phoneRe.test(contact)) return false
  if (!email || !emailRe.test(email)) return false
  if (!year) return false
  if (!course) return false
  return true
})

// Live validity for freshman form (non-mutating; separate from validateFreshmanForm())
const isFreshmanValid = computed(() => {
  const f = freshmanForm.value || {}
  const nameRe = /^[A-Za-z .'-]+$/
  const phoneRe = /^(09\d{9})$/
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const first = (f.first_name || '').trim()
  const middle = (f.middle_name || '').trim()
  const last = (f.last_name || '').trim()
  if (!first || !nameRe.test(first)) return false
  if (!last || !nameRe.test(last)) return false
  if (middle && !nameRe.test(middle)) return false
  if (!f.birthdate) return false
  if (!(f.sex || '').trim()) return false
  if (!(f.civil_status || '').trim()) return false

  const email = (f.email || '').trim()
  const mobile = (f.mobile || '').trim()
  if (!email || !emailRe.test(email)) return false
  if (!mobile || !phoneRe.test(mobile)) return false
  if (!(f.address_line || '').trim()) return false

  if (!(f.year_level || '').trim()) return false
  const course = studentForm.value?.course_id || f.course_id
  if (!course) return false
  if (!(f.admission_type || '').trim()) return false
  return true
})

// Overall validity to control Save button
const isAllValid = computed(() => isFormValid.value && isFreshmanValid.value)

// Function to handle cancel with unsaved changes check
function handleCancel() {
  if (isEditMode.value && hasChanges.value) {
    showUnsavedWarningModal.value = true
  } else {
    closeAddModal()
  }
}

// Function to confirm cancel (when user clicks "Yes, Cancel")
function confirmCancel() {
  showUnsavedWarningModal.value = false
  closeAddModal()
}

function clearValidationError() {
  validationError.value = ''
}
const studentToEdit = ref(null)
const studentToDelete = ref(null)

function fetchStudents() {
  loading.value = true
  fetch('http://localhost:5000/api/admin/freshman-enrollments?status=accepted', {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      students.value = data
      loading.value = false
    })
    .catch(() => {
      notifMessage.value = 'Failed to fetch accepted freshman enrollments.'
      showNotifModal.value = true
      loading.value = false
    })
}

function fetchCourses() {
  fetch('http://localhost:5000/api/admin/courses', {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      courses.value = data
    })
    .catch(() => {
      notifMessage.value = 'Failed to fetch courses.'
      showNotifModal.value = true
    })
}

async function openAddModal() {
  isEditMode.value = false
  currentStep.value = 0
  validationError.value = ''
  studentForm.value = { student_id: '', first_name: '', middle_name: '', last_name: '', suffix: '', gender: '', address: '', contact_number: '', email: '', course_id: '', year_level: '' }
  freshmanForm.value = {
    first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', sex: '', civil_status: '', nationality: '', place_of_birth: '', religion: '',
    email: '', mobile: '', region_code: '', province_code: '', city_code: '', barangay_code: '', region: '', province: '', city: '', barangay: '', address_line: '', zip: '',
    father_name: '', father_occupation: '', father_contact: '',
    mother_name: '', mother_occupation: '', mother_contact: '',
    guardian_name: '', guardian_relation: '', guardian_contact: '',
    shs_name: '', shs_track: '', preferred_sched: '', year_level: '', admission_type: 'Freshman',
  }
  // Fetch next student ID from backend
  try {
    const res = await fetch('http://localhost:5000/api/admin/students/next-id', {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    });
    const data = await res.json();
    studentForm.value.student_id = data.nextId;
  } catch (e) {
    studentForm.value.student_id = '';
  }
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false
  isEditMode.value = false
  validationError.value = ''
  studentForm.value = { student_id: '', first_name: '', last_name: '', middle_name: '', suffix: '', gender: '', address: '', contact_number: '', email: '', course_id: '', year_level: '' }
  originalStudentData.value = null
}

function saveStudent() {
  // Only check for required fields except student_id (which is auto-filled and disabled)

  // If student_id is still empty, show error
  if (!studentForm.value.student_id) {
    validationError.value = 'Student ID could not be generated.';
    return;
  }
  const method = isEditMode.value ? 'PUT' : 'POST'
  const url = isEditMode.value
    ? `http://localhost:5000/api/admin/students/${studentForm.value.student_id}`
    : 'http://localhost:5000/api/admin/students'
  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
    },
    body: JSON.stringify(studentForm.value)
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        validationError.value = data.error
        return
      }
      // On success, sync to freshman_enrollments
      const payload = buildFreshmanPayload()
      if (!isEditMode.value) {
        // Create
        payload.student_id = studentForm.value.student_id
        payload.course_id = studentForm.value.course_id || null
        payload.year_level = studentForm.value.year_level || freshmanForm.value.year_level
        return fetch('http://localhost:5000/api/admin/freshman-enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
          },
          body: JSON.stringify(payload)
        }).then(r => r.json()).then(() => {
          showAddModal.value = false
          fetchStudents()
          notifMessage.value = 'Student added!'
          showNotifModal.value = true
        }).catch(() => {
          // Still close modal but report warning
          showAddModal.value = false
          fetchStudents()
          notifMessage.value = 'Student added, but failed to save freshman details.'
          showNotifModal.value = true
        })
      } else {
        // Update by student_id
        payload.course_id = studentForm.value.course_id || null
        payload.year_level = studentForm.value.year_level || payload.year_level
        return fetch(`http://localhost:5000/api/admin/freshman-enrollments/by-student/${studentForm.value.student_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
          },
          body: JSON.stringify(payload)
        }).then(() => {
          showAddModal.value = false
          fetchStudents()
          notifMessage.value = 'Student updated!'
          showNotifModal.value = true
        }).catch(() => {
          showAddModal.value = false
          fetchStudents()
          notifMessage.value = 'Student updated, but failed to sync freshman details.'
          showNotifModal.value = true
        })
      }
    })
    .catch(() => {
      validationError.value = 'Failed to save student.'
    })
}

// Build payload matching backend freshman_enrollments schema
function buildFreshmanPayload() {
  const s = studentForm.value
  const f = freshmanForm.value
  // Map existing modal fields to freshman payload; rest taken from freshmanForm
  return {
    first_name: f.first_name || s.first_name,
    middle_name: f.middle_name || s.middle_name || '',
    last_name: f.last_name || s.last_name,
    suffix: f.suffix || s.suffix || '',
    birthdate: f.birthdate || '',
    sex: f.sex || s.gender || '',
    civil_status: f.civil_status || '',
    nationality: f.nationality || '',
    place_of_birth: f.place_of_birth || '',
    religion: f.religion || '',
    email: f.email || s.email || '',
    mobile: f.mobile || s.contact_number || '',
    region_code: f.region_code || '',
    province_code: f.province_code || '',
    city_code: f.city_code || '',
    barangay_code: f.barangay_code || '',
    region: f.region || '',
    province: f.province || '',
    city: f.city || '',
    barangay: f.barangay || '',
    address_line: f.address_line || s.address || '',
    zip: f.zip || '',
    father_name: f.father_name || '',
    father_occupation: f.father_occupation || '',
    father_contact: f.father_contact || '',
    mother_name: f.mother_name || '',
    mother_occupation: f.mother_occupation || '',
    mother_contact: f.mother_contact || '',
    guardian_name: f.guardian_name || '',
    guardian_relation: f.guardian_relation || '',
    guardian_contact: f.guardian_contact || '',
    shs_name: f.shs_name || '',
    shs_track: f.shs_track || '',
    preferred_sched: f.preferred_sched || '',
    year_level: f.year_level || s.year_level || '',
    admission_type: f.admission_type || 'Freshman',
    consent: !!f.consent,
  }
}

async function openEditModal(student) {
  isEditMode.value = true
  currentStep.value = 0
  validationError.value = ''
  studentForm.value = { ...student }
  originalStudentData.value = { ...student } // Store original data

  // Initialize freshmanForm with defaults first while we fetch details
  freshmanForm.value = {
    // Personal
    first_name: student.first_name || '',
    middle_name: student.middle_name || '',
    last_name: student.last_name || '',
    suffix: student.suffix || '',
    birthdate: '',
    sex: student.gender || '',
    civil_status: '',
    nationality: '',    place_of_birth: '',
    religion: '',
    // Contact + PSGC
    email: student.email || '',
    mobile: student.contact_number || '',
    region_code: '', province_code: '', city_code: '', barangay_code: '',
    region: '', province: '', city: '', barangay: '', address_line: '', zip: '',
    // Guardian
    father_name: '', father_occupation: '', father_contact: '',
    mother_name: '', mother_occupation: '', mother_contact: '',
    guardian_name: '', guardian_relation: '', guardian_contact: '',
    // Academic/Program
    shs_name: '', shs_track: '', preferred_sched: '',
    year_level: student.year_level || '',
    admission_type: 'Freshman',
    course_id: student.course_id || '',
    // Consent
    consent: false,
  }
  originalFreshmanData.value = null

  showAddModal.value = true

  // Fetch freshman enrollment by student_id (if exists) to populate the form
  try {
    const res = await fetch(`http://localhost:5000/api/admin/freshman-enrollments/by-student/${student.student_id}` , {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    })
    if (!res.ok) {
      // 404 means no existing freshman record; keep defaults
      if (res.status === 404) return
      // For 401 or other errors, surface a message but keep editing possible
      const errData = await res.json().catch(() => ({}))
      validationError.value = errData.error || 'Failed to load freshman details.'
      return
    }
    const data = await res.json()
    if (data && !data.error) {
      // Map API response to freshmanForm, preserving types
      freshmanForm.value = {
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        suffix: data.suffix || '',
        birthdate: data.birthdate || '',
        sex: data.sex || data.gender || '',
        civil_status: data.civil_status || '',
        nationality: data.nationality || '',
        citizenship: data.citizenship || '',
        place_of_birth: data.place_of_birth || '',
        religion: data.religion || '',
        email: data.email || student.email || '',
        mobile: data.mobile || data.contact_number || student.contact_number || '',
        region_code: data.region_code || '',
        province_code: data.province_code || '',
        city_code: data.city_code || '',
        barangay_code: data.barangay_code || '',
        region: data.region || '',
        province: data.province || '',
        city: data.city || '',
        barangay: data.barangay || '',
        address_line: data.address_line || '',
        zip: data.zip || '',
        father_name: data.father_name || '',
        father_occupation: data.father_occupation || '',
        father_contact: data.father_contact || '',
        mother_name: data.mother_name || '',
        mother_occupation: data.mother_occupation || '',
        mother_contact: data.mother_contact || '',
        guardian_name: data.guardian_name || '',
        guardian_relation: data.guardian_relation || '',
        guardian_contact: data.guardian_contact || '',
        shs_name: data.shs_name || '',
        shs_track: data.shs_track || '',
        preferred_sched: data.preferred_sched || '',
        year_level: data.year_level || student.year_level || '',
        admission_type: data.admission_type || 'Freshman',
        course_id: data.course_id || student.course_id || '',
      }
      originalFreshmanData.value = { ...freshmanForm.value }
    }
  } catch (e) {
    // Network or unexpected errors
    validationError.value = 'Failed to load freshman details.'
  }
}

function confirmDeleteStudent(student) {
  studentToDelete.value = student
  showConfirmDeleteModal.value = true
}

function cancelDeleteStudent() {
  studentToDelete.value = null
  showConfirmDeleteModal.value = false
}

function confirmDeleteStudentAction() {
  if (!studentToDelete.value) return
  fetch(`http://localhost:5000/api/admin/students/${studentToDelete.value.student_id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      showConfirmDeleteModal.value = false
      if (data.error) {
        notifMessage.value = data.error
        showNotifModal.value = true
        return
      }
      fetchStudents()
      notifMessage.value = 'Student deleted!'
      showNotifModal.value = true
    })
    .catch(() => {
      notifMessage.value = 'Failed to delete student.'
      showNotifModal.value = true
    })
}

const showSaveConfirmModal = ref(false)

// Pending freshman enrollments modal state
const showPendingModal = ref(false)
const pendingLoading = ref(false)
const pendingError = ref('')
const pendingEnrollments = ref([])
const showDetailsModal = ref(false)
const selectedEnrollment = ref(null)
const detailsLoading = ref(false)
const coursesMap = ref({})

function openPendingModal() {
  pendingError.value = ''
  showPendingModal.value = true
  fetchPendingEnrollments()
}

function closePendingModal() {
  showPendingModal.value = false
}

function fetchPendingEnrollments() {
  pendingLoading.value = true
  fetch('http://localhost:5000/api/admin/freshman-enrollments?status=pending', {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        pendingError.value = data.error
        pendingEnrollments.value = []
      } else {
        pendingEnrollments.value = Array.isArray(data) ? data : []
      }
      pendingLoading.value = false
    })
    .catch(() => {
      pendingError.value = 'Failed to fetch pending enrollments.'
      pendingEnrollments.value = []
      pendingLoading.value = false
    })
}

function viewEnrollment(e) {
  if (!e || !e.id) return
  showDetailsModal.value = true
  detailsLoading.value = true
  selectedEnrollment.value = null
  fetch(`http://localhost:5000/api/admin/freshman-enrollments/${e.id}`, {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data && !data.error) {
        selectedEnrollment.value = data
      }
      detailsLoading.value = false
    })
    .catch(() => {
      detailsLoading.value = false
    })
}

function acceptEnrollment(id) {
  if (!id) return
  if (!confirm('Accept this enrollment?')) return
  fetch(`http://localhost:5000/api/admin/freshman-enrollments/${id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        pendingError.value = data.error
        return
      }
      // Refresh pending and accepted lists and close details if open
      fetchPendingEnrollments()
      fetchStudents()
      showDetailsModal.value = false
      const code = data.student_code || data.student_id
      const dbid = data.student_db_id
      notifMessage.value = code
        'Enrollment accepted.'
      showNotifModal.value = true
    })
    .catch(() => {
      pendingError.value = 'Failed to accept enrollment.'
    })
}

function rejectEnrollment(id) {
  if (!id) return
  if (!confirm('Reject this enrollment?')) return
  fetch(`http://localhost:5000/api/admin/freshman-enrollments/${id}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        pendingError.value = data.error
        return
      }
      // Refresh list and close details if open
      fetchPendingEnrollments()
      showDetailsModal.value = false
    })
    .catch(() => {
      pendingError.value = 'Failed to reject enrollment.'
    })
}

function trySaveStudent() {
  // Validate before proceeding
  if (!validateStudentForm()) return
  if (!validateFreshmanForm()) return
  // Only show confirmation in edit mode
  if (isEditMode.value) {
    showSaveConfirmModal.value = true
  } else {
    saveStudent()
  }
}

function confirmSaveStudent() {
  showSaveConfirmModal.value = false
  if (!validateStudentForm()) return
  if (!validateFreshmanForm()) return
  saveStudent()
}

function cancelSaveStudent() {
  showSaveConfirmModal.value = false
}

// Validation aligned with Freshman Enrollment form
function validateStudentForm() {
  const f = studentForm.value
  const nameRe = /^[A-Za-z ]+$/
  const phoneRe = /^(09\d{9}|\d{10,11})$/
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Trim key fields
  f.first_name = (f.first_name || '').trim()
  f.middle_name = (f.middle_name || '').trim()
  f.last_name = (f.last_name || '').trim()
  f.suffix = (f.suffix || '').trim()
  f.address = (f.address || '').trim()
  f.contact_number = (f.contact_number || '').trim()
  f.email = (f.email || '').trim()

  if (!f.first_name) { validationError.value = 'First name is required.'; return false }
  if (!nameRe.test(f.first_name)) { validationError.value = 'First name should contain letters and spaces only.'; return false }
  if (!f.last_name) { validationError.value = 'Last name is required.'; return false }
  if (!nameRe.test(f.last_name)) { validationError.value = 'Last name should contain letters and spaces only.'; return false }
  if (f.middle_name && !nameRe.test(f.middle_name)) { validationError.value = 'Middle name should contain letters and spaces only.'; return false }
  if (!f.gender) { validationError.value = 'Please select a gender.'; return false }
  if (!f.address) { validationError.value = 'Address is required.'; return false }
  if (!f.contact_number) { validationError.value = 'Contact number is required.'; return false }
  if (!phoneRe.test(f.contact_number)) { validationError.value = 'Enter a valid contact number.'; return false }
  if (!f.email) { validationError.value = 'Email is required.'; return false }
  if (!emailRe.test(f.email)) { validationError.value = 'Enter a valid email address.'; return false }
  if (!f.year_level) { validationError.value = 'Please select a year level.'; return false }
  if (!f.course_id) { validationError.value = 'Please select a course.'; return false }

  validationError.value = ''
  return true
}

// Validation for Freshman Enrollment sections (aligned with student form and FE form)
function validateFreshmanForm() {
  const f = freshmanForm.value
  const nameRe = /^[A-Za-z .'-]+$/
  const phoneRe = /^(09\d{9})$/
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Trim some text fields used in validation
  f.first_name = (f.first_name || '').trim()
  f.middle_name = (f.middle_name || '').trim()
  f.last_name = (f.last_name || '').trim()
  f.suffix = (f.suffix || '').trim()
  f.email = (f.email || '').trim()
  f.mobile = (f.mobile || '').trim()
  f.address_line = (f.address_line || '').trim()

  if (!f.first_name || !nameRe.test(f.first_name)) { validationError.value = 'First name is required (letters, spaces, .\'- allowed).'; return false }
  if (!f.last_name || !nameRe.test(f.last_name)) { validationError.value = 'Last name is required (letters, spaces, .\'- allowed).'; return false }
  if (f.middle_name && !nameRe.test(f.middle_name)) { validationError.value = 'Middle name contains invalid characters.'; return false }
  if (!f.birthdate) { validationError.value = 'Birthdate is required.'; return false }
  if (!f.sex) { validationError.value = 'Sex is required.'; return false }
  if (!f.civil_status) { validationError.value = 'Civil status is required.'; return false }

  if (!f.email || !emailRe.test(f.email)) { validationError.value = 'Enter a valid email address.'; return false }
  if (!f.mobile || !phoneRe.test(f.mobile)) { validationError.value = 'Enter a valid mobile number (09xxxxxxxxx).'; return false }
  if (!f.address_line) { validationError.value = 'Address Line is required.'; return false }

  // Program requirements
  if (!f.year_level) { validationError.value = 'Please select a year level.'; return false }
  if (!f.course_id) { validationError.value = 'Please select a course.'; return false }
  if (!f.admission_type) { validationError.value = 'Please select an admission type.'; return false }

  // Consent must be checked similar to FE form
  if (!f.consent) { validationError.value = 'Please confirm the accuracy of the information (consent).'; return false }

  validationError.value = ''
  return true
}

function loadCourses() {
  fetch('/api/public/courses')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error(data.error)
      } else {
        const map = {}
        data.forEach(course => {
          map[course.id] = { name: course.name, code: course.code }
        })
        coursesMap.value = map
      }
    })
    .catch(() => {
      console.error('Failed to load courses')
    })
}

onMounted(() => {
  fetchStudents()
  loadCourses()
})
</script>
