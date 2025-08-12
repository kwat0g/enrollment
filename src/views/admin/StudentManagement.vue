<template>
  <div class="w-full min-w-0 px-2 sm:px-6 pt-5">
    <h2 class="text-base sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Student Management</h2>
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 w-full">
      <button @click="openAddModal" class="bg-blue-900 text-white px-4 py-2 rounded font-semibold hover:bg-blue-800 transition">Add Student</button>
      <button @click="openPendingModal" class="bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-500 transition">Show Pending Enrollment</button>
      <button @click="openProcessingModal" class="bg-yellow-600 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-500 transition">Show Processing Enrollment</button>
    </div>
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading students...</div>
    <div v-else class="overflow-x-auto overflow-y-visible bg-white rounded-xl shadow-lg p-2 sm:p-6 w-full min-w-0 max-w-full">
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
            <td class="py-2 px-2 sm:px-4 text-center overflow-y-visible">
              <div class="relative inline-block text-left" @click.stop>
                <button @click.stop="toggleActionMenu(student.id, $event)" class="px-3 py-1 bg-gray-100 text-gray-800 rounded font-semibold hover:bg-gray-200 border">
                  Actions ▾
                </button>
                <!-- Menu rendered via Teleport to avoid clipping -->
              </div>
            </td>
          </tr>
          <tr v-if="students.length === 0">
            <td colspan="5" class="text-center text-gray-400 py-6">No students found.</td>
          </tr>
        </tbody>
      </table>
      <!-- Teleported Actions Menu -->
      <teleport to="body">
        <!-- backdrop to catch outside clicks on body level -->
        <div v-if="openActionFor !== null" class="fixed inset-0 z-40" @click="openActionFor=null"></div>
        <div
          v-if="openActionFor !== null"
          class="fixed z-50 w-44 bg-white border border-gray-200 rounded shadow-lg"
          :style="{ top: actionMenuPos.y + 'px', left: actionMenuPos.x + 'px' }"
          @click.stop
        >
          <button
            class="w-full text-center px-3 py-2 hover:bg-gray-50"
            @click="openActionFor=null; (adminHasActiveEnrollment(actionMenuStudent) ? openViewRegForm(actionMenuStudent) : openAdminEnroll(actionMenuStudent))"
          >
            {{ adminHasActiveEnrollment(actionMenuStudent) ? 'View Reg Form' : 'Enroll' }}
          </button>
          <button class="w-full text-center px-3 py-2 hover:bg-gray-50" @click="openActionFor=null; openDocumentsModal(actionMenuStudent)">Documents</button>
          <button class="w-full text-center px-3 py-2 hover:bg-gray-50" @click="openActionFor=null; openEditModal(actionMenuStudent)">Edit</button>
          <button class="w-full text-center px-3 py-2 text-red-600 hover:bg-red-50" @click="openActionFor=null; confirmDeleteStudent(actionMenuStudent)">Delete</button>
        </div>
      </teleport>
    </div>

    <!-- Documents Modal -->
    <div v-if="showDocsModal" class="fixed left-0 top-0 w-full h-full flex items-center justify-center z-60 pointer-events-auto">
      <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-md pointer-events-auto relative">
        <h3 class="text-lg font-bold mb-2 text-blue-900">Documents Submitted</h3>
        <p class="text-xs text-gray-600 mb-3">Tick the documents the student submitted. Unticked items are considered <strong>To follow up</strong>.</p>
        <div v-if="docsError" class="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{{ docsError }}</div>
        <div class="space-y-2 mb-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="docsForm.psa" /> PSA (Birth Certificate)
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="docsForm.form138" /> Form 138 (Report Card) - Freshman
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="docsForm.good_moral" /> Good Moral Certificate - Freshman
          </label>
          <label v-if="showTor" class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="docsForm.tor" /> TOR - Transferee
          </label>
          <div>
            <label class="block text-sm text-gray-700 mb-1">Notes</label>
            <textarea v-model="docsForm.notes" rows="3" class="w-full border rounded px-2 py-1 text-sm" placeholder="Optional notes or follow-up details"></textarea>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button @click="closeDocumentsModal" class="px-4 py-2 bg-gray-200 rounded">Close</button>
          <button :disabled="docsSaving" @click="saveDocuments" class="px-4 py-2 bg-blue-900 text-white rounded">{{ docsAfterSaveAction === 'accept' ? (docsSaving ? 'Saving...' : 'Save & Continue') : (docsSaving ? 'Saving...' : 'Save') }}</button>
        </div>
        <button @click="closeDocumentsModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- View Registration Form Modal -->
    <div v-if="showRegFormModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl relative">
        <h3 class="text-xl font-bold mb-4 text-blue-900">Registration Form</h3>

        <div v-if="regFormError" class="mb-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{{ regFormError }}</div>
        <div v-if="regFormLoading" class="text-gray-500 py-6 text-center">Loading registration form...</div>

        <div v-else-if="selectedEnrollment" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-xs uppercase tracking-wide text-gray-500">Student</div>
              <div class="text-gray-900 font-semibold">{{ selectedEnrollment.last_name }}, {{ selectedEnrollment.first_name }} {{ selectedEnrollment.middle_name || '' }}</div>
              <div class="text-sm text-gray-700">ID: {{ selectedEnrollment.student_id }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-gray-500">Program</div>
              <div class="text-gray-900 font-semibold">{{ (coursesMap[selectedEnrollment.course_id] && coursesMap[selectedEnrollment.course_id].name) || selectedEnrollment.course_id }}</div>
              <div class="text-sm text-gray-700">Year Level: {{ selectedEnrollment.year_level }}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="text-xs uppercase tracking-wide text-gray-500">Admission Type</div>
              <div class="text-gray-900 font-medium">{{ selectedEnrollment.admission_type || '—' }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-gray-500">Status</div>
              <div>
                <span class="inline-block px-2 py-0.5 rounded text-xs"
                      :class="{
                        'bg-yellow-100 text-yellow-800': (selectedEnrollment.status || '').toLowerCase()==='pending' || (selectedEnrollment.status || '').toLowerCase()==='processing',
                        'bg-emerald-100 text-emerald-800': (selectedEnrollment.status || '').toLowerCase()==='approved',
                        'bg-gray-100 text-gray-800': !(selectedEnrollment.status)
                      }">
                  {{ (selectedEnrollment.status || '').toString() || 'N/A' }}
                </span>
              </div>
            </div>
          </div>

          <div class="border rounded-md mt-2">
            <div class="bg-blue-50 text-blue-900 font-semibold px-3 py-2 rounded-t-md">Submitted Documents</div>
            <div class="p-3">
              <ul class="list-disc list-inside text-sm text-gray-800 space-y-1">
                <li>PSA: <strong>{{ (selectedEnrollment.documents && (selectedEnrollment.documents.psa ?? false)) ? 'Yes' : 'To follow up' }}</strong></li>
                <li>Form 138 (Freshman): <strong>{{ (selectedEnrollment.documents && (selectedEnrollment.documents.form138 ?? false)) ? 'Yes' : 'To follow up' }}</strong></li>
                <li>Good Moral (Freshman): <strong>{{ (selectedEnrollment.documents && (selectedEnrollment.documents.good_moral ?? false)) ? 'Yes' : 'To follow up' }}</strong></li>
                <li v-if="(selectedEnrollment.admission_type || '').toLowerCase()==='transferee'">TOR: <strong>{{ (selectedEnrollment.documents && (selectedEnrollment.documents.tor ?? false)) ? 'Yes' : 'To follow up' }}</strong></li>
                <li v-if="selectedEnrollment.documents && selectedEnrollment.documents.notes">Notes: <span class="text-gray-600">{{ selectedEnrollment.documents.notes }}</span></li>
              </ul>
            </div>
          </div>

          <div class="border-t pt-3">
            <div class="text-sm font-semibold text-gray-700 mb-2">Section & Schedule</div>
            <div class="text-sm text-gray-800">
              <div>Section: <strong>{{ selectedEnrollment.section_name || selectedEnrollment.section || '—' }}</strong></div>
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <button @click="closeRegFormModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold text-sm">Close</button>
          <button
            class="px-3 py-2 bg-blue-900 text-white rounded disabled:opacity-50 text-sm"
            :disabled="!(selectedEnrollment && Array.isArray(selectedEnrollment.schedules) && selectedEnrollment.schedules.length)"
            @click="openScheduleModal()"
          >
            Show Schedule
          </button>
        </div>

        <button @click="closeRegFormModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Schedule Modal (from Registration Form) -->
    <div v-if="showScheduleModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl relative">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-blue-900">Student Schedule</h3>
        </div>

          <!-- Registration Form Header and Subject Table as one scrollable unit -->
          <table class="min-w-[600px] w-full border text-xs sm:text-sm mb-4">
            <tbody>
              <tr>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Student No.</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ scheduleStudentInfo.student_no || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Last Name</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ selectedEnrollment.last_name || selectedEnrollment.lastname || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">First Name</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ selectedEnrollment.first_name || selectedEnrollment.firstname || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Middle Name</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ selectedEnrollment.middle_name || selectedEnrollment.middlename || '—' }}</td>
              </tr>
              <tr>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Address</td>
                <td class="border px-2 py-1 whitespace-normal break-words" colspan="3">{{ scheduleStudentInfo.address || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Contact No.</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ scheduleStudentInfo.contact || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Gender</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ scheduleStudentInfo.gender || '—' }}</td>
              </tr>
              <tr>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Course</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ selectedCourseCode || selectedEnrollment.course_code || selectedEnrollment.course_id || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Year Level</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ selectedEnrollment.year_level || selectedEnrollment.year || '—' }}</td>
                <td class="border px-2 py-1 font-semibold whitespace-normal break-words">Semester</td>
                <td class="border px-2 py-1 whitespace-normal break-words" colspan="3">{{ scheduleStudentInfo.term || '1st Semester' }}</td>
              </tr>
            </tbody>
          </table>

        <div v-if="!groupedSchedule || groupedSchedule.length === 0" class="text-gray-500 py-6 text-center">
          No schedule available
        </div>

        <div v-else class="overflow-x-auto">
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
              <tr v-for="item in (selectedEnrollment && Array.isArray(selectedEnrollment.schedules) ? selectedEnrollment.schedules : [])" :key="item.id">
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.subject_code || item.code }}</td>
                <td class="border px-2 py-1 whitespace-normal break-words">{{ item.subject_name }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.units }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.type }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.day }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ formatTime(item.start_time) }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ formatTime(item.end_time) }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">
                  {{
                    item.section_name
                      || (item.section_id ? getSectionNameById(item.section_id) : '')
                      || selectedEnrollment.section_name
                      || (selectedEnrollment.section_id ? getSectionNameById(selectedEnrollment.section_id) : 'N/A')
                  }}
                </td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.room_name }}</td>
                <td class="border px-2 py-1 text-center whitespace-normal break-words">{{ item.instructor || '' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="border px-2 py-1 text-right font-semibold whitespace-normal break-words" colspan="2">Total Units:</td>
                <td class="border px-2 py-1 text-center font-bold whitespace-normal break-words">{{ ((selectedEnrollment && Array.isArray(selectedEnrollment.schedules)) ? selectedEnrollment.schedules : []).reduce((sum, item) => sum + (item.units || 0), 0) }}</td>
                <td class="border px-2 py-1 whitespace-normal break-words" colspan="7"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button @click="printSchedule()" class="px-4 py-2 bg-gray-100 text-gray-800 rounded border hover:bg-gray-200 font-semibold text-sm">Print</button>
          <button @click="closeScheduleModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold text-sm">Close</button>
        </div>

        <button @click="closeScheduleModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>

    <!-- Admin Enroll Modal (moved out to top-level) -->
    <div v-if="showAdminEnrollModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-4 sm:p-6 w-full max-w-2xl relative">
        <h3 class="text-lg font-bold mb-3 text-blue-900">Enroll Student</h3>
        <div class="mb-4 text-sm text-gray-700">
          <div class="mb-2"><strong>Student:</strong> {{ adminEnrollStudent?.last_name }}, {{ adminEnrollStudent?.first_name }} ({{ adminEnrollStudent?.student_id }})</div>
          <div><strong>Program:</strong> {{ (coursesMap[adminEnrollStudent?.course_id] && coursesMap[adminEnrollStudent?.course_id].name) || adminEnrollStudent?.course_id }}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Enrollment Type</label>
            <select v-model="adminEnrollType" class="w-full border rounded px-2 py-1">
              <option value="block">Block Section</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>
        </div>

        <!-- Block Section UI -->
        <div v-if="adminEnrollType === 'block'" class="mb-4">
          <label class="block text-gray-700 mb-1 font-semibold">Section</label>
          <select v-model="adminBlockSectionId" class="w-full border rounded px-2 py-1">
            <option value="">-- Select Section --</option>
            <option v-for="sec in adminAvailableSections" :key="sec.id" :value="sec.id">
              {{ sec.name }} ({{ (sec.schedule_type || sec.type || '').toString().toUpperCase() }})
            </option>
          </select>
          <div v-if="!adminAvailableSections.length" class="text-xs text-gray-500 mt-1">
            No open sections found matching this student's course and year level.
          </div>
          <div v-if="adminEnrollError" class="mt-2 p-2 bg-red-100 text-red-700 border border-red-300 rounded text-sm">{{ adminEnrollError }}</div>
        </div>

        <!-- Irregular UI: merged Lec/Lab per subject+section -->
        <div v-else class="mb-4">
          <div v-if="irregularLoading" class="text-gray-500">Loading subjects...</div>
          <div v-else>
            <div v-if="irregularError" class="mb-2 p-2 bg-red-100 text-red-700 border border-red-300 rounded text-sm">{{ irregularError }}</div>
            <div class="max-h-[50vh] overflow-y-auto border rounded">
              <table class="w-full text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="py-2 px-2 text-left">Subject</th>
                    <th class="py-2 px-2 text-left">Section</th>
                    <th class="py-2 px-2 text-left">Types</th>
                    <th class="py-2 px-2 text-left">Day/Time</th>
                    <th class="py-2 px-2 text-left">Instructor</th>
                    <th class="py-2 px-2 text-left">Select</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="opt in adminIrregularOptions" :key="opt.key" class="border-b">
                    <td class="py-1 px-2">{{ opt.subject_code }} - {{ opt.subject_name }}</td>
                    <td class="py-1 px-2">{{ opt.section_name }}</td>
                    <td class="py-1 px-2">
                      <div v-for="row in opt.rows" :key="'type-' + row.id">
                        {{ String(row.type || '').toUpperCase() || '-' }}
                      </div>
                    </td>
                    <td class="py-1 px-2">
                      <div v-for="row in opt.rows" :key="row.id">
                          {{ row.day }} {{ formatTime(row.start_time) }}-{{ formatTime(row.end_time) }}
                      </div>
                    </td>
                    <td class="py-1 px-2">
                      <div v-for="row in opt.rows" :key="'inst-' + row.id">
                        {{ (row.instructor || row.instructor_name || row.faculty_name || '-')}}
                      </div>
                    </td>
                    <td class="py-1 px-2">
                      <input type="checkbox" :value="opt" v-model="adminSelectedIrregular" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 border rounded p-2">
              <div class="font-semibold mb-1">Selected Preview</div>
              <div v-if="adminIrregularGrouped.length === 0" class="text-sm text-gray-500">No selections yet.</div>
              <table v-else class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="py-1 px-2 text-left">Subject</th>
                    <th class="py-1 px-2 text-left">Section</th>
                    <th class="py-1 px-2 text-left">Types</th>
                    <th class="py-1 px-2 text-left">Day/Time</th>
                    <th class="py-1 px-2 text-left">Instructor</th>
                    <th class="py-1 px-2 text-left">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in adminIrregularGrouped" :key="g.key" class="border-b">
                    <td class="py-1 px-2">{{ g.subject_code }} - {{ g.subject_name }}</td>
                    <td class="py-1 px-2">{{ g.section_name }}</td>
                    <td class="py-1 px-2">
                      <div v-for="row in g.rows" :key="'ptype-' + row.id">{{ String(row.type || '').toUpperCase() || '-' }}</div>
                    </td>
                    <td class="py-1 px-2">
                      <div v-for="row in g.rows" :key="'ptime-' + row.id">{{ row.day }} {{ formatTime(row.start_time) }}-{{ formatTime(row.end_time) }}</div>
                    </td>
                    <td class="py-1 px-2">
                      <div v-for="row in g.rows" :key="'pinst-' + row.id">{{ (row.instructor || row.instructor_name || row.faculty_name || '-') }}</div>
                    </td>
                    <td class="py-1 px-2">
                      <button class="px-2 py-0.5 bg-red-500 text-white rounded" @click="removeSelectedIrregular(g.key)">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <button @click="closeAdminEnroll" class="px-4 py-2 bg-gray-200 rounded">Close</button>
          <button v-if="adminEnrollType === 'block'" :disabled="adminEnrollSaving || !adminBlockSectionId" @click="showBlockPreview" class="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50">
            Preview & Confirm
          </button>
          <button v-else :disabled="adminEnrollSaving || adminSelectedIrregular.length === 0" @click="submitAdminIrregularEnroll" class="px-4 py-2 bg-blue-900 text-white rounded">
            {{ adminEnrollSaving ? 'Saving...' : 'Enroll (Irregular)' }}
          </button>
        </div>
        <button @click="closeAdminEnroll" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
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
            <label class="block text-gray-700 mb-1 font-semibold">Region</label>
            <select v-model="freshmanForm.region_code" @change="clearValidationError" class="w-full border rounded px-2 py-1">
              <option value="">-- Select Region --</option>
              <option v-for="r in regions" :key="r.code" :value="r.code">{{ r.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Province</label>
            <select v-model="freshmanForm.province_code" @change="clearValidationError" class="w-full border rounded px-2 py-1" :disabled="!freshmanForm.region_code || provinces.length === 0">
              <option value="">-- Select Province --</option>
              <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">City/Town</label>
            <select v-model="freshmanForm.city_code" @change="clearValidationError" class="w-full border rounded px-2 py-1" :disabled="(provinces.length > 0 ? !freshmanForm.province_code : !freshmanForm.region_code)">
              <option value="">-- Select City/Town --</option>
              <option v-for="p in cities" :key="p.code" :value="p.code">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 mb-1 font-semibold">Barangay</label>
            <select v-model="freshmanForm.barangay_code" @change="clearValidationError" class="w-full border rounded px-2 py-1" :disabled="!freshmanForm.city_code">
              <option value="">-- Select Barangay --</option>
              <option v-for="b in barangays" :key="b.code" :value="b.code">{{ b.name }}</option>
            </select>
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
        <div v-if="currentStep === 4" class="mb-3">
          <label class="inline-flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" v-model="freshmanForm.consent" @change="clearValidationError" class="mt-1">
            <span>
              I confirm that the information provided is true and correct to the best of my knowledge.
            </span>
          </label>
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
            :disabled="isEditMode ? !hasChanges : !isAllValid"
            :class="['px-4 py-2 rounded text-white font-semibold', (isEditMode ? !hasChanges : !isAllValid) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800']"
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

    <!-- Processing Freshman Enrollments Modal -->
    <div v-if="showProcessingModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-4 sm:p-6 w-auto max-w-[95vw] relative">
        <h3 class="text-lg font-bold text-blue-900 mb-4">Processing Freshman Enrollments</h3>
        <div v-if="processingLoading" class="text-gray-500 py-4">Loading processing enrollments...</div>
        <div v-else>
          <div v-if="processingError" class="mb-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{{ processingError }}</div>
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
                <tr v-for="e in processingEnrollments" :key="e.id" class="border-b">
                  <td class="py-2 px-2 text-center">{{ e.last_name }}, {{ e.first_name }}</td>
                  <td class="py-2 px-2 text-center">{{ e.email }}</td>
                  <td class="py-2 px-2 text-center">{{ e.mobile }}</td>
                  <td class="py-2 px-2 text-center">{{ (coursesMap[e.course_id]?.code) || (coursesMap[e.course_id]?.name) || '-' }}</td>
                  <td class="py-2 px-2 text-center">{{ e.admission_type }}</td>
                  <td class="py-2 px-2 text-center">{{ e.year_level }}</td>
                  <td class="py-2 px-2 text-center">
                    <div class="flex gap-2 justify-center">
                      <button @click="viewEnrollment(e)" class="px-2 py-1 bg-blue-100 text-blue-900 rounded hover:bg-blue-200">View</button>
                      <button @click="confirmAccept(e)" class="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500">Accept</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="processingEnrollments.length === 0">
                  <td colspan="7" class="text-center text-gray-400 py-6">No processing enrollments found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <button @click="closeProcessingModal" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
    
    <!-- Block Section Preview Modal -->
    <div v-if="showBlockPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl relative">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-800">Preview Block Enrollment</h3>
          <button @click="showBlockPreviewModal = false" class="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        <div class="text-sm text-gray-600 mb-2" v-if="currentSelectedSection">
          <div class="font-medium">
            Section: {{ currentSelectedSection.name }}
          </div>
          <div>
            Type: {{ (currentSelectedSection.schedule_type || currentSelectedSection.type || '').toString().toUpperCase() }}
          </div>
        </div>
        <div class="overflow-x-auto">
          <div v-if="blockLoading" class="p-2 text-sm text-gray-500">Loading schedules...</div>
          <div v-else-if="blockError" class="p-2 text-sm text-red-600">{{ blockError }}</div>
          <div v-else>
            <div v-if="(blockSchedules || []).length === 0" class="p-2 text-sm text-gray-500">No schedules found for this section.</div>
            <table v-else class="w-full text-sm border">
              <thead class="bg-gray-100 text-gray-900">
                <tr>
                  <th class="py-2 px-2 text-left">Subject</th>
                  <th class="py-2 px-2 text-left">Type</th>
                  <th class="py-2 px-2 text-left">Day/Time</th>
                  <th class="py-2 px-2 text-left">Room</th>
                  <th class="py-2 px-2 text-left">Instructor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in blockSchedules" :key="row.id || (row.subject_id + '-' + row.type + '-' + row.day + '-' + row.start_time)" class="border-b">
                  <td class="py-1 px-2">{{ row.code || row.subject_code }} - {{ row.name || row.subject_name }}</td>
                  <td class="py-1 px-2">{{ (row.type || '').toString().toUpperCase() }}</td>
                  <td class="py-1 px-2">{{ row.day }} {{ formatTime(row.start_time) }}-{{ formatTime(row.end_time) }}</td>
                  <td class="py-1 px-2">{{ row.room || row.room_name || '-' }}</td>
                  <td class="py-1 px-2">{{ row.instructor || row.instructor_name || row.faculty_name || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button @click="showBlockPreviewModal = false" class="px-4 py-2 bg-gray-200 rounded">Close</button>
          <button :disabled="adminEnrollSaving || blockLoading" @click="submitAdminBlockEnroll" class="px-4 py-2 bg-blue-900 text-white rounded disabled:opacity-50">
            {{ adminEnrollSaving ? 'Saving...' : 'Confirm Enroll' }}
          </button>
        </div>
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
          <button v-if="selectedEnrollment && selectedEnrollment.status === 'pending'" @click="processEnrollment(selectedEnrollment.id)" class="px-4 py-2 bg-yellow-600 text-white rounded">Mark Processing</button>
          <button v-if="selectedEnrollment && selectedEnrollment.status === 'processing'" @click="confirmAccept(selectedEnrollment)" class="px-4 py-2 bg-emerald-600 text-white rounded">Accept</button>
          <button v-if="selectedEnrollment" @click="rejectEnrollment(selectedEnrollment.id)" class="px-4 py-2 bg-red-500 text-white rounded">Reject</button>
        </div>
        <button @click="showDetailsModal=false" class="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

// PSGC Cascading Select State (moved into <script setup>)
const PSGC_BASE = 'https://psgc.gitlab.io/api'
const regions = ref([])
const provinces = ref([])
const cities = ref([])
const barangays = ref([])

// Helper to normalize region short labels similar to Freshman form expectations
const REGION_CODE_TO_SHORT = {
  '010000000': 'Ilocos Region',
  '020000000': 'Cagayan Valley',
  '030000000': 'Central Luzon',
  '040000000': 'CALABARZON',
  '050000000': 'Bicol Region',
  '060000000': 'Western Visayas',
  '070000000': 'Central Visayas',
  '080000000': 'Eastern Visayas',
  '090000000': 'Zamboanga Peninsula',
  '100000000': 'Northern Mindanao',
  '110000000': 'Davao Region',
  '120000000': 'SOCCSKSARGEN',
  '130000000': 'NCR',
  '140000000': 'CAR',
  '150000000': 'BARMM',
  '160000000': 'Caraga',
  '170000000': 'MIMAROPA',
}

// ===== Admin Enroll (Block/Irregular) State =====
const showAdminEnrollModal = ref(false)
const adminEnrollStudent = ref(null)
const adminEnrollType = ref('block')
const adminTermYear = ref('')
const adminTermSem = ref('1st Semester')
const adminAvailableSections = ref([])
const adminBlockSectionId = ref('')
const adminEnrollError = ref('')
const adminEnrollSaving = ref(false)
// Irregular selections
const irregularLoading = ref(false)
const irregularError = ref('')
// Block section preview state
const blockSchedules = ref([])
const blockLoading = ref(false)

// Helper: resolve section name by id from loaded adminAvailableSections or fallbacks
function getSectionNameById(id) {
  if (!id && id !== 0) return ''
  const list = adminAvailableSections.value || []
  const found = list.find(s => String(s.id) === String(id))
  if (found) {
    return (
      found.name ||
      found.section_name ||
      found.code ||
      found.section_code ||
      `Section ${found.id}`
    )
  }
  // Fallback: try from currently selected enrollment schedules if available
  try {
    const sel = selectedEnrollment && selectedEnrollment.value
    const sched = Array.isArray(sel?.schedules) ? sel.schedules.find(sc => String(sc.section_id) === String(id)) : null
    if (sched) return sched.section_name || sched.section_code || ''
  } catch (_) {}
  return 'N/A'
}

const blockError = ref('')
const adminAllScheduledSubjects = ref([])
// Selected irregular GROUP options: { key, subject_id, section_id, subject_code, subject_name, section_name, types:Set, rows:[schedule rows], instructors:string[] }
const adminSelectedIrregular = ref([])

// Actions dropdown state for students table
const openActionFor = ref(null)
const actionMenuPos = ref({ x: 0, y: 0 })
const actionMenuStudent = ref(null)
const actionMenuLoading = ref(false)
// Cache of admin enrollment lookups: key by student PK id -> { has:boolean, data:{ enrollment, section, schedules } }
const adminEnrollmentMap = ref({})

// Ensure a student's current enrollment is fetched and cached for quick lookup in the action menu
async function ensureAdminEnrollmentCached(student) {
  try {
    if (!student) return
    const sidPk = student?.id
    const sidStr = student?.student_id
    if (!sidPk && !sidStr) return

    // Avoid spamming: use short-lived cache (30s)
    const cached = adminEnrollmentMap.value[sidPk]
    if (cached && cached._ts && (Date.now() - cached._ts < 30_000)) return

    actionMenuLoading.value = true
    const token = sessionStorage.getItem('admin_token')
    const headers = { 'Authorization': `Bearer ${token}` }

    // Try a set of likely admin endpoints; stop at first successful response
    const urls = []
    if (sidStr) urls.push(`http://localhost:5000/api/admin/students/${encodeURIComponent(sidStr)}/enrollment`)
    if (sidPk) urls.push(`http://localhost:5000/api/admin/students/${encodeURIComponent(String(sidPk))}/enrollment?by=pk=1`)
    if (sidPk) urls.push(`http://localhost:5000/api/admin/enrollments/current?student_pk=${encodeURIComponent(String(sidPk))}`)
    if (sidStr) urls.push(`http://localhost:5000/api/admin/enrollments/current?student_id=${encodeURIComponent(sidStr)}`)
    if (sidStr) urls.push(`http://localhost:5000/api/student/enrollment?student_id=${encodeURIComponent(sidStr)}`)

    let found = null
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers })
        if (!res.ok) continue
        const json = await res.json().catch(() => ({}))
        if (!json || json.error) continue
        found = json
        break
      } catch (_) { /* try next */ }
    }

    // Normalize shape
    let enrollment = found?.enrollment || found?.enrollmentData || found?.enroll || null
    let section = found?.section || found?.assigned_section || found?.blockSection || null
    let schedules = found?.schedules || found?.schedule || found?.scheduleRows || found?.subjects || []
    if (!Array.isArray(schedules)) schedules = schedules ? [schedules] : []

    let has = false
    const status = String(enrollment?.status || found?.status || '').toLowerCase()
    if (enrollment) {
      // Treat pending/processing/approved/accepted as active for viewing the reg form
      has = ['pending', 'processing', 'approved', 'accepted'].includes(status) || !!section || schedules.length > 0
    } else {
      has = !!section || schedules.length > 0
    }

    adminEnrollmentMap.value[sidPk] = {
      has,
      data: { enrollment, section, schedules },
      _ts: Date.now(),
    }
  } finally {
    actionMenuLoading.value = false
  }
}

// Boolean helper to determine if a student has an active/visible enrollment
function adminHasActiveEnrollment(student) {
  if (!student) return false
  const sidPk = student?.id
  const cached = adminEnrollmentMap.value[sidPk]
  return !!(cached && cached.has)
}

// Block section preview modal state
const showBlockPreviewModal = ref(false)

const currentSelectedSection = computed(() => {
  const id = adminBlockSectionId.value
  if (!id) return null
  return (adminAvailableSections.value || []).find(s => String(s.id) === String(id)) || null
})
function toggleActionMenu(id, evt) {
  if (openActionFor.value === id) {
    openActionFor.value = null
    return
  }
  openActionFor.value = id
  // Resolve the student for action handlers
  try {
    actionMenuStudent.value = (students.value || []).find(s => String(s.id) === String(id)) || null
  } catch (_) {
    actionMenuStudent.value = null
  }
  // Ensure we have up-to-date enrollment status for this student
  if (actionMenuStudent.value) {
    ensureAdminEnrollmentCached(actionMenuStudent.value)
  }
  // Position near the button
  try {
    const el = evt?.currentTarget || evt?.target
    if (el && typeof el.getBoundingClientRect === 'function') {
      const rect = el.getBoundingClientRect()
      const menuWidth = 176 // ~w-44
      const gap = 4
      let left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right + window.scrollX - menuWidth))
      let top = Math.max(8, Math.min(window.innerHeight - 8, rect.bottom + window.scrollY + gap))
      actionMenuPos.value = { x: left, y: top }
    }
  } catch (_) { /* noop */ }
}

