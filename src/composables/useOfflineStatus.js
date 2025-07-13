import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for tracking online/offline status
 * @returns {Object} Online status and related methods
 */
export function useOfflineStatus() {
  const isOffline = ref(false)
  const wasOffline = ref(false)
  
  // Update online status
  const updateOnlineStatus = () => {
    wasOffline.value = isOffline.value
    isOffline.value = !navigator.onLine
  }
  
  // Set up event listeners
  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus() // Initial check
  })
  
  // Clean up event listeners
  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })
  
  // Check if we just came back online
  const justCameOnline = () => wasOffline.value && !isOffline.value
  
  return {
    isOffline,
    wasOffline,
    justCameOnline
  }
}