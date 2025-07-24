<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center px-2" style="background-image: url('/src/img/background.jpg');">
    <div class="bg-white bg-opacity-90 p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border-t-8 border-blue-900 mx-auto">
      <img src="@/img/logo.png" alt="NCST Logo" class="mx-auto mb-6 w-20" />
      <h2 class="text-base sm:text-2xl font-bold text-blue-900 text-center mb-4">NCST Admin Portal</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-blue-900 mb-1">Username</label>
          <input v-model="username" type="text" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
        </div>
        <div class="mb-6">
          <label class="block text-blue-900 mb-1">Password</label>
          <input v-model="password" type="password" class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
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
import { useAdminStore } from '@/stores/admin'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const adminStore = useAdminStore()

onMounted(() => {
  if (adminStore.admins && adminStore.admins.role === 'admin') {
    router.replace('/admin/sections')
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    adminStore.setAdmin(data.admin || data.user, data.token)
    router.push('/admin/sections')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script> 