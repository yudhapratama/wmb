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
    // Tambahkan pengecekan flag _skipAuthRefresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipAuthRefresh) {
      originalRequest._retry = true
      
      const authStore = useAuthStore()
      
      // Coba refresh token dulu
      const refreshSuccess = await authStore.refreshToken()
      
      if (refreshSuccess) {
        // Jika refresh berhasil, retry request asli dengan token baru
        originalRequest.headers['Authorization'] = `Bearer ${authStore.token}`
        return api(originalRequest)
      } else {
        // Jika refresh gagal, logout dan redirect ke login
        authStore.logout()
        
        // Redirect ke login hanya jika tidak sedang di halaman login
        if (router.currentRoute.value.name !== 'login') {
          router.push({ 
            name: 'login', 
            query: { redirect: router.currentRoute.value.fullPath } 
          })
        }
        
        return Promise.reject(error)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api