// Close actions menu on outside click
let _actionsOutsideHandler = null
onMounted(() => {
  _actionsOutsideHandler = () => { if (openActionFor.value !== null) openActionFor.value = null }
  window.addEventListener('click', _actionsOutsideHandler)
})
onBeforeUnmount(() => {
  if (_actionsOutsideHandler) {
    window.removeEventListener('click', _actionsOutsideHandler)
    _actionsOutsideHandler = null
  }
})

// Open Admin Enroll modal for a student
function openAdminEnroll(student) {
  try {
    adminEnrollStudent.value = student || null
    adminEnrollType.value = 'block'
    // Ensure sensible defaults for required term fields
    ensureTermDefaults()
    adminBlockSectionId.value = ''
    adminEnrollError.value = ''
    adminEnrollSaving.value = false
    adminSelectedIrregular.value = []
    // Pre-load available sections filtered by student's course/year
    loadAdminSections()
    showAdminEnrollModal.value = true
  } catch (_) {
    // noop
  }
}

// Compute a default school year string like '2025-2026' based on current date
function getDefaultSchoolYear() {
  const now = new Date()
  // Academic year starting June: if month >= June (5), AY is currentYear-currentYear+1 else previousYear-currentYear
  const y = now.getFullYear()
  const m = now.getMonth() // 0-11
  const startYear = m >= 5 ? y : y - 1
  return `${startYear}-${startYear + 1}`
}

