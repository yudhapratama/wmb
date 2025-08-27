<script setup>
import { computed, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import { useDashboard } from '../composables/useDashboard'

// Use dashboard composable
const {
  isLoading,
  error,
  selectedDate,
  totalRevenue,
  totalMargin,
  totalPaidPurchases,
  totalUnpaidPurchases,
  shrinkageRate,
  topProducts,
  totalExpenses,
  topExpenses,
  lowStockCookedItems,
  loadDashboardData,
  formatCurrency,
  formatPercentage,
  changeDate
} = useDashboard()

// Computed values
const netProfit = computed(() => totalRevenue.value - totalExpenses.value)
const activePOs = computed(() => totalUnpaidPurchases.value > 0 ? 1 : 0)
const lowStockItemsCount = computed(() => lowStockCookedItems.value.length)

// Handle date change
function handleDateChange(event) {
  changeDate(event.target.value)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <AppLayout>
    <!-- Date Filter -->
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Dashboard</h2>
        <div class="flex items-center space-x-2">
          <label for="date-filter" class="text-sm font-medium text-gray-700">Tanggal:</label>
          <input 
            id="date-filter"
            type="date" 
            :value="selectedDate" 
            @change="handleDateChange"
            class="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
          <button 
            @click="loadDashboardData" 
            class="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>
    
    <div v-else>
      <!-- Main Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- Total Revenue -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Total Pendapatan</h3>
            <span class="p-2 bg-green-100 rounded-full">
              <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(totalRevenue) }}</p>
        </div>
        
        <!-- Total Margin -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Total Margin</h3>
            <span class="p-2 bg-emerald-100 rounded-full">
              <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(totalMargin) }}</p>
        </div>
        
        <!-- Total Expenses -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Total Pengeluaran</h3>
            <span class="p-2 bg-red-100 rounded-full">
              <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(totalExpenses) }}</p>
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
          <p class="mt-2 text-2xl font-semibold" :class="netProfit >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatCurrency(netProfit) }}</p>
        </div>
      </div>

      <!-- Purchase Orders & Shrinkage -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Paid Purchases -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Belanja Terbayar</h3>
            <span class="p-2 bg-green-100 rounded-full">
              <svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(totalPaidPurchases) }}</p>
        </div>
        
        <!-- Unpaid Purchases -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Belanja Belum Bayar</h3>
            <span class="p-2 bg-orange-100 rounded-full">
              <svg class="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatCurrency(totalUnpaidPurchases) }}</p>
        </div>
        
        <!-- Shrinkage Rate -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-500">Tingkat Penyusutan</h3>
            <span class="p-2 bg-yellow-100 rounded-full">
              <svg class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold">{{ formatPercentage(shrinkageRate) }}</p>
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
              <p class="text-xl font-semibold">{{ lowStockItemsCount }}</p>
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
              <p class="text-xl font-semibold">-</p>
              <p class="text-sm text-gray-500">Supplier Aktif</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Top Products, Expenses, and Low Stock -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Top 5 Best Selling Products -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Top 5 Produk Terlaris</h3>
          <div class="space-y-3">
            <div v-if="topProducts.length === 0" class="text-center text-gray-500 py-4">
              Tidak ada data penjualan produk
            </div>
            <div v-else v-for="(product, index) in topProducts" :key="product.product_id" class="flex items-center py-2 border-b border-gray-100">
              <span class="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full mr-3">
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-medium">{{ product.name }}</p>
                <p class="text-sm text-gray-500">{{ product.quantity }} terjual</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Top 3 Expenses -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Top 3 Pengeluaran</h3>
          <div class="space-y-3">
            <div v-if="topExpenses.length === 0" class="text-center text-gray-500 py-4">
              Tidak ada data pengeluaran
            </div>
            <div v-else v-for="(expense, index) in topExpenses" :key="expense.category_id" class="flex justify-between items-center py-2 border-b border-gray-100">
              <div class="flex items-center">
                <span class="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 text-xs font-medium rounded-full mr-3">
                  {{ index + 1 }}
                </span>
                <div>
                  <p class="font-medium">{{ expense.name }}</p>
                </div>
              </div>
              <p class="font-semibold">{{ formatCurrency(expense.amount) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Top 5 Low Stock Cooked Items -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Stok Bahan Setengah Jadi Menipis</h3>
          <div class="space-y-3">
            <div v-if="lowStockCookedItems.length === 0" class="text-center text-gray-500 py-4">
              Semua stok aman
            </div>
            <div v-else v-for="(item, index) in lowStockCookedItems" :key="item.id" class="flex justify-between items-center py-2 border-b border-gray-100">
              <div class="flex items-center">
                <span class="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mr-3">
                  {{ index + 1 }}
                </span>
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-sm text-gray-500">{{ item.unit_name }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold text-red-600">{{ item.current_stock }}</p>
                <p class="text-sm text-gray-500">Min: {{ item.minimum_stock }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>