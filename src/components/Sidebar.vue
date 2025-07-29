<template>
  <div>
    <transition name="slide">
      <aside
        v-if="show"
        class="fixed top-0 left-0 h-full w-64 bg-blue-900 flex flex-col py-6 shadow-lg z-50 sm:static sm:w-68 sm:block transition-transform duration-300"
        :class="{ 'translate-x-0': show, '-translate-x-full': !show, 'sm:translate-x-0': true }"
      >
        <button class="sm:hidden absolute top-4 right-4 text-yellow-300 text-2xl" @click="$emit('toggle')" aria-label="Close sidebar">&times;</button>
        <!-- Session info for mobile only at the very top -->
        <div v-if="sessionInfo" class="sm:hidden text-yellow-300 font-semibold mb-2 pb-5 px-4 truncate">
          <template v-if="isAdmin">Hello, {{ sessionInfo }}</template>
          <template v-else>Hello, {{ sessionInfo }}</template>
        </div>
        <nav class="flex-1 overflow-y-auto">
          <ul>
            <li v-for="link in links" :key="link.to" class="mb-2">
              <router-link
                :to="link.to"
                class="flex items-center px-4 py-2 rounded-l-full transition-colors text-sm sm:text-base"
                :class="{
                  'bg-yellow-300 text-blue-900 font-bold': $route.path === link.to,
                  'text-white hover:bg-blue-800 hover:text-yellow-300': $route.path !== link.to
                }"
                @click="handleMenuClick"
              >
                <span class="mr-3">
                  <component :is="link.icon" class="w-5 h-5" />
                </span>
                {{ link.name }}
              </router-link>
            </li>
          </ul>
        </nav>
        <!-- Logout for mobile only at the bottom -->
        <div class="sm:hidden mt-6 border-t border-blue-800 pt-4 px-4">
          <button v-if="onLogout" @click="onLogout" class="w-full bg-yellow-300 text-blue-900 px-3 py-2 rounded font-semibold hover:bg-yellow-400 transition">Logout</button>
        </div>
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
const props = defineProps({
  links: Array,
  show: Boolean,
  sessionInfo: String,
  onLogout: Function,
  isAdmin: Boolean,
})

const emitToggle = defineEmits(['toggle'])

function handleMenuClick() {
  // Only emit toggle if on mobile (screen < 640px)
  if (window.innerWidth < 640) {
    setTimeout(() => {
      emitToggle()
    }, 100)
  }
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(-100%);
}
.slide-enter-to, .slide-leave-from {
  transform: translateX(0);
}
</style> 