<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import OfflineIndicator from '../ui/OfflineIndicator.vue'
import db from '../../services/db'

const authStore = useAuthStore()
const router = useRouter()

// Get user role - perbaiki untuk menangani berbagai format nama role
const userRole = computed(() => {
  const roleName = authStore.role?.name?.toLowerCase() || ''
  // console.log('Role name processed:', roleName)
  
  // Normalisasi nama role (hapus spasi, ubah ke lowercase)
  return roleName.replace(/\s+/g, '').toLowerCase()
})

// Debugging untuk melihat nilai role
// watch(() => authStore.role, (newRole) => {
//   console.log('Role dari Directus:', newRole)
//   console.log('Role name:', newRole?.name)
//   console.log('User role computed:', userRole.value)
//   console.log('Permissions:', authStore.permissions)
// }, { immediate: true })

// Simpan state sidebar di localStorage untuk mempertahankannya setelah refresh token
const getSavedSidebarState = () => {
  const savedState = localStorage.getItem('sidebar-state')
  return savedState !== null ? savedState === 'true' : true // Default ke true jika tidak ada
}

// Change default to use saved state from localStorage
const isSidebarOpen = ref(getSavedSidebarState())

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  // Simpan state sidebar ke localStorage
  localStorage.setItem('sidebar-state', isSidebarOpen.value)
}

// Add keyboard shortcut to toggle sidebar
onMounted(() => {
  const handleKeyDown = (event) => {
    if (event.key === 'b' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      toggleSidebar()
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
})

function logout() {
  authStore.logout()
  router.push('/login')
}

// Fungsi untuk clear cache dan reset aplikasi
async function clearCache() {
  try {
    // Konfirmasi dari user
    if (!confirm('Apakah Anda yakin ingin menghapus semua data lokal? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    // 1. Hapus semua data dari IndexedDB
    const tableNames = [
      'suppliers', 'item_categories', 'expense_categories', 'raw_materials',
      'products', 'recipe_items', 'purchase_orders', 'po_items',
      'stock_opname', 'kitchen_preparations', 'waste_records',
      'sales_sessions', 'sales', 'sales_items', 'expenses',
      'sync_queue', 'units', 'log_inventaris', 'waste'
    ]

    for (const tableName of tableNames) {
      try {
        await db[tableName].clear()
      } catch (error) {
        console.warn(`Failed to clear table ${tableName}:`, error)
      }
    }

    // 2. Hapus localStorage
    localStorage.clear()

    // 3. Hapus sessionStorage
    sessionStorage.clear()

    // 4. Hapus cookies
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })

    // 5. Hapus cache browser (jika didukung)
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }

    // 6. Reset auth store
    authStore.logout()

    // 7. Reload halaman untuk memastikan state bersih
    window.location.href = '/login'
    
  } catch (error) {
    console.error('Error clearing cache:', error)
    alert('Terjadi error saat menghapus cache. Silakan coba lagi.')
  }
}

// Define all navigation items with collections they need access to
const allNavItems = [
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    icon: 'chart-pie',
    collections: ['raw_materials', 'item_categories', 'suppliers', 'units', 'cooked_items', 'kitchen_prep', 'expense_categories', 'products', 'product_categories'] // Collection yang perlu diakses sesuai route
  },
  { 
    name: 'Supplier', 
    path: '/suppliers', 
    icon: 'users',
    collections: ['suppliers', ''] // Collection yang perlu diakses
  },
  { 
    name: 'Inventori Bahan Mentah', 
    path: '/inventory', 
    icon: 'package',
    collections: ['raw_materials', 'item_categories', 'suppliers', 'units'] // Collection yang perlu diakses
  },  
  { 
    name: 'Pembelian Bahan Mentah', 
    path: '/purchase-orders', 
    icon: 'shopping-cart',
    collections: ['purchase_orders', 'po_items', 'suppliers'] // Collection yang perlu diakses
  },
  { 
    name: 'Bahan Setengah Jadi', 
    path: '/cooked-items', 
    icon: 'utensils',
    collections: ['cooked_items', 'cooked_items_raw_materials', 'raw_materials', 'item_categories', 'units'] // Collection yang perlu diakses
  },    
  { 
    name: 'Persiapan Dapur', 
    path: '/kitchen', 
    icon: 'utensils',
    collections: ['kitchen_prep', 'raw_materials', 'cooked_items'] // Collection yang perlu diakses
  },
  { 
    name: 'Produk', 
    path: '/products', 
    icon: 'chef-hat',
    collections: ['products', 'product_categories'] // Collection yang perlu diakses
  },
  { 
    name: 'Penjualan', 
    path: '/sales', 
    icon: 'dollar-sign',
    collections: ['sales', 'sales_items'] // Collection yang perlu diakses
  },
  { 
    name: 'Pengeluaran', 
    path: '/expenses', 
    icon: 'receipt',
    collections: ['expenses'] // Collection yang perlu diakses
  },
  { 
    name: 'Laporan', 
    path: '/reports', 
    icon: 'bar-chart-3',
    collections: ['reports'] // Collection yang perlu diakses
  },
]

