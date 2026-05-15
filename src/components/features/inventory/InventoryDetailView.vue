<script setup>
import { computed, ref, onMounted, watch, onUnmounted } from 'vue'
import { formatNumber, formatDateTimeIndonesian } from '@/utils/helpers'
import { useSuppliers } from '@/composables/useSuppliers'
import db from '@/services/db'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  getCategoryName: {
    type: Function,
    required: true
  },
  getUnitName: {
    type: Function,
    required: true
  },
  activeTab: {
    type: String,
    default: 'details'
  },
  getSupplierName: {
    type: Function,
    required: true
  },
  refreshTrigger: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:activeTab', 'edit'])

// Get suppliers data
const { suppliers } = useSuppliers()

// Metrics state
const metrics = ref({
  usage: 0,
  waste: 0,
  inventoryRate: 0
})

// Flag untuk menandakan apakah debug sudah dipanggil
let debugLogged = false

// Calculate dynamic metrics
async function calculateMetrics() {
  if (!props.item?.id) return

  try {
    // 1. Calculate Waste
    const allWaste = await db.waste.toArray()
    const wasteRecords = allWaste.filter(record => {
      const terbuangId = typeof record.item_terbuang === 'object' && record.item_terbuang !== null ? record.item_terbuang.id : record.item_terbuang
      return String(terbuangId) === String(props.item.id)
    })
    const totalWaste = wasteRecords.reduce((sum, record) => sum + (parseFloat(record.jumlah) || 0), 0)

    // 2. Calculate Usage (from kitchen prep)
    const preps = await db.kitchen_prep.toArray()
    let totalUsage = 0
    
    for (const prep of preps) {
      if (prep.bahan_baku && Array.isArray(prep.bahan_baku)) {
        for (const ingredient of prep.bahan_baku) {
          let ingredientId
          if (typeof ingredient.raw_materials_id === 'object' && ingredient.raw_materials_id !== null) {
            ingredientId = ingredient.raw_materials_id.id
          } else {
            ingredientId = ingredient.raw_materials_id
          }
          
          if (String(ingredientId) === String(props.item.id)) {
            const jumlah = parseFloat(ingredient.jumlah_diambil) || 0
            totalUsage += jumlah
          }
        }
      }
    }

    // 3. Calculate Inventory Rate (Efisiensi Penggunaan: Usage / (Usage + Waste))
    const totalUsageAndWaste = totalUsage + totalWaste
    const rate = totalUsageAndWaste > 0 ? (totalUsage / totalUsageAndWaste) * 100 : 0

    metrics.value = {
      usage: totalUsage,
      waste: totalWaste,
      inventoryRate: rate.toFixed(1)
    }
  } catch (err) {
    console.error('Error calculating metrics:', err)
  }
}

onMounted(() => {
  calculateMetrics()
})

watch(() => props.item?.id, () => {
  debugLogged = false
  calculateMetrics()
})
watch(() => props.refreshTrigger, () => {
  debugLogged = false
  calculateMetrics()
})
watch(() => props.activeTab, (newTab) => {
  if (newTab === 'details') {
    calculateMetrics()
  }
})

// History state
const historyRecords = ref([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyPerPage = ref(10)
const historySortDesc = ref(true)

// Computed history pagination
const totalHistoryPages = computed(() => Math.ceil(historyRecords.value.length / historyPerPage.value))

const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPerPage.value
  const end = start + historyPerPage.value
  return sortedHistory.value.slice(start, end)
})

const sortedHistory = computed(() => {
  return [...historyRecords.value].sort((a, b) => {
    const dateA = new Date(a.waktu_log || a.cached_at).getTime()
    const dateB = new Date(b.waktu_log || b.cached_at).getTime()
    return historySortDesc.value ? dateB - dateA : dateA - dateB
  })
})

const historyPaginationInfo = computed(() => {
  const total = historyRecords.value.length
  if (total === 0) return { start: 0, end: 0, total: 0 }
  
  const start = (historyPage.value - 1) * historyPerPage.value + 1
  const end = Math.min(start + historyPerPage.value - 1, total)
  return { start, end, total }
})