function ensureTermDefaults() {
  if (!adminTermYear.value) adminTermYear.value = getDefaultSchoolYear()
  if (!adminTermSem.value) adminTermSem.value = '1st Semester'
}

// Build merged irregular options from all scheduled subjects (group by subject+section)
const adminIrregularOptions = computed(() => {
  const map = new Map()
  for (const row of adminAllScheduledSubjects.value) {
    const key = `${row.subject_code}-${row.section_name}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        subject_id: row.subject_id,
        // representative section_id (first encountered)
        section_id: row.section_id,
        subject_code: row.subject_code,
        subject_name: row.subject_name,
        section_name: row.section_name,
        types: new Set(),
        rows: [],
        instructors: new Set(),
      })
    }
    const g = map.get(key)
    if (!g.section_id && row.section_id) g.section_id = row.section_id
    g.types.add(String(row.type || '').toUpperCase())
    g.rows.push(row)
    const inst = row.instructor || row.instructor_name || row.faculty_name || ''
    if (inst) g.instructors.add(inst)
  }
  return Array.from(map.values()).map(g => ({
    ...g,
    types: new Set(g.types),
    instructors: Array.from(g.instructors)
  }))
})

// Grouped preview based on selected merged options (include rows for per-row layout)
const adminIrregularGrouped = computed(() => {
  return adminSelectedIrregular.value.map(opt => ({
    key: opt.key,
    subject_code: opt.subject_code,
    subject_name: opt.subject_name,
    section_id: opt.section_id,
    section_name: opt.section_name,
    types: Array.from(opt.types || []),
    rows: Array.isArray(opt.rows) ? opt.rows : [],
  }))
})

function removeSelectedIrregular(key) {
  adminSelectedIrregular.value = adminSelectedIrregular.value.filter(opt => opt.key !== key)
}

function currentDefaultSY() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`
}

function formatTime(t) {
  if (!t || typeof t !== 'string') return t
  // Support HH:MM and HH:MM:SS
  const m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/)
  if (!m) return t
  let h = parseInt(m[1], 10)
  const minutes = m[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const hh = h.toString().padStart(2, '0')
  return `${hh}:${minutes} ${ampm}`
}

function closeAdminEnroll() {
  showAdminEnrollModal.value = false
}

async function loadAdminSections() {
  adminAvailableSections.value = []
  const token = sessionStorage.getItem('admin_token')
  try {
    const res = await fetch('http://localhost:5000/api/admin/sections', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    const s = adminEnrollStudent.value || {}
    const sections = Array.isArray(data) ? data : []
    const get = (obj, keys, def = undefined) => {
      for (const k of keys) { if (obj && obj[k] != null) return obj[k] }
      return def
    }
    // Helpers for normalization
    const digitsOnly = (v) => String(v ?? '').replace(/[^0-9]/g, '')
    const normYear = (v) => digitsOnly(v)
    // Resolve student's course identifiers (id, name, code) via coursesMap if available
    const studentCourseId = s.course_id
    const courseInfo = (typeof coursesMap !== 'undefined' && coursesMap && studentCourseId != null)
      ? (coursesMap[studentCourseId] || {})
      : {}
    const studentCourseName = courseInfo?.name || ''
    const studentCourseCode = courseInfo?.code || courseInfo?.short_name || ''
    const studentYear = normYear(s.year_level)

    // Strict filter: only sections with status === 'open' and matching student's course/year
    const filtered = sections.filter(sec => {
      const secCourseId = get(sec, ['course_id', 'courseId', 'courseID'])
      const secCourseName = get(sec, ['course_name', 'courseName'])
      const secCourseCode = get(sec, ['course_code', 'courseCode', 'course'])
      const secYearRaw = get(sec, ['year_level', 'yearLevel', 'level', 'year'])
      const status = String(get(sec, ['status', 'state'], '') || '').toLowerCase()

      const norm = (v) => String(v ?? '').trim().toLowerCase()
      const candIds = studentCourseId != null ? [String(studentCourseId)] : []
      const candNames = [studentCourseName, studentCourseCode].filter(Boolean).map(norm)
      const secIdStr = secCourseId != null ? String(secCourseId) : ''
      const secNameVals = [secCourseName, secCourseCode].filter(Boolean).map(norm)

      // Prefer ID comparison when both sides have IDs
      let byCourse = false
      if (candIds.length && secIdStr) {
        byCourse = candIds.includes(secIdStr)
      } else if (candNames.length && secNameVals.length) {
        // Compare names/codes case-insensitively; allow contains both ways
        byCourse = candNames.some(a => secNameVals.some(b => a === b || a.includes(b) || b.includes(a)))
      }

      // If we couldn't determine (no data), do not match
      if (!byCourse) return false

      // Year match compares numeric part only (e.g., '3rd Year' -> '3')
      const byYear = !studentYear || normYear(secYearRaw) === studentYear

      const byStatus = status === 'open'
      return byCourse && byYear && byStatus
    })
    adminAvailableSections.value = filtered
  } catch (_) {
    adminAvailableSections.value = []
  }
}

// Load subjects with schedules for a selected block section (preview before enrolling)
async function loadBlockSectionSchedules(sectionId) {
  blockSchedules.value = []
  blockError.value = ''
  if (!sectionId) return
  blockLoading.value = true
  try {
    const token = sessionStorage.getItem('admin_token')
    const res = await fetch(`http://localhost:5000/api/admin/sections/${encodeURIComponent(sectionId)}/schedules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`)
    blockSchedules.value = Array.isArray(data) ? data : []
  } catch (e) {
    blockError.value = e?.message || 'Failed to load section schedules.'
    blockSchedules.value = []
  } finally {
    blockLoading.value = false
  }
}

async function loadAdminAllScheduledSubjects() {
  irregularLoading.value = true
  irregularError.value = ''
  adminAllScheduledSubjects.value = []
  const token = sessionStorage.getItem('admin_token')
  try {
    const res = await fetch('http://localhost:5000/api/admin/subjects/all-scheduled', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error(`Failed (${res.status})`)
    const data = await res.json()
    adminAllScheduledSubjects.value = Array.isArray(data) ? data : []
  } catch (e) {
    irregularError.value = e?.message || 'Failed to load scheduled subjects.'
  } finally {
    irregularLoading.value = false
  }
}

watch(adminEnrollType, (t) => {
  if (t === 'irregular') loadAdminAllScheduledSubjects()
  if (t === 'block') loadAdminSections()
})

watch(adminTermYear, () => {
  if (adminEnrollType.value === 'block') loadAdminSections()
})

watch(adminTermSem, () => {
  if (adminEnrollType.value === 'block') loadAdminSections()
})

// (No need to watch a show-all toggle; we strictly filter by open + course/year)

// When a block section is chosen, load its subject schedules for preview
watch(adminBlockSectionId, (id) => {
  loadBlockSectionSchedules(id)
})

function showBlockPreview() {
  adminEnrollError.value = ''
  const id = adminBlockSectionId.value
  if (!id) { adminEnrollError.value = 'Please select a section.'; return }
  showBlockPreviewModal.value = true
  // Ensure latest data
  loadBlockSectionSchedules(id)
}

async function submitAdminBlockEnroll() {
  adminEnrollError.value = ''
  if (!adminBlockSectionId.value) { adminEnrollError.value = 'Please select a section.'; return }
  ensureTermDefaults()
  adminEnrollSaving.value = true
  const token = sessionStorage.getItem('admin_token')
  const sid = encodeURIComponent(adminEnrollStudent.value?.student_id || '')
  try {
    const res = await fetch(`http://localhost:5000/api/admin/students/${sid}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ section_id: adminBlockSectionId.value, school_year: adminTermYear.value, semester: adminTermSem.value, auto_approve: true })
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.error) throw new Error(json?.error || `Failed (${res.status})`)
    // Try to auto-approve explicitly in case backend ignored the flag
    await autoApproveIfPossible(adminEnrollStudent.value, json)
    showAdminEnrollModal.value = false
    showBlockPreviewModal.value = false
    notifMessage.value = 'Enrollment approved.'
    showNotifModal.value = true
  } catch (e) {
    adminEnrollError.value = e?.message || 'Failed to enroll student.'
  } finally {
    adminEnrollSaving.value = false
  }
}

async function submitAdminIrregularEnroll() {
  irregularError.value = ''
  if (!adminSelectedIrregular.value.length) { irregularError.value = 'Please select at least one schedule.'; return }
  ensureTermDefaults()
  adminEnrollSaving.value = true
  const token = sessionStorage.getItem('admin_token')
  const sid = encodeURIComponent(adminEnrollStudent.value?.student_id || '')
  // Flatten all underlying schedule rows from each selected GROUP option
  const subject_schedules = adminSelectedIrregular.value.flatMap(opt =>
    (opt.rows || []).map(row => ({ subject_id: opt.subject_id, schedule_id: row.id, section_id: opt.section_id }))
  )
  try {
    const res = await fetch(`http://localhost:5000/api/admin/students/${sid}/enroll/irregular`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subject_schedules, school_year: adminTermYear.value, semester: adminTermSem.value, auto_approve: true })
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.error) throw new Error(json?.error || `Failed (${res.status})`)
    // Try to auto-approve explicitly in case backend ignored the flag
    await autoApproveIfPossible(adminEnrollStudent.value, json)
    showAdminEnrollModal.value = false
    notifMessage.value = 'Irregular enrollment approved.'
    showNotifModal.value = true
  } catch (e) {
    irregularError.value = e?.message || 'Failed to submit irregular enrollment.'
  } finally {
    adminEnrollSaving.value = false
  }
}

// Attempt to approve the created enrollment. If the response contains an ID, use it;
// otherwise fetch the latest pending enrollment for the student and approve that.
async function autoApproveIfPossible(studentObj, createResponse) {
  try {
    const id = createResponse?.enrollment_id || createResponse?.id || createResponse?.enrollment?.id
    if (id) {
      await approveEnrollmentById(id)
      return
    }
    if (!studentObj) return
    const target = await findLatestPendingEnrollment(studentObj)
    if (target?.id) await approveEnrollmentById(target.id)
  } catch (_) {
    // Silently ignore; UI already notifies success, and manual approval view exists
  }
}

async function approveEnrollmentById(enrollmentId) {
  const token = sessionStorage.getItem('admin_token')
  const res = await fetch(`http://localhost:5000/api/admin/enrollments/${encodeURIComponent(enrollmentId)}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error) throw new Error(data?.error || `Failed (${res.status})`)
}

async function findLatestPendingEnrollment(studentObj) {
  const token = sessionStorage.getItem('admin_token')
  const sidStr = studentObj?.student_id // e.g., '2025-00001'
  const sidPk = studentObj?.id // numeric PK
  const tryUrls = []
  if (sidPk) tryUrls.push(`http://localhost:5000/api/admin/enrollments?student_pk=${encodeURIComponent(sidPk)}&status=pending`)
  if (sidStr) tryUrls.push(`http://localhost:5000/api/admin/enrollments?student_id=${encodeURIComponent(sidStr)}&status=pending`)
  tryUrls.push('http://localhost:5000/api/admin/enrollments?status=pending') // fallback: fetch all and filter client-side

  let arr = []
  for (const url of tryUrls) {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    const list = await res.json().catch(() => ([]))
    if (!res.ok || (list && list.error)) continue
    arr = Array.isArray(list) ? list : []
    if (arr.length) break
  }
  // Narrow to this student if we fetched broad list
  if (arr.length && (sidPk || sidStr)) {
    arr = arr.filter(e => {
      const ePk = e.student_pk || e.studentId || e.student_id_pk || e.student_primary_id
      const eStr = e.student_id || e.studentNumber || e.student_no
      return (sidPk && (String(ePk) === String(sidPk))) || (sidStr && String(eStr) === String(sidStr))
    })
  }
  // Prefer most recent by created_at desc, fallback by id desc
  arr.sort((a, b) => {
    const at = new Date(a.created_at || a.createdAt || 0).getTime()
    const bt = new Date(b.created_at || b.createdAt || 0).getTime()
    if (at !== bt) return bt - at
    return (b.id || 0) - (a.id || 0)
  })
  return arr[0] || null
}

function toShortRegionLabel(r) {
  const rawName = r.name || r.regionName || r.description || r.region_name || ''
  const paren = rawName.match(/\(([^)]+)\)/)?.[1]
  const short = r.shortName || r.short_name || paren
  if (short) return short
  const code = r.code || r.regionCode || r.psgcCode
  if (REGION_CODE_TO_SHORT[code]) return REGION_CODE_TO_SHORT[code]
  // Keyword fallbacks
  const n = rawName.toLowerCase()
  if (n.includes('national capital')) return 'NCR'
  if (n.includes('cordillera')) return 'CAR'
  if (n.includes('bangsamoro')) return 'BARMM'
  if (n.includes('mimaropa')) return 'MIMAROPA'
  if (n.includes('calabarzon')) return 'CALABARZON'
  if (n.includes('caraga')) return 'Caraga'
  return rawName || code
}

async function loadRegions() {
  try {
    const res = await fetch(`${PSGC_BASE}/regions/`)
    const data = await res.json()
    regions.value = (data || []).map(r => ({ code: r.code || r.regionCode || r.psgcCode, name: toShortRegionLabel(r) }))
  } catch (_) {
    regions.value = []
  }
}

async function loadProvinces(regionCode) {
  provinces.value = []
  cities.value = []
  barangays.value = []
  if (!regionCode) return
  try {
    const res = await fetch(`${PSGC_BASE}/provinces/?region_code=${encodeURIComponent(regionCode)}`)
    const data = await res.json()
    // Guard against stale responses if region changed during fetch
    if (regionCode !== freshmanForm.value.region_code) return
    const rc = String(regionCode)
    const filtered = (data || []).filter(p => {
      const pRegion = p.regionCode || p.region_code
      if (pRegion) return String(pRegion) === rc
      const pCode = String(p.code || '')
      // PSGC codes often start with the region prefix (e.g., 04 for CALABARZON)
      return pCode.startsWith(rc.slice(0, 2))
    })
    provinces.value = filtered.map(p => ({ code: p.code, name: p.name || p.provinceName || p.description || p.shortName || p.code }))
  } catch (_) {
    provinces.value = []
  }
}

async function loadCities(provinceCode) {
  cities.value = []
  barangays.value = []
  if (!provinceCode) return
  try {
    const res = await fetch(`${PSGC_BASE}/cities-municipalities/?province_code=${encodeURIComponent(provinceCode)}`)
    const data = await res.json()
    // Guard against stale responses if province changed during fetch
    if (provinceCode !== freshmanForm.value.province_code) return
    const pc = String(provinceCode)
    const filtered = (data || []).filter(c => {
      const cProv = c.provinceCode || c.province_code
      if (cProv) return String(cProv) === pc
      const cCode = String(c.code || '')
      // Use PSGC prefix fallback (province prefix is typically longer than region; use first 4 digits)
      return cCode.startsWith(pc.slice(0, 4))
    })
    cities.value = filtered.map(c => ({ code: c.code, name: c.name || c.municipalityName || c.cityName || c.description || c.shortName || c.code }))
  } catch (_) {
    cities.value = []
  }
}

async function loadBarangays(cityCode) {
  barangays.value = []
  if (!cityCode) return
  try {
    const res = await fetch(`${PSGC_BASE}/barangays/?city_code=${encodeURIComponent(cityCode)}`)
    const data = await res.json()
    const cc = String(cityCode)
    const filtered = (data || []).filter(b => {
      const bCity = b.cityCode || b.city_code
      if (bCity) return String(bCity) === cc
      const bCode = String(b.code || '')
      // City prefix fallback: use first 6 digits
      return bCode.startsWith(cc.slice(0, 6))
    })
    barangays.value = filtered.map(b => ({ code: b.code, name: b.name || b.barangayName || b.description || b.shortName || b.code }))
  } catch (_) {
    barangays.value = []
  }
}

// Some regions (e.g., NCR) may not have provinces; support loading cities by region
async function loadCitiesByRegion(regionCode) {
  cities.value = []
  if (!regionCode) return
  try {
    const res = await fetch(`${PSGC_BASE}/cities-municipalities/?region_code=${encodeURIComponent(regionCode)}`)
    const data = await res.json()
    // Guard against stale responses if region changed during fetch
    if (regionCode !== freshmanForm.value.region_code) return
    const rc = String(regionCode)
    const filtered = (data || []).filter(c => {
      const cRegion = c.regionCode || c.region_code
      if (cRegion) return String(cRegion) === rc
      const cCode = String(c.code || '')
      // Region prefix fallback: first 2 digits
      return cCode.startsWith(rc.slice(0, 2))
    })
    cities.value = filtered.map(c => ({ code: c.code, name: c.name || c.municipalityName || c.cityName || c.description || c.shortName || c.code }))
  } catch (_) {
    cities.value = []
  }
}

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
  // Consent
  consent: false,
})

// Guard to prevent watchers from resetting fields during preload
const isPreloadingPSGC = ref(false)

// Watchers to cascade and keep names in sync (must be declared after freshmanForm)
watch(() => freshmanForm.value.region_code, async (newCode) => {
  const r = regions.value.find(x => x.code === newCode)
  freshmanForm.value.region = r ? r.name : ''
  if (isPreloadingPSGC.value) return
  // Clear dependent fields
  freshmanForm.value.province_code = ''
  freshmanForm.value.city_code = ''
  freshmanForm.value.barangay_code = ''
  freshmanForm.value.province = ''
  freshmanForm.value.city = ''
  freshmanForm.value.barangay = ''
  // Load provinces and also cities by region (fallback for NCR)
  await loadProvinces(newCode)
  await loadCitiesByRegion(newCode)
})

watch(() => freshmanForm.value.province_code, async (newCode) => {
  const p = provinces.value.find(x => x.code === newCode)
  freshmanForm.value.province = p ? p.name : ''
  if (isPreloadingPSGC.value) return
  freshmanForm.value.city_code = ''
  freshmanForm.value.barangay_code = ''
  freshmanForm.value.city = ''
  freshmanForm.value.barangay = ''
  if (newCode) {
    await loadCities(newCode)
  } else if (freshmanForm.value.region_code) {
    // If province cleared but region remains, repopulate cities via region
    await loadCitiesByRegion(freshmanForm.value.region_code)
  }
})

watch(() => freshmanForm.value.city_code, async (newCode) => {
  const c = cities.value.find(x => x.code === newCode)
  freshmanForm.value.city = c ? c.name : ''
  if (isPreloadingPSGC.value) return
  freshmanForm.value.barangay_code = ''
  freshmanForm.value.barangay = ''
  await loadBarangays(newCode)
})

watch(() => freshmanForm.value.barangay_code, (newCode) => {
  const b = barangays.value.find(x => x.code === newCode)
  freshmanForm.value.barangay = b ? b.name : ''
})

async function preloadLocationsFromCodes() {
  isPreloadingPSGC.value = true
  try {
    // Load regions first
    await loadRegions()
    const regCode = freshmanForm.value.region_code
    if (regCode) {
      const r = regions.value.find(x => x.code === regCode)
      freshmanForm.value.region = r ? r.name : freshmanForm.value.region || ''
      // Load provinces and also cities via region fallback
      await loadProvinces(regCode)
      await loadCitiesByRegion(regCode)
    }

    const provCode = freshmanForm.value.province_code
    if (provCode) {
      await loadCities(provCode)
      const p = provinces.value.find(x => x.code === provCode)
      freshmanForm.value.province = p ? p.name : freshmanForm.value.province || ''
    }

    const cityCode = freshmanForm.value.city_code
    if (cityCode) {
      await loadBarangays(cityCode)
      const c = cities.value.find(x => x.code === cityCode)
      freshmanForm.value.city = c ? c.name : freshmanForm.value.city || ''
    }

    const brgyCode = freshmanForm.value.barangay_code
    if (brgyCode) {
      const b = barangays.value.find(x => x.code === brgyCode)
      freshmanForm.value.barangay = b ? b.name : freshmanForm.value.barangay || ''
    }
  } finally {
    isPreloadingPSGC.value = false
  }
}
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
    f.course_id !== o.course_id ||
    f.consent !== o.consent
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
  // Accept autofilled values from freshmanForm as fallbacks
  const address = (f.address || freshmanForm.value?.address_line || '').trim()
  const contact = (f.contact_number || freshmanForm.value?.mobile || '').trim()
  const email = (f.email || freshmanForm.value?.email || '').trim()
  const year = (f.year_level || freshmanForm.value?.year_level || '').trim()
  const course = f.course_id || freshmanForm.value?.course_id

  if (!first || !nameRe.test(first)) return false
  if (!last || !nameRe.test(last)) return false
  if (middle && !nameRe.test(middle)) return false
  if (!(gender || (freshmanForm.value?.sex || '').trim())) return false
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
  // Require consent checked for live validity
  if (!f.consent) return false
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
      courses.value = Array.isArray(data) ? data : []
      const map = {}
      courses.value.forEach(course => {
        if (course && (course.id != null)) {
          const entry = { name: course.name, code: course.code }
          map[course.id] = entry
          map[String(course.id)] = entry
        }
      })
      coursesMap.value = map
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
    consent: false,
  }
  // Initialize PSGC lists
  regions.value = []
  provinces.value = []
  cities.value = []
  barangays.value = []
  await loadRegions()
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
  // Build student payload with fallbacks from freshmanForm to satisfy backend required fields
  const studentPayload = {
    ...studentForm.value,
    gender: (studentForm.value.gender || freshmanForm.value.sex || '').trim(),
    address: (studentForm.value.address || freshmanForm.value.address_line || '').trim(),
    contact_number: (studentForm.value.contact_number || freshmanForm.value.mobile || '').trim(),
    email: (studentForm.value.email || freshmanForm.value.email || '').trim(),
    year_level: (studentForm.value.year_level || freshmanForm.value.year_level || '').toString(),
    course_id: studentForm.value.course_id || freshmanForm.value.course_id || '',
  }
  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
    },
    body: JSON.stringify(studentPayload)
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
        }).then(async (r) => {
          if (r.status === 404) {
            // No existing freshman record; create one
            const createPayload = { ...payload, student_id: studentForm.value.student_id }
            return fetch('http://localhost:5000/api/admin/freshman-enrollments', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`
              },
              body: JSON.stringify(createPayload)
            })
          }
          if (!r.ok) throw new Error('Failed to update freshman details')
          return r
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
    region: '', province: '', city: '', barangay: '', address_line: student.address || '', zip: '',
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

  // Ensure latest region labels (short names) are loaded each time modal opens
  await loadRegions()

  showAddModal.value = true

  // Fetch freshman enrollment by student_id (if exists) to populate the form
  try {
    const res = await fetch(`http://localhost:5000/api/admin/freshman-enrollments/by-student/${student.student_id}` , {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    })
    if (!res.ok) {
      // 404 means no existing freshman record; keep defaults but set baseline for change detection
      if (res.status === 404) {
        originalFreshmanData.value = { ...freshmanForm.value }
        return
      }
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
        consent: !!data.consent,
      }
      originalFreshmanData.value = { ...freshmanForm.value }
      // Preload PSGC lists and resolve names from codes
      await preloadLocationsFromCodes()
    }
  } catch (e) {
    // Network or unexpected errors
    validationError.value = 'Failed to load freshman details.'
  }
  // If no details found (404 branch), still load regions for selection
  if (!regions.value.length) {
    await loadRegions()
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
// Mode of the details modal: '' | 'pending' | 'regView'
const detailsMode = ref('')
// When in regView mode, these hold the section and schedules from admin view endpoint
const selectedSectionView = ref(null)
const selectedSchedulesView = ref([])
const coursesMap = ref({})

// Resolve selected student's course name using available sources
const selectedCourseName = computed(() => {
  const enr = selectedEnrollment.value || {}
  const cid = enr.course_id
  // 1) Prefer direct map by course_id
  if (cid != null) {
    const hit = coursesMap.value[cid] || coursesMap.value[String(cid)]
    if (hit && (hit.name || hit.code)) return hit.name || hit.code
  }
  // 2) Try to resolve by course_code against loaded courses list
  const code = enr.course_code || ''
  if (code && Array.isArray(courses?.value)) {
    const codeLc = String(code).toLowerCase()
    const found = courses.value.find(c => {
      const c1 = String(c?.code || '').toLowerCase()
      const c2 = String(c?.short_name || '').toLowerCase()
      return c1 === codeLc || c2 === codeLc
    })
    if (found) return found.name || found.code || ''
  }
  // 3) Fallbacks from enrollment payload
  return enr.course_name || enr.program || enr.course || ''
})

// Resolve selected student's course CODE using available sources
const selectedCourseCode = computed(() => {
  const enr = selectedEnrollment.value || {}
  const cid = enr.course_id
  // 1) Prefer code from coursesMap via course_id
  if (cid != null) {
    const hit = coursesMap.value[cid] || coursesMap.value[String(cid)]
    if (hit && hit.code) return hit.code
  }
  // 2) Direct course_code from enrollment payload
  if (enr.course_code) return enr.course_code
  // 3) Try to infer by matching course_name/program to courses list
  const nameGuess = enr.course_name || enr.program || enr.course || ''
  if (nameGuess && Array.isArray(courses?.value)) {
    const target = String(nameGuess).toLowerCase()
    const found = courses.value.find(c => String(c?.name || '').toLowerCase() === target)
    if (found && found.code) return found.code
  }
  return ''
})

// Processing enrollments state
const showProcessingModal = ref(false)
const processingLoading = ref(false)
const processingError = ref('')
const processingEnrollments = ref([])

// Documents modal state
const showDocsModal = ref(false)
const docsSaving = ref(false)
const docsError = ref('')
const docsForm = ref({ psa: false, form138: false, good_moral: false, tor: false, notes: '' })
const docsAfterSaveAction = ref(null) // e.g., 'accept'
// Show TOR only for transferee admission type
const showTor = computed(() => String(selectedEnrollment.value?.admission_type || '').toLowerCase() === 'transferee')
watch(showTor, (visible) => {
  if (!visible) {
    docsForm.value.tor = false
  }
})

// View Registration Form modal state
const showRegFormModal = ref(false)
const regFormLoading = ref(false)
const regFormError = ref('')
const regFormShowSchedule = ref(false)
// Schedule modal state for Registration Form
const showScheduleModal = ref(false)

// Group selectedEnrollment.schedules similar to student-side formatting (combine Lec/Lab by subject)
const groupedSchedule = computed(() => {
  const enr = selectedEnrollment.value || null
  const rows = Array.isArray(enr?.schedules) ? enr.schedules : []
  if (!rows.length) return []
  const bySubject = {}
  rows.forEach((r) => {
    const code = r.subject_code || r.code || ''
    if (!code) return
    if (!bySubject[code]) {
      bySubject[code] = {
        subject_code: code,
        subject_name: r.subject_name || r.name || '',
        section_id: r.section_id || null,
        section_name: r.section_name || r.section || (selectedEnrollment.value?.section_name || selectedEnrollment.value?.section) || '',
        lec: null,
        lab: null,
      }
    }
    const type = String(r.type || '').toLowerCase()
    const entry = {
      day: r.day,
      start_time: r.start_time,
      end_time: r.end_time,
      room: r.room,
      room_name: r.room_name,
      instructor: r.instructor,
      instructor_name: r.instructor_name,
      faculty_name: r.faculty_name,
    }
    if (type === 'lec' || type === 'lecture') bySubject[code].lec = entry
    else if (type === 'lab' || type === 'laboratory') bySubject[code].lab = entry
    else {
      // Unknown type: treat as lec by default
      if (!bySubject[code].lec) bySubject[code].lec = entry
      else if (!bySubject[code].lab) bySubject[code].lab = entry
    }
  })
  return Object.values(bySubject).sort((a, b) => a.subject_code.localeCompare(b.subject_code))
})

// Student details to display above schedule (mirror student-side)
const scheduleStudentInfo = computed(() => {
  const enr = selectedEnrollment.value || {}
  const studentNo = enr.student_no || enr.student_number || enr.student_id || ''
  const name = [enr.last_name || enr.lastname, enr.first_name || enr.firstname, enr.middle_name || enr.middlename]
    .filter(Boolean)
    .join(', ')
  const program = enr.program || enr.course_name || enr.course || ''
  const year = enr.year_level || enr.year || ''
  const section = enr.section_name || enr.section || ''

  // Freshman-enrollment prioritized fields
  const gender = enr.sex || enr.gender || ''
  const contact = enr.mobile || enr.contact_number || enr.contact || ''
  // Compose address from freshman_enrollment fields when available
  const addrLine = enr.address_line || enr.address || ''
  const brgy = enr.barangay_name || enr.barangay || ''
  const city = enr.city_name || enr.city || enr.municipality_name || enr.municipality || ''
  const prov = enr.province_name || enr.province || ''
  const region = enr.region_name || enr.region || ''
  const zip = enr.zip || ''
  const parts = [addrLine, brgy, city, prov, region].filter(p => (p || '').toString().trim().length > 0)
  const address = parts.join(', ') + (zip ? ` ${zip}` : '')

  // Semester/term prefer freshman_enrollment semester
  const term = enr.semester || enr.term || enr.sy || ''

  return {
    student_no: (studentNo ?? '').toString(),
    name: name || '',
    program: program || '',
    year_level: (year ?? '').toString(),
    section: section || '',
    term: (term ?? '').toString(),
    gender: (gender ?? '').toString(),
    contact: (contact ?? '').toString(),
    address: address || '',
  }
})

function openScheduleModal() {
  if (!Array.isArray(selectedEnrollment.value?.schedules) || selectedEnrollment.value.schedules.length === 0) return
  showScheduleModal.value = true
}
function closeScheduleModal() {
  showScheduleModal.value = false
}

function printSchedule() {
  // Mirror the current modal layout exactly
  const rows = Array.isArray(selectedEnrollment.value?.schedules) ? selectedEnrollment.value.schedules : []
  const info = scheduleStudentInfo.value
  const win = window.open('', '_blank')
  if (!win) return
  const tableRows = rows.map(item => {
    return `
      <tr>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.subject_code || item.code || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;">${item.subject_name || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.units ?? ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.type || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.day || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${formatTime(item.start_time) || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${formatTime(item.end_time) || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${
          item.section_name
          || (item.section_id ? getSectionNameById(item.section_id) : '')
          || selectedEnrollment.value?.section_name
          || (selectedEnrollment.value?.section_id ? getSectionNameById(selectedEnrollment.value.section_id) : 'N/A')
        }</td>
        <td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.room_name || ''}</td>
        <td style="padding:6px;border:1px solid #ddd;">${item.instructor || ''}</td>
      </tr>
    `
  }).join('')
  const html = `
    <html>
    <head>
      <title>Schedule</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        h2 { margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
        thead { background: #f3f4f6; }
      </style>
    </head>
    <body>
      <h2>Student Schedule</h2>
      <table style="margin-bottom:12px;">
        <tbody>
          <tr>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Student No.</td>
            <td style="border:1px solid #ddd;padding:6px;">${info.student_no || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Last Name</td>
            <td style="border:1px solid #ddd;padding:6px;">${(selectedEnrollment.value?.last_name || selectedEnrollment.value?.lastname) || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">First Name</td>
            <td style="border:1px solid #ddd;padding:6px;">${(selectedEnrollment.value?.first_name || selectedEnrollment.value?.firstname) || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Middle Name</td>
            <td style="border:1px solid #ddd;padding:6px;">${(selectedEnrollment.value?.middle_name || selectedEnrollment.value?.middlename) || ''}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Address</td>
            <td style="border:1px solid #ddd;padding:6px;" colspan="3">${info.address || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Contact No.</td>
            <td style="border:1px solid #ddd;padding:6px;">${info.contact || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Gender</td>
            <td style="border:1px solid #ddd;padding:6px;">${info.gender || ''}</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Course</td>
            <td style="border:1px solid #ddd;padding:6px;">${selectedCourseCode.value || selectedEnrollment.value?.course_code || selectedEnrollment.value?.course_id || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Year Level</td>
            <td style="border:1px solid #ddd;padding:6px;">${selectedEnrollment.value?.year_level || selectedEnrollment.value?.year || ''}</td>
            <td style="border:1px solid #ddd;padding:6px;font-weight:600;">Semester</td>
            <td style="border:1px solid #ddd;padding:6px;" colspan="3">${info.term || '1st Semester'}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Units</th>
            <th>Type</th>
            <th>Days</th>
            <th>Start</th>
            <th>End</th>
            <th>Section</th>
            <th>Room</th>
            <th>Instructor</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

function openDocumentsModal(enrollment, after = null) {
  docsError.value = ''
  docsAfterSaveAction.value = after
  const enr = enrollment || selectedEnrollment.value
  if (!enr) return
  selectedEnrollment.value = enr
  let docs = {}
  try {
    if (enr.documents) {
      docs = typeof enr.documents === 'string' ? JSON.parse(enr.documents) : enr.documents
    }
  } catch (_) { docs = {} }
  const isTransferee = String(enr.admission_type || '').toLowerCase() === 'transferee'
  docsForm.value = {
    psa: !!docs.psa,
    form138: !!docs.form138,
    good_moral: !!docs.good_moral,
    tor: isTransferee ? !!docs.tor : false,
    notes: docs.notes || ''
  }
  showDocsModal.value = true
}

// Open the View Registration Form modal for a student with an active enrollment
async function openViewRegForm(student) {
  if (!student) return
  regFormError.value = ''
  regFormShowSchedule.value = false
  showRegFormModal.value = true
  regFormLoading.value = true
  try {
    const sidPk = student?.id
    const sidStr = student?.student_id
    const cached = adminEnrollmentMap.value[sidPk]?.data || {}
    const cachedEnrollment = cached.enrollment || null
    const cachedSection = cached.section || null
    const cachedSchedules = Array.isArray(cached.schedules) ? cached.schedules : []

    // If we have an enrollment id, fetch full details from backend
    if (cachedEnrollment?.id) {
      // Prefer searching list first to avoid 404s when cached id is from regular enrollments table
      let item = null
      const tokenList = sessionStorage.getItem('admin_token')
      const headers = { 'Authorization': `Bearer ${tokenList}` }
      const urls = []
      if (sidStr) {
        urls.push(`http://localhost:5000/api/admin/freshman-enrollments?student_id=${encodeURIComponent(sidStr)}`)
        urls.push(`http://localhost:5000/api/admin/freshman-enrollments?status=pending&student_id=${encodeURIComponent(sidStr)}`)
        urls.push(`http://localhost:5000/api/admin/freshman-enrollments?status=processing&student_id=${encodeURIComponent(sidStr)}`)
        urls.push(`http://localhost:5000/api/admin/freshman-enrollments?status=approved&student_id=${encodeURIComponent(sidStr)}`)
        urls.push(`http://localhost:5000/api/admin/freshman-enrollments?status=accepted&student_id=${encodeURIComponent(sidStr)}`)
      }
      urls.push('http://localhost:5000/api/admin/freshman-enrollments')

      let list = []
      for (const u of urls) {
        try {
          const r = await fetch(u, { headers })
          if (!r.ok) continue
          const j = await r.json().catch(() => ([]))
          if (Array.isArray(j)) { list = j; break }
        } catch (_) { /* try next */ }
      }
      if (Array.isArray(list) && list.length) {
        const acceptable = new Set(['pending','processing','approved','accepted'])
        const fname = (student.first_name || student.firstName || '').trim().toLowerCase()
        const lname = (student.last_name || student.lastName || '').trim().toLowerCase()
        const email = (student.email || '').trim().toLowerCase()
        const mobile = (student.mobile || student.contact_number || '').trim()
        const filtered = list.filter(e => {
          const st = String(e.status || '').toLowerCase()
          if (!acceptable.has(st)) return false
          const esid = e.student_id || e.studentNumber || e.student_no
          if (sidStr && String(esid) === String(sidStr)) return true
          // Fallback matching by name/email when student_id absent
          const ef = (e.first_name || '').trim().toLowerCase()
          const el = (e.last_name || '').trim().toLowerCase()
          const ee = (e.email || '').trim().toLowerCase()
          const em = (e.mobile || '').trim()
          const nameMatch = ef === fname && el === lname
          const contactMatch = (!!email && ee === email) || (!!mobile && em === mobile)
          return nameMatch || contactMatch
        })
        filtered.sort((a,b) => {
          const at = new Date(a.created_at || a.createdAt || 0).getTime()
          const bt = new Date(b.created_at || b.createdAt || 0).getTime()
          if (at !== bt) return bt - at
          return (b.id || 0) - (a.id || 0)
        })
        item = filtered[0] || null
      }

      // If list search failed, attempt a direct by-id fetch (may 404 if id is from regular enrollments)
      if (!item) {
        const token = sessionStorage.getItem('admin_token')
        const res = await fetch(`http://localhost:5000/api/admin/freshman-enrollments/${cachedEnrollment.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) {
          if (res.status === 401) throw new Error('Unauthorized. Please login again.')
        } else {
          const data = await res.json().catch(() => ({}))
          if (data && !data.error) item = data
        }
      }

      // If not found by either path, show minimal cached view
      if (!item) {
        // Still nothing; present cached minimal view to avoid blank modal
        selectedEnrollment.value = {
          student_id: student.student_id,
          first_name: student.first_name,
          middle_name: student.middle_name,
          last_name: student.last_name,
          status: cachedEnrollment?.status || '',
          admission_type: cachedEnrollment?.admission_type || student.admission_type,
          course_id: cachedEnrollment?.course_id || student.course_id,
          year_level: cachedEnrollment?.year_level || student.year_level,
          email: student.email,
          mobile: student.mobile,
          documents: {},
          section_name: cachedSection?.name || cachedSection?.section_name,
          section: cachedSection?.code || cachedSection?.name,
          schedules: cachedSchedules
        }
        regFormError.value = 'Registration form not found for this student.'
        regFormLoading.value = false
        return
      }

      // Parse documents if string
      let documents = {}
      try {
        if (item.documents) documents = typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || {})
      } catch (_) { documents = {} }

      selectedEnrollment.value = {
        // Identity
        student_id: item.student_id || student.student_id,
        first_name: item.first_name || student.first_name,
        middle_name: item.middle_name || student.middle_name,
        last_name: item.last_name || student.last_name,
        // Core enrollment
        id: item.id || cachedEnrollment.id,
        status: item.status || cachedEnrollment.status,
        admission_type: item.admission_type || cachedEnrollment.admission_type,
        course_id: item.course_id || cachedEnrollment.course_id || student.course_id,
        year_level: item.year_level || cachedEnrollment.year_level,
        // Contact
        email: item.email || student.email,
        mobile: item.mobile || student.mobile,
        address_line: item.address_line || '',
        barangay: item.barangay || '',
        city: item.city || '',
        province: item.province || '',
        zip: item.zip || '',
        // Parents/guardian
        father_name: item.father_name,
        mother_name: item.mother_name,
        guardian_name: item.guardian_name,
        guardian_relation: item.guardian_relation,
        // Others
        birthdate: item.birthdate,
        sex: item.sex,
        nationality: item.nationality,
        religion: item.religion,
        shs_name: item.shs_name,
        shs_track: item.shs_track,
        preferred_sched: item.preferred_sched,
        // Documents and assignment
        documents,
        section_name: item.section_name || cachedSection?.name || cachedSection?.section_name,
        section: item.section || cachedSection?.code || cachedSection?.name,
        schedules: Array.isArray(item.schedules) ? item.schedules : (Array.isArray(item.schedule) ? item.schedule : cachedSchedules)
      }
      regFormLoading.value = false
      return
    }

    // No enrollment id: still show what we have from cache + student details
    selectedEnrollment.value = {
      student_id: student.student_id,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      status: cachedEnrollment?.status || '',
      admission_type: cachedEnrollment?.admission_type || student.admission_type,
      course_id: cachedEnrollment?.course_id || student.course_id,
      year_level: cachedEnrollment?.year_level || student.year_level,
      email: student.email,
      mobile: student.mobile,
      documents: {},
      section_name: cachedSection?.name || cachedSection?.section_name,
      section: cachedSection?.code || cachedSection?.name,
      schedules: cachedSchedules
    }
  } catch (e) {
    regFormError.value = e?.message || 'Failed to open registration form.'
  } finally {
    regFormLoading.value = false
  }
}

function closeRegFormModal() {
  showRegFormModal.value = false
  regFormLoading.value = false
  regFormError.value = ''
  regFormShowSchedule.value = false
}

function closeDocumentsModal() {
  showDocsModal.value = false
}

function saveDocuments() {
  if (!selectedEnrollment.value?.id) return
  docsSaving.value = true
  docsError.value = ''
  fetch(`http://localhost:5000/api/admin/freshman-enrollments/${selectedEnrollment.value.id}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documents: docsForm.value })
  })
    .then(async res => {
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || `Failed (${res.status})`)
      }
      return res.json()
    })
    .then(() => {
      // update local copy
      if (selectedEnrollment.value) {
        selectedEnrollment.value.documents = { ...docsForm.value }
      }
      // also update lists if present
      const upd = (list) => {
        const i = Array.isArray(list) ? list.findIndex(x => x.id === selectedEnrollment.value.id) : -1
        if (i !== -1) list[i].documents = { ...docsForm.value }
      }
      upd(processingEnrollments.value)
      if (pendingEnrollments?.value) upd(pendingEnrollments.value)
      docsSaving.value = false
      showDocsModal.value = false
      // Continue to after-action (e.g., accept)
      if (docsAfterSaveAction.value === 'accept') {
        acceptEnrollment(selectedEnrollment.value.id)
      }
    })
    .catch(e => {
      docsSaving.value = false
      docsError.value = e?.message || 'Failed to save documents.'
    })
}

