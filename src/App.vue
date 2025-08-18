<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import api from './services/api' // ✅ Tambahkan import yang hilang
import syncService from './services/sync'
import UpdatePrompt from './components/ui/UpdatePrompt.vue'
import OfflineIndicator from './components/ui/OfflineIndicator.vue'

const router = useRouter()
const authStore = useAuthStore()

// Interval untuk validasi session (setiap 5 menit)
let sessionValidationInterval

onMounted(async () => {
  console.log('App mounted, checking authentication')
  
  if (authStore.isAuthenticated) {
    // Pastikan token ada di header sebelum fetch permissions
    if (authStore.token) {
      // Set authorization header yang mungkin hilang setelah refresh
      api.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    }
    
    // Validate session first
    const isValid = await authStore.validateSession()
    console.log('Session validation result:', isValid)
    
    if (!isValid) {
      console.log('Session invalid, redirecting to login')
      router.push('/login')
      return
    }
    
    // Initialize sync if authenticated
    try {
      await syncService.initializeSync()
    } catch (error) {
      console.error('Failed to initialize sync:', error)
    }
    
    // Set up periodic session validation
    sessionValidationInterval = setInterval(async () => {
      console.log('Performing periodic session validation')
      const isStillValid = await authStore.validateSession()
      
      // ✅ Tambahkan redirect otomatis jika session tidak valid
      if (!isStillValid) {
        console.log('Periodic validation failed, redirecting to login')
        if (router.currentRoute.value.name !== 'login') {
          router.push({ 
            name: 'login', 
            query: { redirect: router.currentRoute.value.fullPath } 
          })
        }
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
  } else if (router.currentRoute.value.meta.requiresAuth !== false) {
    console.log('User is not authenticated, redirecting to login')
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