function changeHistoryPage(page) {
  if (page >= 1 && page <= totalHistoryPages.value) {
    historyPage.value = page
  }
}

function toggleHistorySort() {
  historySortDesc.value = !historySortDesc.value
}

// Format transaction type
function formatTransactionType(type) {
  const types = {
    'PENERIMAAN_PO': 'Penerimaan PO',
    'WASTE': 'Shrinkage / Waste',
    'STOK_AWAL': 'Stok Awal',
    'PENJUALAN': 'Penjualan',
    'KITCHEN_PREP': 'Produksi Dapur'
  }
  return types[type] || type
}

async function loadHistory() {
  if (!props.item?.id || props.activeTab !== 'history') return
  
  try {
    historyLoading.value = true
    
    const allLogs = await db.log_inventaris.toArray()
    const logs = allLogs.filter(log => {
      const logItemId = typeof log.item === 'object' && log.item !== null ? log.item.id : log.item
      return String(logItemId) === String(props.item.id)
    })
      
    historyRecords.value = logs
    historyPage.value = 1
  } catch (err) {
    console.error('Error loading history:', err)
  } finally {
    historyLoading.value = false
  }
}

watch(() => props.activeTab, (newTab) => {
  if (newTab === 'history') {
    loadHistory()
  }
})

watch(() => props.item?.id, () => {
  if (props.activeTab === 'history') {
    loadHistory()
  }
})

// Compute assigned suppliers for this item
const assignedSuppliers = computed(() => {
  if (!props.item?.id || !suppliers.value.length) return []
  
  return suppliers.value.filter(supplier => {
    if (!supplier.assignee_raw_materials) return false
    
    try {
      let assignedIds = []
      
      // Handle different data formats
      if (typeof supplier.assignee_raw_materials === 'string') {
        assignedIds = JSON.parse(supplier.assignee_raw_materials)
      } else if (Array.isArray(supplier.assignee_raw_materials)) {
        assignedIds = supplier.assignee_raw_materials
      }
      
      return assignedIds.includes(props.item.id)
    } catch (error) {
      console.error('Error parsing assigned materials for supplier:', supplier.id, error)
      return false
    }
  })
})
</script>

