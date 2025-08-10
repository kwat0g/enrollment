<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center bg-fixed px-2" style="background-image: url('/src/img/background.jpg');">
    <!-- Success Modal Overlay -->
    <div v-if="submitSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-2xl p-6 w-11/12 max-w-md text-center">
        <h3 class="text-lg font-semibold text-blue-900 mb-2">Success</h3>
        <p class="text-gray-700 mb-2">{{ successMessage }}</p>
        <p class="text-xs text-gray-500">This page will refresh in 5 seconds.</p>
      </div>
    </div>
    <div class="bg-white bg-opacity-90 p-4 sm:p-8 md:p-6 rounded-xl shadow-2xl w-full max-w-3xl border-t-8 border-blue-900 mx-auto">
      <img src="@/img/logo.png" alt="NCST Logo" class="mx-auto mb-4 w-16" />
      <h2 class="text-base sm:text-2xl font-bold text-blue-900 text-center mb-4">Online Admission</h2>

      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-2 mb-4">
        <template v-for="n in totalSteps" :key="n">
          <div :class="['h-2 rounded-full transition-all', n <= step ? 'bg-blue-900' : 'bg-blue-100', n === step ? 'w-10' : 'w-6']"></div>
        </template>
      </div>

      <div v-if="stepError" class="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{{ stepError }}</div>

      <div v-if="submitSuccess" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        {{ successMessage }}

      </div>
      <div v-if="submitError" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ submitError }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3" novalidate>
        <!-- Personal Information -->
        <section v-show="step === 1">
          <h3 class="text-lg font-semibold text-blue-900 mb-1">Personal Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1">First Name<span class="text-red-600">*</span></label>
              <input
                v-model.trim="form.first_name"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm"
                pattern="^[A-Za-z ]+$"
                title="Letters and spaces only"
                required
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Last Name<span class="text-red-600">*</span></label>
              <input
                v-model.trim="form.last_name"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm"
                pattern="^[A-Za-z ]+$"
                title="Letters and spaces only"
                required
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Middle Name</label>
              <input
                v-model.trim="form.middle_name"
                type="text"
                class="w-full border rounded px-3 py-1.5 text-sm"
                pattern="^[A-Za-z ]+$"
                title="Letters and spaces only"
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Suffix (Optional)</label>
              <input v-model.trim="form.suffix" type="text" class="w-full border rounded px-3 py-1.5 text-sm" placeholder="Jr., II, etc." />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Birthdate<span class="text-red-600">*</span></label>
              <input v-model="form.birthdate" type="date" class="w-full border rounded px-3 py-1.5 text-sm" required />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Gender</label>
              <select v-model="form.sex" class="w-full border rounded px-3 py-1.5 text-sm" required>
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Civil Status</label>
              <select v-model="form.civil_status" class="w-full border rounded px-3 py-1.5 text-sm" required>
                <option value="">-- Select --</option>
                <option>Single</option>
                <option>Married</option>
                <option>Separated</option>
                <option>Widowed</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Nationality<span class="text-red-600">*</span></label>
              <select v-model="form.nationality" class="w-full border rounded px-3 py-1.5 text-sm" required>
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
              <input v-model.trim="form.place_of_birth" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Religion</label>
              <select v-model="form.religion" class="w-full border rounded px-3 py-1.5 text-sm">
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
        </section>

        <!-- Contact Information -->
        <section v-show="step === 2">
          <h3 class="text-lg font-semibold text-blue-900 mb-1">Contact Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1">Email<span class="text-red-600">*</span></label>
              <input v-model.trim="form.email" type="email" class="w-full border rounded px-3 py-1.5 text-sm" required />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Mobile Number<span class="text-red-600">*</span></label>
              <input
                v-model.trim="form.mobile"
                type="tel"
                inputmode="numeric"
                pattern="^09\\d{9}$"
                maxlength="11"
                class="w-full border rounded px-3 py-1.5 text-sm"
                placeholder="09XXXXXXXXX"
                required
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Region<span class="text-red-600">*</span></label>
              <select v-model="form.region_code" class="w-full border rounded px-3 py-1.5 text-sm">
                <option value="">-- Select Region --</option>
                <option v-for="r in regions" :key="r.code" :value="r.code">{{ r.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Province<span class="text-red-600" v-if="provinces.length">*</span></label>
              <select v-model="form.province_code" class="w-full border rounded px-3 py-1.5 text-sm" :disabled="!provinces.length">
                <option value="">-- Select Province --</option>
                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Town/Municipality/City<span class="text-red-600">*</span></label>
              <select v-model="form.city_code" class="w-full border rounded px-3 py-1.5 text-sm" :disabled="!cities.length">
                <option value="">-- Select City/Municipality --</option>
                <option v-for="c in cities" :key="c.code" :value="c.code">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Barangay<span class="text-red-600">*</span></label>
              <select v-model="form.barangay_code" class="w-full border rounded px-3 py-1.5 text-sm" :disabled="!barangays.length">
                <option value="">-- Select Barangay --</option>
                <option v-for="b in barangays" :key="b.code" :value="b.code">{{ b.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Address Line</label>
              <input v-model.trim="form.address_line" type="text" class="w-full border rounded px-3 py-1.5 text-sm" placeholder="House No., Street" required />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">ZIP Code<span class="text-red-600">*</span></label>
              <input
                v-model.trim="form.zip"
                type="text"
                inputmode="numeric"
                pattern="^\\d{4}$"
                maxlength="4"
                class="w-full border rounded px-3 py-1.5 text-sm"
                placeholder="e.g. 4100"
                required
              />
            </div>
          </div>
        </section>

        <!-- Parent/Guardian Information -->
        <section v-show="step === 3">
          <h3 class="text-lg font-semibold text-blue-900 mb-1">Parent/Guardian Information</h3>
          <!-- Father Information -->
          <div class="mb-2">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Father Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Full Name</label>
                <input v-model.trim="form.father_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Occupation</label>
                <input v-model.trim="form.father_occupation" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Contact Number</label>
                <input
                  v-model.trim="form.father_contact"
                  type="tel"
                  inputmode="numeric"
                  pattern="^09\\d{9}$"
                  maxlength="11"
                  class="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="09XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          <!-- Mother Information -->
          <div class="mb-2">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Mother Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Full Name</label>
                <input v-model.trim="form.mother_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Occupation</label>
                <input v-model.trim="form.mother_occupation" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Contact Number</label>
                <input
                  v-model.trim="form.mother_contact"
                  type="tel"
                  inputmode="numeric"
                  pattern="^09\\d{9}$"
                  maxlength="11"
                  class="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="09XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          <!-- Guardian Information -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-1">Guardian Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Full Name</label>
                <input v-model.trim="form.guardian_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Relationship</label>
                <select v-model="form.guardian_relation" class="w-full border rounded px-3 py-1.5 text-sm">
                  <option value="">-- Select --</option>
                  <option>Grandparent</option>
                  <option>Sibling</option>
                  <option>Aunt/Uncle</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Contact Number</label>
                <input
                  v-model.trim="form.guardian_contact"
                  type="tel"
                  inputmode="numeric"
                  pattern="^09\\d{9}$"
                  maxlength="11"
                  class="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="09XXXXXXXXX"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Academic Background -->
        <section v-show="step === 4">
          <h3 class="text-lg font-semibold text-blue-900 mb-1">Academic Background</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1">Senior High School Name</label>
              <input v-model.trim="form.shs_name" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Track/Strand</label>
              <input v-model.trim="form.shs_track" type="text" class="w-full border rounded px-3 py-1.5 text-sm" />
            </div>
          </div>
        </section>

        <!-- Desired Program -->
        <section v-show="step === 4">
          <h3 class="text-lg font-semibold text-blue-900 mb-1">Desired Program</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1">Course<span class="text-red-600">*</span></label>
              <select v-model.number="form.course_id" class="w-full border rounded px-3 py-1.5 text-sm" required>
                <option :value="null">-- Select --</option>
                <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.code }} - {{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Preferred Schedule</label>
              <select v-model="form.preferred_sched" class="w-full border rounded px-3 py-1.5 text-sm">
                <option value="">-- Select --</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Admission Type</label>
              <select v-model="form.admission_type" class="w-full border rounded px-3 py-1.5 text-sm">
                <option value="">-- Select Type --</option>
                <option>Freshman</option>
                <option>Transferee</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Year Level</label>
              <select v-model="form.year" :disabled="form.admission_type==='Freshman'" class="w-full border rounded px-3 py-1.5 text-sm">
                <option value="">-- Select Year --</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Document uploads not required -->
        <!-- (Removed per request) -->

        <!-- Consent -->
        <section v-show="step === 5">
          <div class="flex items-start gap-2">
            <input id="consent" v-model="form.consent" type="checkbox" class="mt-1" />
            <label for="consent" class="text-gray-700 text-xs">I certify that the information provided is true and correct and I agree to the processing of my data for enrollment purposes.<span class="text-red-600">*</span></label>
          </div>
        </section>

        <!-- Navigation -->
        <div class="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
          <button type="button" @click="prevStep" :disabled="step === 1 || submitting" class="w-full sm:w-auto px-4 py-2 rounded border border-blue-900 text-blue-900 font-semibold hover:bg-blue-50 disabled:opacity-50">Back</button>
          <div class="flex-1"></div>
          <button v-if="step < totalSteps" type="button" @click="nextStep" :disabled="submitting" class="w-full sm:w-auto px-4 py-2 rounded bg-blue-900 text-yellow-300 font-semibold hover:bg-yellow-300 hover:text-blue-900 disabled:opacity-50">Next</button>
          <button v-else :disabled="submitting" class="w-full sm:w-auto px-4 py-2 rounded bg-blue-900 text-yellow-300 font-semibold hover:bg-yellow-300 hover:text-blue-900 disabled:opacity-50">{{ submitting ? 'Submitting...' : 'Submit Application' }}</button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const courses = ref([])
const coursesError = ref('')
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const successMessage = ref('Your application has been submitted. We will contact you via email')
const step = ref(1)
const totalSteps = 5
const stepError = ref('')

// PSGC hierarchical lists
const regions = ref([])
const provinces = ref([])
const cities = ref([])
const barangays = ref([])

const PSGC_BASE = 'https://psgc.gitlab.io/api'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json().catch(() => ([]))
  return Array.isArray(data) ? data : []
}

async function fetchRegions() {
  // https://psgc.gitlab.io/api/regions/
  const data = await fetchJson(`${PSGC_BASE}/regions/`)
  regions.value = data.map(r => ({ code: r.code || r.regionCode || r.psgcCode, name: r.name || r.regionName }))
}

async function fetchProvincesByRegion(regionCode) {
  provinces.value = []
  if (!regionCode) return
  // https://psgc.gitlab.io/api/regions/{code}/provinces/
  const data = await fetchJson(`${PSGC_BASE}/regions/${regionCode}/provinces/`)
  provinces.value = data.map(p => ({ code: p.code || p.provinceCode || p.psgcCode, name: p.name || p.provinceName }))
}

async function fetchCitiesByRegion(regionCode) {
  cities.value = []
  if (!regionCode) return
  // Some regions (e.g., NCR) have cities directly
  // https://psgc.gitlab.io/api/regions/{code}/cities-municipalities/
  const data = await fetchJson(`${PSGC_BASE}/regions/${regionCode}/cities-municipalities/`)
  cities.value = data.map(c => ({ code: c.code || c.cityCode || c.municipalityCode || c.psgcCode, name: c.name || c.cityName || c.municipalityName }))
}

async function fetchCitiesByProvince(provinceCode) {
  cities.value = []
  if (!provinceCode) return
  // https://psgc.gitlab.io/api/provinces/{code}/cities-municipalities/
  const data = await fetchJson(`${PSGC_BASE}/provinces/${provinceCode}/cities-municipalities/`)
  cities.value = data.map(c => ({ code: c.code || c.cityCode || c.municipalityCode || c.psgcCode, name: c.name || c.cityName || c.municipalityName }))
}

async function fetchBarangaysByCity(cityCode) {
  barangays.value = []
  if (!cityCode) return
  // https://psgc.gitlab.io/api/cities-municipalities/{code}/barangays/
  const data = await fetchJson(`${PSGC_BASE}/cities-municipalities/${cityCode}/barangays/`)
  barangays.value = data.map(b => ({ code: b.code || b.barangayCode || b.psgcCode, name: b.name || b.barangayName }))
}

const form = ref({
  // Personal
  first_name: '',
  middle_name: '',
  last_name: '',
  suffix: '',
  birthdate: '',
  sex: '',
  civil_status: '',
  nationality: '',
  citizenship: '',
  place_of_birth: '',
  religion: '',
  // Contact
  email: '',
  mobile: '',
  address_line: '',
  region: '',
  province: '',
  city: '',
  barangay: '',
  region_code: '',
  province_code: '',
  city_code: '',
  barangay_code: '',
  zip: '',
  // Guardian
  father_name: '',
  father_occupation: '',
  father_contact: '',
  mother_name: '',
  mother_occupation: '',
  mother_contact: '',
  guardian_name: '',
  guardian_relation: '',
  guardian_contact: '',
  // Academic
  shs_name: '',
  shs_track: '',
  // Program
  course_id: null,
  preferred_sched: '',
  year: '',
  admission_type: '',
  // Docs removed per request
  // Consent
  consent: false,
})

onMounted(() => {
  fetchCourses()
  fetchRegions()
})

async function fetchCourses() {
  const token = sessionStorage.getItem('admin_token') || sessionStorage.getItem('user_token')
  const base = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : 'http://localhost:5000'
  const endpoints = [
    `${base}/api/courses`,
    `${base}/api/public/courses`,
    `${base}/api/admin/courses`,
  ]

  coursesError.value = ''
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const data = await res.json().catch(() => ([]))
      if (!res.ok) {
        // Try next endpoint on 404/Not Found
        if (res.status === 404) continue
        throw new Error(data?.error || `Failed to load courses (${res.status})`)
      }
      courses.value = Array.isArray(data) ? data : (data?.courses || [])
      if (!Array.isArray(courses.value)) courses.value = []
      if (courses.value.length === 0) {
        // If empty, continue to try other endpoints
        continue
      }
      return
    } catch (e) {
      // If network or other error, try next; keep last error for display if all fail
      coursesError.value = e.message || 'Failed to load courses.'
    }
  }
  // All attempts failed
  if (!coursesError.value) coursesError.value = 'Courses endpoint not found (404). Please verify backend route.'
}

// onFileChange removed (no document uploads)

function validate() {
  const nameRe = /^[A-Za-z ]+$/
  if (!form.value.first_name?.trim() || !form.value.last_name?.trim()) return 'Name is required'
  if (!nameRe.test(form.value.first_name)) return 'First Name may only contain letters and spaces.'
  if (!nameRe.test(form.value.last_name)) return 'Last Name may only contain letters and spaces.'
  if (form.value.middle_name?.trim() && !nameRe.test(form.value.middle_name)) return 'Middle Name may only contain letters and spaces.'
  if (!form.value.birthdate) return 'Birthdate is required'
  if (!form.value.sex) return 'Sex is required'
  if (!form.value.civil_status) return 'Civil Status is required'
  if (!form.value.nationality?.trim()) return 'Nationality is required'
  if (!form.value.place_of_birth?.trim()) return 'Place of Birth is required'
  if (!form.value.religion?.trim()) return 'Religion is required'

  if (!form.value.email?.trim()) return 'Email is required'
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.value.email)
  if (!emailOk) return 'Please enter a valid Email address.'

  if (!form.value.mobile?.trim()) return 'Mobile number is required'
  const phoneOk = /^09\d{9}$/.test(form.value.mobile)
  if (!phoneOk) return 'Mobile number must start with 09 and be 11 digits.'

  if (!form.value.region_code) return 'Region is required'
  if (provinces.value.length && !form.value.province_code) return 'Province is required'
  if (!form.value.city_code) return 'Town/City is required'
  if (!form.value.barangay_code) return 'Barangay is required'
  if (!form.value.address_line?.trim()) return 'Address Line is required'
  if (!form.value.zip?.trim()) return 'ZIP Code is required'
  {
    const zipOk = /^\d{4}$/.test(form.value.zip)
    if (!zipOk) return 'ZIP Code must be 4 digits.'
  }
  // Step 3 required fields and contact formats
  if (!form.value.father_name?.trim()) return "Father's Full Name is required"
  if (!form.value.father_occupation?.trim()) return "Father's Occupation is required"
  if (!form.value.father_contact?.trim()) return "Father's Contact Number is required"
  if (!/^09\d{9}$/.test(form.value.father_contact)) return 'Father contact must start with 09 and be 11 digits.'

  if (!form.value.mother_name?.trim()) return "Mother's Full Name is required"
  if (!form.value.mother_occupation?.trim()) return "Mother's Occupation is required"
  if (!form.value.mother_contact?.trim()) return "Mother's Contact Number is required"
  if (!/^09\d{9}$/.test(form.value.mother_contact)) return 'Mother contact must start with 09 and be 11 digits.'

  if (!form.value.guardian_name?.trim()) return 'Guardian Full Name is required'
  if (!form.value.guardian_relation?.trim()) return 'Guardian Relationship is required'
  if (!form.value.guardian_contact?.trim()) return 'Guardian Contact Number is required'
  if (!/^09\d{9}$/.test(form.value.guardian_contact)) return 'Guardian contact must start with 09 and be 11 digits.'
  if (!form.value.course_id) return 'Please select a course'
  if (form.value.admission_type !== 'Freshman' && !form.value.year) return 'Please select a Year Level'
  if (!form.value.admission_type) return 'Please select an Admission Type'
  if (!form.value.consent) return 'Please agree to the consent statement'
  return ''
}

