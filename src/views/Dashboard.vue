<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import api from '../services/api'
import syncService from '../services/sync'

// Dashboard data
const isLoading = ref(true)
const todayRevenue = ref(0)
const todayExpenses = ref(0)
const netProfit = ref(0)
const shrinkageRate = ref(0)
const activePOs = ref(0)
const lowStockItems = ref(0)
const activeSuppliers = ref(0)
const recentActivities = ref([])

// Fetch dashboard data
async function fetchDashboardData() {
  isLoading.value = true
  
  try {
    // In a real app, these would be actual API calls
    // For now, we'll simulate with mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock data
    todayRevenue.value = 2500000
    todayExpenses.value = 850000
    netProfit.value = todayRevenue.value - todayExpenses.value
    shrinkageRate.value = 2.5
    activePOs.value = 3
    lowStockItems.value = 5
    activeSuppliers.value = 8
    
    recentActivities.value = [
      { id: 1, type: 'sale', description: 'New sale recorded', amount: 150000, time: '10 minutes ago' },
      { id: 2, type: 'expense', description: 'Expense added: Electricity', amount: 250000, time: '1 hour ago' },
      { id: 3, type: 'purchase', description: 'Purchase order created', amount: 500000, time: '3 hours ago' },
      { id: 4, type: 'inventory', description: 'Stock opname completed', amount: null, time: '5 hours ago' },
      { id: 5, type: 'waste', description: 'Waste recorded: Daging Sapi', amount: 75000, time: 'Yesterday' },
    ]
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Initialize
onMounted(async () => {
  // Check if we need to sync data
  if (syncService.isOnline()) {
    await syncService.initializeSync()
  }
  
  // Fetch dashboard data
  await fetchDashboardData()
})
</script>

<template>
  <AppLayout>
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else>
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- Today's Revenue -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Pendapatan Hari Ini</h3>
            <span class="p-2 bg-green-100 rounded-full">
              <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(todayRevenue) }}</p>
        </div>
        
        <!-- Today's Expenses -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Pengeluaran Hari Ini</h3>
            <span class="p-2 bg-red-100 rounded-full">
              <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(todayExpenses) }}</p>
        </div>
        
        <!-- Net Profit -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Keuntungan Bersih</h3>
            <span class="p-2 bg-blue-100 rounded-full">
              <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(netProfit) }}</p>
        </div>
        
        <!-- Shrinkage Rate -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Tingkat Shrinkage</h3>
            <span class="p-2 bg-yellow-100 rounded-full">
              <svg class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ shrinkageRate }}%</p>
        </div>
      </div>
      
      <!-- Quick Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Active POs -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 bg-indigo-100 rounded-full mr-4">
              <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p class="text-xl font-semibold">{{ activePOs }}</p>
              <p class="text-sm text-gray-500">Purchase Orders Aktif</p>
            </div>
          </div>
        </div>
        
        <!-- Low Stock Items -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 bg-red-100 rounded-full mr-4">
              <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p class="text-xl font-semibold">{{ lowStockItems }}</p>
              <p class="text-sm text-gray-500">Item Stok Menipis</p>
            </div>
          </div>
        </div>
        
        <!-- Active Suppliers -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-full mr-4">
              <svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xl font-semibold">{{ activeSuppliers }}</p>
              <p class="text-sm text-gray-500">Supplier Aktif</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-6 border-b">
          <h3 class="text-lg font-medium">Aktivitas Terbaru</h3>
        </div>
        <ul class="divide-y divide-gray-200">
          <li v-for="activity in recentActivities" :key="activity.id" class="p-6">
            <div class="flex items-center">
              <!-- Icon based on activity type -->
              <div 
                class="p-3 rounded-full mr-4"
                :class="{
                  'bg-green-100': activity.type === 'sale',
                  'bg-red-100': activity.type === 'expense',
                  'bg-blue-100': activity.type === 'purchase',
                  'bg-yellow-100': activity.type === 'inventory',
                  'bg-orange-100': activity.type === 'waste',
                }"
              >
                <svg 
                  class="h-5 w-5"
                  :class="{
                    'text-green-500': activity.type === 'sale',
                    'text-red-500': activity.type === 'expense',
                    'text-blue-500': activity.type === 'purchase',
                    'text-yellow-500': activity.type === 'inventory',
                    'text-orange-500': activity.type === 'waste',
                  }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path 
                    stroke-linecap="round" 
                    stroke-linejoin="round" 
                    stroke-width="2" 
                    :d="{
                      'sale': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                      'expense': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
                      'purchase': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
                      'inventory': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                      'waste': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    }[activity.type]"
                  />
                </svg>
              </div>
              
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{{ activity.description }}</p>
                <p class="text-sm text-gray-500">{{ activity.time }}</p>
              </div>
              
              <div v-if="activity.amount" class="text-sm font-medium text-gray-900">
                {{ formatCurrency(activity.amount) }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </AppLayout>
</template>