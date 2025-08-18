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
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipAuthRefresh) {
      originalRequest._retry = true
      
      const authStore = useAuthStore()
      
      console.log('Token expired, attempting refresh...')
      
      // Coba refresh token dulu
      const refreshSuccess = await authStore.refreshToken()
      
      if (refreshSuccess) {
        console.log('Token refresh successful, retrying original request')
        // Jika refresh berhasil, retry request asli dengan token baru
        originalRequest.headers['Authorization'] = `Bearer ${authStore.token}`
        return api(originalRequest)
      } else {
        console.log('Token refresh failed, logging out user')
        // Jika refresh gagal, logout dan redirect ke login
        authStore.logout()
        
        // Redirect ke login hanya jika tidak sedang di halaman login
        if (router.currentRoute.value.name !== 'login') {
          console.log('Redirecting to login page')
          router.push({ 
            name: 'login', 
            query: { redirect: router.currentRoute.value.fullPath } 
          })
        }
        
        return Promise.reject(error)
      }
    }
    
    // ✅ Tambahkan handling untuk error lainnya
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data)
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

export default api