function confirmAccept(enrollment) {
  // Open documents modal first; admin can tick submitted docs. Missing docs are implicitly to follow-up.
  openDocumentsModal(enrollment, 'accept')
}

function openPendingModal() {
  pendingError.value = ''
  showPendingModal.value = true
  fetchPendingEnrollments()
}

function closePendingModal() {
  showPendingModal.value = false
}

function openProcessingModal() {
  processingError.value = ''
  showProcessingModal.value = true
  fetchProcessingEnrollments()
}

function closeProcessingModal() {
  showProcessingModal.value = false
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

function fetchProcessingEnrollments() {
  processingLoading.value = true
  fetch('http://localhost:5000/api/admin/freshman-enrollments?status=processing', {
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(async res => {
      if (!res.ok) {
        if (res.status === 404) throw new Error('Route not found: implement processing status in backend')
        const msg = (await res.json().catch(() => ({})))?.error || `Failed (${res.status})`
        throw new Error(msg)
      }
      return res.json()
    })
    .then(data => {
      processingError.value = ''
      processingEnrollments.value = Array.isArray(data) ? data : []
      processingLoading.value = false
    })
    .catch((e) => {
      processingError.value = e?.message || 'Failed to fetch processing enrollments.'
      processingEnrollments.value = []
      processingLoading.value = false
    })
}

function viewEnrollment(e) {
  if (!e || !e.id) return
  showDetailsModal.value = true
  detailsLoading.value = true
  selectedEnrollment.value = null
  detailsMode.value = 'pending'
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

function processEnrollment(id) {
  if (!id) return
  if (!confirm('Move this enrollment to Processing?')) return
  fetch(`http://localhost:5000/api/admin/freshman-enrollments/${id}/process`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(async res => {
      if (!res.ok) {
        if (res.status === 404) throw new Error('Route not found: add POST /:id/process in backend')
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || `Failed (${res.status})`)
      }
      return res.json()
    })
    .then(() => {
      // Refresh lists and close details
      fetchPendingEnrollments()
      fetchProcessingEnrollments()
      showDetailsModal.value = false
      notifMessage.value = 'Enrollment marked as processing.'
      showNotifModal.value = true
    })
    .catch((e) => {
      pendingError.value = e?.message || 'Failed to mark as processing.'
    })
}

function acceptEnrollment(id) {
  if (!id) return
  if (!confirm('Accept this enrollment?')) return
  fetch(`http://localhost:5000/api/admin/freshman-enrollments/${id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
  })
    .then(async res => {
      if (!res.ok) {
        if (res.status === 404) throw new Error('Route not found: ensure /:id/accept allows processing→accepted')
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || `Failed (${res.status})`)
      }
      return res.json()
    })
    .then(data => {
      // Refresh pending and accepted lists and close details if open
      fetchPendingEnrollments()
      fetchProcessingEnrollments()
      fetchStudents()
      showDetailsModal.value = false
      const code = data.student_code || data.student_id
      const dbid = data.student_db_id
      notifMessage.value = 'Enrollment accepted.'
      showNotifModal.value = true
    })
    .catch((e) => {
      pendingError.value = e?.message || 'Failed to accept enrollment.'
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
  // Accept autofill fallbacks from freshmanForm for shared fields
  f.address = (f.address || freshmanForm.value.address_line || '').trim()
  f.contact_number = (f.contact_number || freshmanForm.value.mobile || '').trim()
  f.email = (f.email || freshmanForm.value.email || '').trim()

  if (!f.first_name) { validationError.value = 'First name is required.'; return false }
  if (!nameRe.test(f.first_name)) { validationError.value = 'First name should contain letters and spaces only.'; return false }
  if (!f.last_name) { validationError.value = 'Last name is required.'; return false }
  if (!nameRe.test(f.last_name)) { validationError.value = 'Last name should contain letters and spaces only.'; return false }
  if (f.middle_name && !nameRe.test(f.middle_name)) { validationError.value = 'Middle name should contain letters and spaces only.'; return false }
  // Accept gender from either student form or freshman form's sex field
  if (!((f.gender || '').trim() || (freshmanForm.value.sex || '').trim())) { validationError.value = 'Please select a gender.'; return false }
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
          const entry = { name: course.name, code: course.code }
          map[course.id] = entry
          map[String(course.id)] = entry
        })
        coursesMap.value = map
      }
    })
    .catch(() => {
      console.error('Failed to load courses')
    })
}

onMounted(() => {
  // Initial data fetch
  fetchStudents()
  fetchCourses()
  loadRegions()
})
</script>
