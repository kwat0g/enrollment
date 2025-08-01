<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center px-2" style="background-image: url('/src/img/background.jpg');">
    <div class="bg-white bg-opacity-90 p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border-t-8 border-blue-900 mx-auto">
      <img src="@/img/logo.png" alt="NCST Logo" class="mx-auto mb-6 w-20" />
      <h2 class="text-base sm:text-2xl font-bold text-blue-900 text-center mb-4">NCST Enrollment System</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-blue-900 mb-1">Student ID</label>
          <input v-model="studentId" type="text" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
        </div>
        <div class="mb-6">
          <label class="block text-blue-900 mb-1">Last Name</label>
          <input v-model="lastName" type="password" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
        </div>
        <button :disabled="loading" class="w-full bg-blue-900 text-yellow-300 py-2 rounded font-semibold hover:bg-yellow-300 hover:text-blue-900 transition">{{ loading ? 'Logging in...' : 'Login' }}</button>
        <div v-if="error" class="text-red-600 text-center mt-4">{{ error }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const studentId = ref('')
const lastName = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const userStore = useUserStore()

onMounted(() => {
  if (userStore.user && userStore.user.role === 'student') {
    router.replace('/student/enrollment')
  } else if (userStore.user && userStore.user.role === 'admin') {
    router.replace('/admin/students')
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: studentId.value, lastName: lastName.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    console.log("Login successful")
    userStore.setUser(data.user, data.token)
    
    // Redirect based on user role
    if (data.user.role === 'admin') {
      router.push('/admin/students')
    } else {
      router.push('/student/enrollment')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script> 