<template>
  <div>
    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-4">
      <div class="flex space-x-6">
        <button 
          @click="$emit('update:activeTab', 'details')" 
          :class="[activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm']"
        >
          Details
        </button>
        <button 
          @click="$emit('update:activeTab', 'suppliers')" 
          :class="[activeTab === 'suppliers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm']"
        >
          Suppliers
        </button>
        <button 
          @click="$emit('update:activeTab', 'history')" 
          :class="[activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm']"
        >
          History
        </button>
        <button 
          @click="$emit('update:activeTab', 'analytics')" 
          :class="[activeTab === 'analytics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm']"
        >
          Analytics
        </button>
      </div>
    </div>
    
    <!-- Tab Content -->
    <div v-if="activeTab === 'details'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Item Details Card -->
        <div class="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
          <h4 class="font-medium text-base">Information Item</h4>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Product Name:</span>
              <span class="font-medium">{{ item.nama_item }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Category:</span>
              <span class="font-medium">{{ getCategoryName(item.kategori) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Supplier:</span>
              <span class="font-medium">{{ item.supplier_utama ? getSupplierName(item.supplier_utama) : 'Not specified' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Reorder Point:</span>
              <span class="font-medium">{{ formatNumber(item.minimum_stock_level) }} {{ getUnitName(item.unit) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Status:</span>
              <span :class="item.status === 'active' ? 'text-green-600' : 'text-red-600'">
                {{ item.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Stock Status Card -->
        <div class="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
          <h4 class="font-medium text-base">Stock Information</h4>
          
          <div class="grid grid-cols-3 gap-2 mt-4">
            <div class="bg-blue-50 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-blue-600">{{ formatNumber(item.total_stock) }}</div>
              <div class="text-xs text-gray-500">Total Stock</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-green-600">{{ formatNumber(metrics.usage) }}</div>
              <div class="text-xs text-gray-500">Usage</div>
            </div>
            <div class="bg-red-50 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-red-600">{{ formatNumber(metrics.waste) }}</div>
              <div class="text-xs text-gray-500">Waste</div>
            </div>
          </div>
          
          <div class="mt-4">
            <div class="flex justify-between text-sm items-center mb-2">
              <span class="text-gray-500">Inventory Rate:</span>
              <span class="font-medium">{{ metrics.inventoryRate }}%</span>
            </div>
            <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div class="flex gap-2">
                <svg class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-xs text-blue-800">
                  Persentase bahan mentah yang berhasil digunakan dalam produksi, dihitung dari (Usage / (Usage + Waste)) × 100. Semakin tinggi nilai ini, semakin efisien penggunaan bahan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    
    <div v-else-if="activeTab === 'suppliers'" class="space-y-4">
      <div class="bg-white rounded-lg border border-gray-100 p-4">
        <h4 class="font-medium text-base mb-4">Assigned Suppliers</h4>
        
        <div v-if="assignedSuppliers.length === 0" class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p class="text-gray-500 text-sm">No suppliers assigned to this material yet.</p>
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier Name
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(supplier, index) in assignedSuppliers" :key="supplier.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ index + 1 }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-8 w-8">
                      <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div class="ml-3">
                      <div class="text-sm font-medium text-gray-900">
                        {{ supplier.nama_pt_toko }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ supplier.nama_pic || 'No PIC' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ supplier.kategori_supplier || 'No category' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {{ supplier.no_telp_pic || 'No contact' }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span :class="supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ supplier.status === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div v-else-if="activeTab === 'history'" class="space-y-4">
      <div class="bg-white rounded-lg border border-gray-100 p-4">
        <h4 class="font-medium text-base mb-3">Stock History</h4>
        
        <div v-if="historyLoading" class="text-center py-8">
          <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-gray-600 text-sm">Loading history...</p>
        </div>
        
        <div v-else-if="historyRecords.length === 0" class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-500 text-sm">No history records available yet.</p>
        </div>
        
        <div v-else class="space-y-4">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th @click="toggleHistorySort" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group">
                    <div class="flex items-center gap-1">
                      Tanggal & Jam
                      <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform" :class="{ 'rotate-180': !historySortDesc }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe Transaksi
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perubahan
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Akhir
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="record in paginatedHistory" :key="record.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDateTimeIndonesian(record.waktu_log || record.cached_at) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {{ formatTransactionType(record.tipe_transaksi) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                    <div class="flex items-center justify-end gap-1" :class="record.perubahan_jumlah > 0 ? 'text-green-600' : (record.perubahan_jumlah < 0 ? 'text-red-600' : 'text-gray-500')">
                      <svg v-if="record.perubahan_jumlah > 0" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <svg v-else-if="record.perubahan_jumlah < 0" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span v-else class="w-4 h-4 text-center">-</span>
                      {{ record.perubahan_jumlah > 0 ? '+' : '' }}{{ formatNumber(record.perubahan_jumlah) }} {{ getUnitName(item.unit) }}
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {{ formatNumber(record.stok_setelah) }} {{ getUnitName(item.unit) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div v-if="totalHistoryPages > 1" class="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
            <div class="text-sm text-gray-700">
              Menampilkan {{ historyPaginationInfo.start }} - {{ historyPaginationInfo.end }} dari {{ historyPaginationInfo.total }} catatan
            </div>
            <div class="flex space-x-1">
              <button
                @click="changeHistoryPage(historyPage - 1)"
                :disabled="historyPage === 1"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <button
                v-for="page in Math.min(totalHistoryPages, 5)"
                :key="page"
                @click="changeHistoryPage(page)"
                :class="[
                  'px-3 py-1 border text-sm rounded',
                  historyPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changeHistoryPage(historyPage + 1)"
                :disabled="historyPage === totalHistoryPages"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="activeTab === 'analytics'" class="space-y-4">
      <div class="bg-white rounded-lg border border-gray-100 p-4">
        <h4 class="font-medium text-base mb-3">Usage Analytics</h4>
        <p class="text-gray-500 text-center py-6 text-sm">Analytics feature coming soon.</p>
      </div>
    </div>
  </div>
</template>