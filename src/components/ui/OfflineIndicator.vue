<script setup>
import { useOfflineStatus } from '../../composables/useOfflineStatus'

const { isOffline } = useOfflineStatus()
</script>

<template>
  <div 
    v-if="isOffline" 
    class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center space-x-2"
  >
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>Anda sedang offline</span>
  </div>
</template>