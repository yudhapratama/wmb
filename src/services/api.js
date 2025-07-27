import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Create axios instance with default config
const api = axios.create({
  // Directus API URL without /api suffix (Directus v11.9.2)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8055',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor for API calls
// Request interceptor untuk memastikan token selalu ada
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

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const authStore = useAuthStore()
      authStore.logout()
      
      // Redirect to login page will be handled by router guard
      return Promise.reject(error)
    }
    
    return Promise.reject(error)
  }
)

export default api