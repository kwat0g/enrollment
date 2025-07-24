<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <main class="flex-1 flex flex-col">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const adminStore = useAdminStore()

onMounted(() => {
  userStore.loadFromStorage()
  adminStore.loadFromStorage()
})

function logout() {
  if (userStore.user && userStore.user.role === 'student') {
    userStore.logout()
    router.push('/login')
  } else if (adminStore.admins && adminStore.admins.role === 'admin') {
    adminStore.logout()
    router.push('/@dminlogin-')
  }
}
</script>

<style>
/* Custom font or global styles can go here */
</style>
