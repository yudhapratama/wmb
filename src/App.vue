<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import syncService from './services/sync'
import UpdatePrompt from './components/ui/UpdatePrompt.vue'
import OfflineIndicator from './components/ui/OfflineIndicator.vue'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // Set up sync event listeners
  syncService.setupEventListeners()
  
  // Check authentication status and redirect if needed
  if (!authStore.isAuthenticated && router.currentRoute.value.meta.requiresAuth !== false) {
    router.push('/login')
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
