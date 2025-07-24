<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top Navbar -->
    <nav class="sticky top-0 z-30 flex items-center justify-between bg-blue-900 px-4 sm:px-6 py-3 shadow flex-wrap">
      <div class="flex items-center gap-2 min-w-0">
        <button class="sm:hidden mr-2 text-yellow-300 focus:outline-none" @click="sidebarOpen = !sidebarOpen">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <img src="@/img/logo.png" alt="NCST Logo" class="h-8 w-8 sm:h-10 sm:w-auto mr-2" />
        <span class="truncate text-base sm:text-xl font-bold tracking-wide text-white">NCST Enrollment System</span>
      </div>
      <div class="sm:flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 min-w-0 hidden">
        <span class="text-xs sm:text-base text-yellow-300 font-semibold truncate">
          Hello, {{ $pinia.state.value.user.user?.first_name?.toUpperCase() }} {{ $pinia.state.value.user.user?.last_name?.toUpperCase() }}
        </span>
        <button @click="logout" class="bg-yellow-300 text-blue-900 px-2 py-1 sm:px-3 rounded font-semibold hover:bg-yellow-400 transition w-full sm:w-auto">Logout</button>
      </div>
    </nav>
    <div class="flex flex-1">
      <Sidebar :links="links" :show="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" :is-admin="false" :session-info="($pinia.state.value.user.user?.first_name?.toUpperCase() || '') + ' ' + ($pinia.state.value.user.user?.last_name?.toUpperCase() || '')" :on-logout="logout" />
      <div class="max-w-screen-xl mx-auto w-full flex-1 flex flex-col px-2 sm:px-6">
        <main class="flex-1 w-full">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { AcademicCapIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/vue/24/outline'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const sidebarOpen = ref(window.innerWidth >= 640)
window.addEventListener('resize', () => {
  sidebarOpen.value = window.innerWidth >= 640
})

function logout() {
  userStore.logout()
  router.push('/login')
}

const links = [
  { name: 'Enrollment', icon: AcademicCapIcon, to: '/student/enrollment' },
  { name: 'Accountabilities', icon: DocumentTextIcon, to: '/student/accountabilities' },
  { name: 'Grades', icon: ChartBarIcon, to: '/student/grades' },
]

// Auto-close sidebar on mobile after navigation
let removeAfterEach
onMounted(() => {
  removeAfterEach = router.afterEach(() => {
    if (window.innerWidth < 640) {
      sidebarOpen.value = false
    }
  })
})
onUnmounted(() => {
  if (removeAfterEach) removeAfterEach()
})
</script> 