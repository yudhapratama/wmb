import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { VueQueryPlugin } from '@tanstack/vue-query'
import router from './router'
import './style.css'
import App from './App.vue'
import { registerServiceWorker } from './services/serviceWorker'
import { useAuthStore } from './stores/auth'

// Initialize Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Create and mount the app
const app = createApp(App)

// Register plugins
app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, {
  // Vue Query options
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

// ✅ Pulihkan session setelah pinia diinisialisasi
const authStore = useAuthStore()
console.log(authStore)
if (authStore.token) {
  authStore.restoreSession()
}

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
}

// Register service worker for offline capabilities
registerServiceWorker()

// Mount the app
app.mount('#app')
