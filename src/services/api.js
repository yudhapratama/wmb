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
    
    // Skip refresh for auth endpoints to prevent infinite loops
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error)
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      console.log('API Interceptor: Token expired, attempting refresh...')
      
      try {
        const authStore = useAuthStore()
        
        // Safety check: reset stuck refresh flag (older than 10 seconds)
        if (authStore.isRefreshing && authStore.refreshStartTime && 
            (Date.now() - authStore.refreshStartTime) > 10000) {
          console.log('API Interceptor: Resetting stuck refresh flag')
          authStore.isRefreshing = false
        }
        
        // Check if refresh is already in progress
        if (authStore.isRefreshing) {
          console.log('API Interceptor: Refresh already in progress, waiting...')
          // Wait for refresh to complete with timeout
          let waitTime = 0
          const maxWait = 5000 // 5 seconds max wait
          
          while (authStore.isRefreshing && waitTime < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100))
            waitTime += 100
          }
          
          if (authStore.token && !authStore.isRefreshing) {
            console.log('API Interceptor: Refresh completed, retrying with new token')
            originalRequest.headers.Authorization = `Bearer ${authStore.token}`
            return api(originalRequest)
          } else {
            console.log('API Interceptor: Refresh timeout or failed')
            return Promise.reject(error)
          }
        }
        
        const refreshSuccess = await authStore.refreshToken()
        
        if (refreshSuccess && authStore.token) {
          console.log('API Interceptor: Refresh successful, retrying request')
          originalRequest.headers.Authorization = `Bearer ${authStore.token}`
          return api(originalRequest)
        } else {
          console.log('API Interceptor: Refresh failed, logging out')
          authStore.logout()
          
          // Redirect to login
          if (router.currentRoute.value.name !== 'Login') {
            router.push({ name: 'Login', query: { expired: 'true' } })
          }
        }
      } catch (refreshError) {
        console.error('API Interceptor: Error during refresh:', refreshError)
        const authStore = useAuthStore()
        authStore.logout()
        
        if (router.currentRoute.value.name !== 'Login') {
          router.push({ name: 'Login', query: { expired: 'true' } })
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api