import { defineStore } from 'pinia'
import api from '../services/api'
import axios from 'axios' // ✅ Tambahkan import axios

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    refresh_token: null,
    user: null,
    role: null,
    permissions: null,
    permissionsTimestamp: null,
    permissionsVersion: null,
    tokenTimestamp: null,
    refreshInterval: null,
    isRefreshing: false,
    refreshStartTime: null
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
    },
    tokenAge: (state) => {
      if (!state.tokenTimestamp) return null
      return Date.now() - state.tokenTimestamp
    },
    
    isTokenOld: (state) => {
      const age = Date.now() - (state.tokenTimestamp || 0)
      const expiryMinutes = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_MINUTES) || 10080 // Default 7 days
      return age > (expiryMinutes * 60 * 1000) // Configurable minutes
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
          // Start auto-refresh if session is valid
          this.startAutoRefresh()
          return true
        } catch (error) {
          console.error('Token tidak valid, logout user:', error)
          this.logout()
          return false
        }
      }
      return false
    },
    
    // Tambahkan debug logging di method login
    // Di method login, simpan timestamp
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { 
          email, 
          password, 
          mode: 'json'
        })
        
        // Validasi response structure
        if (!response.data?.data?.access_token || !response.data?.data?.refresh_token) {
          throw new Error('Invalid login response: missing tokens')
        }
        
        this.token = response.data.data.access_token
        this.refresh_token = response.data.data.refresh_token
        this.tokenTimestamp = Date.now() // 📝 Simpan timestamp
        
        // Debug logging
        console.log('Tokens saved to state:', {
          token: !!this.token,
          refresh_token: !!this.refresh_token
        })
        
        // Verify localStorage after state update
        setTimeout(() => {
          const stored = localStorage.getItem('warung-auth')
          console.log('localStorage after login:', stored)
        }, 100)
        
        // Set api default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
        // Fetch user data and permissions
        await this.fetchUserData()
        
        // Start automatic token refresh
        this.startAutoRefresh()
        
        console.log('Login successful, tokens saved')
        return { success: true }
      } catch (error) {
        console.error('Login failed:', error)
        return { 
          success: false, 
          message: error.response?.data?.errors?.[0]?.message || error.message || 'Login failed' 
        }
      }
    },
    
    // Tambahkan method refresh token
    // Tambahkan di method refreshToken
    async refreshToken() {
      // Prevent multiple simultaneous refresh attempts
      if (this.isRefreshing) {
        console.log('Refresh already in progress, skipping...')
        return false
      }
      
      this.isRefreshing = true
      this.refreshStartTime = Date.now()
      console.log('Attempting token refresh...')
      
      // Coba ambil dari state store dulu
      let refreshToken = this.refresh_token
      
      // Jika tidak ada, coba ambil dari localStorage sebagai fallback
      if (!refreshToken) {
        try {
          const storedAuth = localStorage.getItem('warung-auth')
          if (storedAuth) {
            const authData = JSON.parse(storedAuth)
            refreshToken = authData.refresh_token
            console.log('Retrieved refresh_token from localStorage:', !!refreshToken)
          }
        } catch (error) {
          console.error('Failed to parse localStorage auth data:', error)
        }
      }
      
      console.log('Current refresh_token exists:', !!refreshToken)
      
      if (!refreshToken) {
        console.error('No refresh token available')
        return false
      }
      
      try {
        console.log('Sending refresh request with token:', refreshToken.substring(0, 10) + '...')
        console.log('Full refresh token for debugging:', refreshToken)
        
        // Use axios directly to avoid interceptor loops
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8055'}/auth/refresh`,
          { 
            refresh_token: refreshToken
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000 // Add timeout to prevent hanging
          }
        )
        
        // Validasi response structure
        if (!response.data?.data?.access_token) {
          console.error('Invalid refresh token response structure:', response.data)
          return false
        }
        
        // Update tokens
        this.token = response.data.data.access_token
        this.refresh_token = response.data.data.refresh_token || this.refresh_token
        this.tokenTimestamp = Date.now() // Update timestamp
        
        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
        console.log('Token refreshed successfully')
        this.isRefreshing = false
        this.refreshStartTime = null
        return true
        
      } catch (error) {
        console.error('Token refresh failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        })
        
        // Jika refresh gagal, logout user
        this.isRefreshing = false
        this.refreshStartTime = null
        this.logout()
        return false
      } finally {
        this.isRefreshing = false
        this.refreshStartTime = null
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

    // Tambahkan method untuk refresh proaktif
    async proactiveRefresh() {
      if (this.isTokenOld) {
        console.log('Token is old, attempting proactive refresh')
        return await this.refreshToken()
      }
      return true
    },

    // Start automatic token refresh checker
    startAutoRefresh() {
      // Clear any existing interval
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
      }
      
      // Check interval configurable via env
      const checkIntervalMinutes = parseInt(import.meta.env.VITE_TOKEN_CHECK_INTERVAL_MINUTES) || 1
      this.refreshInterval = setInterval(async () => {
        console.log('refreshInterval', this.token , this.isTokenOld);
        
        if (this.token && this.isTokenOld) {
          console.log('Auto-refresh: Token is old, refreshing...')
          await this.refreshToken()
        }
      }, checkIntervalMinutes * 60 * 1000) // Configurable check interval
    },

    // Stop automatic token refresh checker
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },

    // Update method validateSession
    async validateSession() {
      // Jika tidak ada token, tidak perlu validasi
      if (!this.token) {
        console.log('No token available for validation')
        return false
      }
      
      try {
        console.log('Validating session...')
        // Cek validitas token dengan request sederhana
        await api.get('/users/me')
        
        // Refresh permissions jika sudah lebih dari 5 menit
        const now = Date.now()
        if (!this.permissionsTimestamp || (now - this.permissionsTimestamp) > 5 * 60 * 1000) {
          console.log('Refreshing permissions...')
          await this.fetchPermissions()
        }
        
        console.log('Session validation successful')
        return true
      } catch (error) {
        console.error('Session validation failed:', error.response?.data || error.message)
        
        // Jika error 401, coba refresh token
        if (error.response?.status === 401) {
          console.log('Session expired, attempting token refresh...')
          const refreshSuccess = await this.refreshToken()
          
          if (refreshSuccess) {
            // Jika refresh berhasil, coba validasi lagi
            try {
              await api.get('/users/me')
              console.log('Session validation successful after token refresh')
              return true
            } catch (retryError) {
              console.error('Retry validation failed:', retryError.response?.data || retryError.message)
              this.logout()
              return false
            }
          } else {
            console.log('Token refresh failed during session validation')
            this.logout()
            return false
          }
        }
        
        return false
      }
    },
    
    logout() {
      // Stop auto-refresh
      this.stopAutoRefresh()
      
      this.token = null
      this.refresh_token = null
      this.user = null
      this.role = null
      this.permissions = null
      this.permissionsTimestamp = null
      this.permissionsVersion = null
      this.tokenTimestamp = null
      this.isRefreshing = false
      delete api.defaults.headers.common['Authorization']
    }
  },
  
  persist: {
    key: 'warung-auth',
    storage: localStorage,
    paths: ['token', 'refresh_token', 'user', 'role', 'permissions', 'permissionsTimestamp', 'permissionsVersion', 'tokenTimestamp']
  }
})