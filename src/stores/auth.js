import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(null)
  const user = ref(null)
  const role = ref(null)
  
  // Getters
  const isAuthenticated = computed(() => !!token.value)
  
  // Actions
  async function login(email, password) {
    try {
      // Use the correct Directus API endpoint
      const response = await api.post('/auth/login', { email, password, mode: 'json' })
      
      token.value = response.data.data.access_token
      user.value = response.data.data.user
      role.value = response.data.data.role
      
      // Set api default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        message: error.response?.data?.errors?.[0]?.message || 'Login failed' 
      }
    }
  }
  
  function logout() {
    token.value = null
    user.value = null
    role.value = null
    delete api.defaults.headers.common['Authorization']
  }
  
  // Initialize api header if token exists
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }
  
  return {
    // State
    token,
    user,
    role,
    
    // Getters
    isAuthenticated,
    
    // Actions
    login,
    logout
  }
}, {
  persist: true
})