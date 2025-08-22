import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8055',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor dengan automatic refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // ✅ Tambahkan pengecekan _skipAuthRefresh untuk mencegah infinite loop
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipAuthRefresh) {
      originalRequest._retry = true
      
      console.log('Token expired, attempting refresh...')
      const authStore = useAuthStore()
      const refreshSuccess = await authStore.refreshToken()
      
      if (refreshSuccess) {
        // Update header dan retry
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`
        return api(originalRequest)
      } else {
        console.log('Refresh failed, forcing complete logout')
        authStore.logout()
        
        // Redirect ke login dengan parameter untuk clear cache
        if (router.currentRoute.value.name !== 'Login') {
          router.push({ name: 'Login', query: { expired: 'true' } })
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api