function nextStep() {
  // Per-step validation before advancing
  const err = validateStep(step.value)
  if (err) {
    stepError.value = err
    return
  }
  stepError.value = ''
  if (step.value < totalSteps) step.value += 1
}

function prevStep() {
  if (step.value > 1) step.value -= 1
}

function validateStep(s) {
  // Suffix is optional by request
  if (s === 1) {
    const nameRe = /^[A-Za-z ]+$/
    if (!form.value.first_name?.trim()) return 'Please enter your First Name.'
    if (!nameRe.test(form.value.first_name)) return 'First Name: letters and spaces only.'
    if (!form.value.last_name?.trim()) return 'Please enter your Last Name.'
    if (!nameRe.test(form.value.last_name)) return 'Last Name: letters and spaces only.'
    if (form.value.middle_name?.trim() && !nameRe.test(form.value.middle_name)) return 'Middle Name: letters and spaces only.'
    if (!form.value.birthdate) return 'Please select your Birthdate.'
    if (!form.value.sex) return 'Please select your Sex.'
    if (!form.value.civil_status) return 'Please select your Civil Status.'
    if (!form.value.nationality?.trim()) return 'Please select your Nationality.'
    if (!form.value.place_of_birth?.trim()) return 'Please enter your Place of Birth.'
    if (!form.value.religion?.trim()) return 'Please select your Religion.'
    return ''
  }
  if (s === 2) {
    if (!form.value.email?.trim()) return 'Please enter your Email.'
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.value.email)
    if (!emailOk) return 'Please enter a valid Email address.'
    if (!form.value.mobile?.trim()) return 'Please enter your Mobile Number.'
    const phoneOk = /^09\d{9}$/.test(form.value.mobile)
    if (!phoneOk) return 'Mobile number must start with 09 and be 11 digits.'
    if (!form.value.region_code) return 'Please select a Region.'
    if (provinces.value.length && !form.value.province_code) return 'Please select a Province.'
    if (!form.value.city_code) return 'Please select a Town/City.'
    if (!form.value.barangay_code) return 'Please select a Barangay.'
    if (!form.value.address_line?.trim()) return 'Please enter your Address Line.'
    if (!form.value.zip?.trim()) return 'Please enter your Zip Code.'
    return ''
  }
  if (s === 3) {
    // Require all Step 3 fields
    if (!form.value.father_name?.trim()) return "Please enter Father's Full Name."
    if (!form.value.father_occupation?.trim()) return "Please enter Father's Occupation."
    if (!form.value.father_contact?.trim()) return "Please enter Father's Contact Number."
    if (!/^09\d{9}$/.test(form.value.father_contact)) return "Father contact must start with 09 and be 11 digits."

    if (!form.value.mother_name?.trim()) return "Please enter Mother's Full Name."
    if (!form.value.mother_occupation?.trim()) return "Please enter Mother's Occupation."
    if (!form.value.mother_contact?.trim()) return "Please enter Mother's Contact Number."
    if (!/^09\d{9}$/.test(form.value.mother_contact)) return "Mother contact must start with 09 and be 11 digits."

    if (!form.value.guardian_name?.trim()) return 'Please enter Guardian Full Name.'
    if (!form.value.guardian_relation?.trim()) return 'Please select Guardian Relationship.'
    if (!form.value.guardian_contact?.trim()) return 'Please enter Guardian Contact Number.'
    if (!/^09\d{9}$/.test(form.value.guardian_contact)) return 'Guardian contact must start with 09 and be 11 digits.'
    return ''
  }
  if (s === 4) {
    if (!form.value.shs_name?.trim()) return 'Please enter SHS Name.'
    if (!form.value.shs_track?.trim()) return 'Please enter SHS Track.'
    if (!form.value.preferred_sched?.trim()) return 'Please enter Preferred Schedule.'
    if (!form.value.course_id) return 'Please select a Course.'
    if (!form.value.admission_type) return 'Please select an Admission Type.'
    if (form.value.admission_type !== 'Freshman' && !form.value.year) return 'Please select a Year Level.'
    return ''
  }
  return ''
}

