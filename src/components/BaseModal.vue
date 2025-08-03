<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
      @keydown.esc.window="onClose"
      @click.self="onClose"
      tabindex="-1"
      ref="modalOverlay"
    >
      <div
        class="bg-white rounded-lg max-w-md w-full mx-4 shadow-2xl border border-gray-200 overflow-hidden relative focus:outline-none"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        ref="modalContent"
      >
        <!-- Header slot -->
        <div class="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <slot name="header">
            <h2 :id="titleId" class="text-lg font-semibold text-gray-900">Modal</h2>
          </slot>
          <button @click="onClose" class="text-gray-400 hover:text-red-500 p-2 rounded-full focus:outline-none" aria-label="Close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- Body slot -->
        <div class="overflow-y-auto max-h-[60vh]">
          <slot />
        </div>
        <!-- Footer slot -->
        <div v-if="$slots.footer" class="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  show: Boolean,
  onClose: {
    type: Function,
    required: true
  },
  titleId: {
    type: String,
    default: 'modal-title'
  }
})

const modalOverlay = ref(null)
const modalContent = ref(null)

// Focus trap for accessibility
watch(
  () => props.show,
  async (val) => {
    if (val) {
      await nextTick()
      if (modalContent.value) {
        modalContent.value.focus()
      }
    }
  }
)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
