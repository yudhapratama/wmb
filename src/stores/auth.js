import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    role: null,
    permissions: null,
    permissionsTimestamp: null, // Tambahkan timestamp untuk validasi
    permissionsVersion: null // Tambahkan version untuk validasi
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => {
      const roleName = state.role?.name?.toLowerCase() || ''
      return roleName.replace(/\s+/g, '').toLowerCase()
    },
    hasRole: (state) => (roleName) => {
      const userRole = state.role?.name?.toLowerCase() || ''
      return userRole.replace(/\s+/g, '').toLowerCase() === roleName.toLowerCase()
    },
    hasAnyRole: (state) => (roleNames) => {
      return roleNames.some(roleName => state.hasRole(roleName))
    },
    // Modifikasi getter untuk memeriksa permissions
    hasPermission: (state) => (collection, action = 'read') => {
      // Log the permission check for debugging
      // console.log(`Checking permission for collection: ${collection}, action: ${action}`);
      // console.log('Current permissions:', state.permissions[collection]?.[action]);
  
      // Ensure permissions are loaded and the specific permission exists
      if (!state.permissions || !state.permissions[collection] || !state.permissions[collection][action]) {
        // console.log(`Permission not found for ${collection}.${action}`);
        return false;
      }
  
      // Explicitly check if the 'access' property is 'full'
      const hasFullAccess = state.permissions[collection][action].access === 'full';
      // console.log(`Has full access for ${collection}.${action}: ${hasFullAccess}`);
      return hasFullAccess;
    },
    // Tambahkan getter untuk memeriksa apakah user memiliki akses ke semua collection
    hasPermissionForAll: (state) => (collections, action = 'read') => {
      if (!state.permissions || !collections || collections.length === 0) return false
      return collections.every(collection => {
        // Skip empty collection names
        if (!collection) return true
        return !!state.permissions[collection]?.[action]
      })
    }
  },
  
  actions: {
    // ✅ Tambahkan method untuk memulihkan session
    async restoreSession() {
      if (this.token) {
        // Pulihkan authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
        // Validasi token masih valid
        try {
          await api.get('/users/me')
          return true
        } catch (error) {
          console.error('Token tidak valid, logout user:', error)
          this.logout()
          return false
        }
      }
      return false
    },
    
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { email, password, mode: 'json' })
        
        // console.log('Login response:', response.data.data)
        
        this.token = response.data.data.access_token
        
        // Set api default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
        // Fetch user data and permissions
        await this.fetchUserData()
        
        return { success: true }
      } catch (error) {
        console.error('Login failed:', error)
        return { 
          success: false, 
          message: error.response?.data?.errors?.[0]?.message || 'Login failed' 
        }
      }
    },
    
    async fetchUserData() {
      try {
        // Fetch user data including role
        const userResponse = await api.get('/users/me?fields=*,role.*')
        // console.log('User data response:', userResponse.data.data)
        
        this.user = userResponse.data.data
        this.role = userResponse.data.data.role
        
        // console.log('Role from API:', this.role)
        
        // Fetch user permissions
        await this.fetchPermissions()
        
        return true
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        this.logout()
        return false
      }
    },
    
    async fetchPermissions() {
      try {
        const permissionsResponse = await api.get('/permissions/me')
        // console.log('Permissions response:', permissionsResponse.data.data)
        
        this.permissions = permissionsResponse.data.data
        this.permissionsTimestamp = Date.now()
        
        // Simpan versi permissions (bisa dari header atau generate hash)
        // Untuk contoh sederhana, kita gunakan timestamp
        this.permissionsVersion = this.permissionsTimestamp
        
        return true
      } catch (error) {
        console.error('Failed to fetch permissions:', error)
        // Jika 401 atau 403, logout user
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.logout()
        }
        return false
      }
    },
    
    async validateSession() {
      // Jika tidak ada token, tidak perlu validasi
      if (!this.token) return false
      
      try {
        // Cek validitas token dengan request sederhana
        await api.get('/users/me')
        
        // Refresh permissions jika sudah lebih dari 5 menit
        const now = Date.now()
        if (!this.permissionsTimestamp || (now - this.permissionsTimestamp) > 5 * 60 * 1000) {
          await this.fetchPermissions()
        }
        
        return true
      } catch (error) {
        console.error('Session validation failed:', error)
        // Jika error 401, logout user
        if (error.response?.status === 401) {
          this.logout()
        }
        return false
      }
    },
    
    logout() {
      this.token = null
      this.user = null
      this.role = null
      this.permissions = null
      this.permissionsTimestamp = null
      this.permissionsVersion = null
      delete api.defaults.headers.common['Authorization']
    }
  }
}, {
  persist: true
})