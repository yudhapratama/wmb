<script setup>
import { ref, onMounted } from 'vue'
import { updateServiceWorker } from '../../services/serviceWorker'

const showUpdatePrompt = ref(false)

onMounted(() => {
  // Listen for service worker update events
  window.addEventListener('sw-update-available', () => {
    showUpdatePrompt.value = true
  })
})

function updateApp() {
  updateServiceWorker()
  showUpdatePrompt.value = false
}
</script>

<template>
  <div v-if="showUpdatePrompt" class="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
    <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      <div class="p-2 rounded-lg bg-blue-600 shadow-lg sm:p-3">
        <div class="flex items-center justify-between flex-wrap">
          <div class="w-0 flex-1 flex items-center">
            <span class="flex p-2 rounded-lg bg-blue-800">
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            <p class="ml-3 font-medium text-white truncate">
              <span>Versi baru tersedia! Perbarui aplikasi untuk mendapatkan fitur terbaru.</span>
            </p>
          </div>
          <div class="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <button
              @click="updateApp"
              class="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50"
            >
              Perbarui Sekarang
            </button>
          </div>
          <div class="order-2 flex-shrink-0 sm:order-3 sm:ml-2">
            <button
              @click="showUpdatePrompt = false"
              type="button"
              class="-mr-1 flex p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>