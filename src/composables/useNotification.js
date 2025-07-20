import { ref } from 'vue'

export function useNotification() {
  const show = ref(false)
  const message = ref('')
  const type = ref('success')
  const duration = ref(3000)
  
  function showNotification(options) {
    message.value = options.message
    type.value = options.type || 'success'
    duration.value = options.duration || 3000
    show.value = true
    
    if (duration.value > 0) {
      setTimeout(() => {
        show.value = false
      }, duration.value)
    }
  }
  
  function showSuccess(message, duration = 3000) {
    showNotification({ message, type: 'success', duration })
  }
  
  function showError(message, duration = 3000) {
    showNotification({ message, type: 'error', duration })
  }
  
  function showWarning(message, duration = 3000) {
    showNotification({ message, type: 'warning', duration })
  }
  
  function showInfo(message, duration = 3000) {
    showNotification({ message, type: 'info', duration })
  }
  
  function hideNotification() {
    show.value = false
  }
  
  return {
    show,
    message,
    type,
    duration,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  }
}