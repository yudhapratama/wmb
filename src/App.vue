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
  // console.log('App mounted, checking authentication', authStore)
  // ✅ Hanya fetch permissions jika user sudah authenticated
  if (authStore.isAuthenticated) {
    // Pastikan token ada di header sebelum fetch permissions
    if (authStore.token) {
      // Set authorization header yang mungkin hilang setelah refresh
      api.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    }
    
    // Validate session first
    const isValid = await authStore.validateSession()
    // console.log('Session validation result:', isValid)
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
    // console.log('User is not authenticated, redirecting to login',router.currentRoute.value.meta.requiresAuth)
    router.push('/login')
  }
  
  // Set up sync event listeners (bisa dilakukan tanpa autentikasi)
  syncService.setupEventListeners()
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
