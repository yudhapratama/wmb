<script setup>
import { computed } from 'vue'
import { formatNumber } from '@/utils/helpers'
import { useSuppliers } from '@/composables/useSuppliers'

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

// Get suppliers data
const { suppliers } = useSuppliers()

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