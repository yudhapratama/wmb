<script setup>
import { formatNumber } from '@/utils/helpers';
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
  }
})

const emit = defineEmits(['update:activeTab', 'edit'])
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
              <div class="text-2xl font-bold text-green-600">{{ formatNumber(4800)}}</div>
              <div class="text-xs text-gray-500">Usage</div>
            </div>
            <div class="bg-red-50 p-3 rounded-lg text-center">
              <div class="text-2xl font-bold text-red-600">{{ formatNumber(200) }}</div>
              <div class="text-xs text-gray-500">Waste</div>
            </div>
          </div>
          
          <div class="mt-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Inventory Rate:</span>
              <span class="font-medium">8.9%</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
    
    <div v-else-if="activeTab === 'history'" class="space-y-4">
      <div class="bg-white rounded-lg border border-gray-100 p-4">
        <h4 class="font-medium text-base mb-3">Stock History</h4>
        <p class="text-gray-500 text-center py-6 text-sm">No history records available yet.</p>
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