// Filter navigation items based on user permissions
const navItems = computed(() => {
  // console.log('Filtering menu based on permissions:', authStore.permissions)
  
  // Jika tidak ada permissions, tampilkan menu kosong
  if (!authStore.permissions) {
    // console.log('No permissions found, showing empty menu')
    return []
  }
  
  // Jika user adalah admin, tampilkan semua menu
  if (userRole.value === 'admin' || userRole.value === 'superadmin' || userRole.value === 'administrator') {
    // console.log('Admin user, showing all menu items')
    return allNavItems
  }
  
  // Filter menu berdasarkan permissions
  const filteredItems = allNavItems.filter(item => {
    // console.log(`Checking menu item: ${item.name}`)
    
    // Log semua permission untuk debugging
    item.collections.forEach(collection => {
      if (collection) { // Skip empty collection names
        const hasPermission = authStore.hasPermission(collection, 'read')
        // console.log(`Checking permission for ${collection}: ${hasPermission}`)
      }
    })
    
    // Periksa apakah user memiliki akses read ke SEMUA collection yang diperlukan
    const hasAccess = authStore.hasPermissionForAll(item.collections, 'read')
    // console.log(`Final access for ${item.name}: ${hasAccess}`)
    
    return hasAccess
  })
  
  // console.log('Filtered menu items:', filteredItems.map(i => i.name))
  return filteredItems
})
</script>

<!-- Template tidak berubah -->
<template>
  <div class="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-indigo-50">
    <!-- Sidebar with improved transition -->
    <aside 
      class="fixed inset-y-0 left-0 bg-sidebar shadow-sm max-h-screen w-64 z-20 transform transition-all duration-300 ease-in-out border-r border-sidebar-border"
      :class="{ '-translate-x-full': !isSidebarOpen, 'translate-x-0': isSidebarOpen }"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="border-b border-sidebar-border p-4">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-600 rounded-lg">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h18v18H3V3z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9h18" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 21V9" />
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-bold text-sidebar-foreground">Warung App</h1>
              <p class="text-sm text-muted-foreground">Restaurant Management</p>
            </div>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-4">
          <ul class="px-2 space-y-1">
            <li v-for="item in navItems" :key="item.name">
              <router-link 
                :to="item.path" 
                class="flex items-center px-4 py-3 text-sm rounded-lg hover:bg-sidebar-accent text-sidebar-foreground w-full"
                :class="{ 'bg-blue-100 text-blue-700 font-medium': $route.path.startsWith(item.path) }"
              >
                <svg v-if="item.icon === 'chart-pie'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                <svg v-if="item.icon === 'users'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-if="item.icon === 'shopping-cart'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <svg v-if="item.icon === 'package'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <svg v-if="item.icon === 'utensils'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <svg v-if="item.icon === 'chef-hat'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <svg v-if="item.icon === 'dollar-sign'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-if="item.icon === 'receipt'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-if="item.icon === 'bar-chart-3'" class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{{ item.name }}</span>
              </router-link>
            </li>
          </ul>
        </nav>
        
        <!-- User info -->
        <div class="p-4 border-t border-sidebar-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-sidebar-foreground">{{ authStore.user && authStore.user.first_name || 'User' }}</p>
              <p class="text-xs text-muted-foreground">{{ authStore.role && authStore.role.name || 'Role' }}</p>
            </div>
            <button 
              @click="logout" 
              class="p-2 rounded-lg hover:bg-sidebar-accent"
              title="Logout"
            >
              <svg class="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- Main content with smooth transition -->
    <main 
      class="flex-1 flex flex-col transition-all duration-300 ease-in-out" 
      :class="{ 'pl-0': !isSidebarOpen, 'lg:pl-64': isSidebarOpen }"
    >
      <!-- Header -->
      <header class="sticky top-0 border-b bg-white/80 backdrop-blur-sm p-4 flex items-center shadow-sm z-10">
        <!-- Add sidebar toggle button for all screen sizes -->
        <button 
          @click="toggleSidebar" 
          class="mr-3 p-2 hover:bg-gray-100 rounded-lg" 
          title="Toggle Sidebar (Ctrl+B)"
        >
          <svg class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">{{ $route.name }}</h2>
            <p class="text-sm text-gray-500">
              {{ $route.path.includes('inventory') ? 'Track and manage your restaurant inventory' :
                 $route.path.includes('kitchen') ? 'Prepare ingredients from inventory for cooking' :
                 $route.path.includes('products') ? 'Manage your menu items and recipes' :
                 $route.path.includes('pos') ? 'Monitor sales and transactions' :
                 $route.path.includes('purchase') ? 'Handle purchase orders and suppliers' :
                 'Restaurant management system' }}
            </p>
          </div>
        </div>
        
        <div class="ml-auto flex items-center gap-3">
          <button 
            @click="clearCache" 
            class="p-2 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Clear Cache & Reset App"
          >
            <svg class="w-5 h-5 text-gray-500 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
            {{ authStore.user && authStore.user.first_name && authStore.user.first_name[0] || 'U' }}
          </div>
        </div>
      </header>
      
      <!-- Page content -->
      <div class="flex-1 p-6 overflow-auto">
        <slot></slot>
      </div>
    </main>
    
    <!-- Offline indicator -->
    <OfflineIndicator />
  </div>
</template>