async function handleSubmit() {
  submitError.value = ''
  const v = validate()
  if (v) {
    submitError.value = v
    return
  }
  submitting.value = true
  try {
    // Build JSON payload aligned with backend
    const payload = { ...form.value }
    // Backend expects year_level; our form uses `year`
    payload.year_level = form.value.year
    // Normalize sex to match DB enum
    if (payload.sex === 'Prefer not to say') payload.sex = 'Other'

    const res = await fetch('http://localhost:5000/api/public/freshman-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Submission failed (backend endpoint may be missing).')

    submitSuccess.value = true
    successMessage.value = data.message || successMessage.value
    // Auto-refresh after 5 seconds
    setTimeout(() => {
      window.location.reload()
    }, 5000)
    // Optionally clear form
    // resetForm()
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  const keep = { course_id: form.value.course_id }
  Object.assign(form.value, {
    first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', sex: '', civil_status: '',
    nationality: '', citizenship: '', place_of_birth: '', religion: '',
    email: '', mobile: '', address_line: '', zip: '',
    region: '', province: '', city: '', barangay: '',
    region_code: '', province_code: '', city_code: '', barangay_code: '',
    father_name: '', father_occupation: '', father_contact: '',
    mother_name: '', mother_occupation: '', mother_contact: '',
    guardian_name: '', guardian_relation: '', guardian_contact: '',
    shs_name: '', shs_track: '',
    course_id: keep.course_id || null, preferred_sched: '', year: '', admission_type: '',
    consent: false,
  })
}

// Live-clear step error as the user types or changes step
// Clear the banner as soon as the user starts typing/selecting again
watch([form, step], () => {
  if (stepError.value) {
    stepError.value = ''
  }
}, { deep: true })

// Keep legacy 'citizenship' in sync for backend compatibility
watch(() => form.value.nationality, (val) => {
  form.value.citizenship = val || ''
})

// Auto-fix Year when Admission Type is Freshman; clear when changing away
watch(() => form.value.admission_type, (val) => {
  if (val === 'Freshman') {
    form.value.year = '1st Year'
  } else if (val && form.value.year === '1st Year') {
    form.value.year = ''
  }
})

// Sync names and cascade loads for PSGC selections
watch(() => form.value.region_code, async (code) => {
  // Set region name
  const r = regions.value.find(x => x.code === code)
  form.value.region = r ? r.name : ''
  // Reset and fetch children
  form.value.province_code = ''
  form.value.province = ''
  form.value.city_code = ''
  form.value.city = ''
  form.value.barangay_code = ''
  form.value.barangay = ''
  await fetchProvincesByRegion(code)
  // Some regions (e.g., NCR) may not have provinces; fetch cities by region as fallback
  await fetchCitiesByRegion(code)
})

watch(() => form.value.province_code, async (code) => {
  const p = provinces.value.find(x => x.code === code)
  form.value.province = p ? p.name : ''
  form.value.city_code = ''
  form.value.city = ''
  form.value.barangay_code = ''
  form.value.barangay = ''
  if (code) {
    await fetchCitiesByProvince(code)
  } else if (form.value.region_code) {
    // If province cleared, load cities by region again
    await fetchCitiesByRegion(form.value.region_code)
  }
})

watch(() => form.value.city_code, async (code) => {
  const c = cities.value.find(x => x.code === code)
  form.value.city = c ? c.name : ''
  form.value.barangay_code = ''
  form.value.barangay = ''
  await fetchBarangaysByCity(code)
})

watch(() => form.value.barangay_code, (code) => {
  const b = barangays.value.find(x => x.code === code)
  form.value.barangay = b ? b.name : ''
})
</script>