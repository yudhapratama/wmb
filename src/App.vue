<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import syncService from './services/sync'
import UpdatePrompt from './components/ui/UpdatePrompt.vue'
import OfflineIndicator from './components/ui/OfflineIndicator.vue'

const router = useRouter()
const authStore = useAuthStore()

// Interval untuk validasi session (setiap 5 menit)
let sessionValidationInterval

onMounted(async () => {
  // Set up sync event listeners
  syncService.setupEventListeners()
  
  // Check authentication status and redirect if needed
  if (authStore.isAuthenticated) {
    // Validate session first
    const isValid = await authStore.validateSession()
    
    if (!isValid) {
      router.push('/login')
      return
    }
    
    // Initialize sync if authenticated
    await syncService.initializeSync()
    
    // Set up periodic session validation
    sessionValidationInterval = setInterval(async () => {
      await authStore.validateSession()
    }, 5 * 60 * 1000) // Check every 5 minutes
  } else if (router.currentRoute.value.meta.requiresAuth !== false) {
    router.push('/login')
  }
})

onBeforeUnmount(() => {
  // Clear interval when component is unmounted
  if (sessionValidationInterval) {
    clearInterval(sessionValidationInterval)
  }
})
</script>

<template>
  <div class="app-container">
    <router-view />
    <UpdatePrompt />
    <OfflineIndicator />
  </div>
</template>
