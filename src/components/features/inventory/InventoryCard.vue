<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div :class="`p-2 rounded-lg ${stockStatus.bg}`">
            <svg class="w-5 h-5" :class="stockStatus.color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-lg text-gray-900">{{ item.nama_item }}</h3>
            <div class="flex items-center gap-4 mt-1 text-sm">
              <span class="px-2 py-1 rounded-full text-xs font-medium border border-gray-200">{{ getCategoryName(item.kategori) }}</span>
              <span :class="`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.badgeColor}`">{{ stockStatus.label }}</span>
              <div class="flex items-center gap-1 text-gray-500" v-if="item.supplier_utama">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ getSupplierName(item.supplier_utama) }}
              </div>
            </div>
            <div class="flex items-center gap-6 mt-2 text-sm">
              <div>
                <span class="text-gray-500 font-normal">Stock: </span>
                <span :class="`font-semibold ${stockStatus.color}`">
                  {{ formatNumber(item.total_stock) }} {{ getUnitName(item.unit) }}
                </span>
              </div>
              <div>
                <span class="text-gray-500 font-normal">Harga: </span>
                <span class="font-semibold text-gray-900">{{ formatCurrency(item.harga_rata_rata) }}</span>
              </div>
              <div>
                <span class="text-gray-500 font-normal">Harga per {{ getUnitName(item.unit) }}: </span>
                <span class="font-semibold text-gray-900">{{ formatCurrency(item.harga_rata_rata/item.total_stock) }}</span>
              </div>              
            </div>
            <div class="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Last updated: {{ formatDateTime(item.date_updated || item.date_created) }}
            </div>
          </div>
        </div>
        <div class="text-right">
          
          <!-- Replace the existing minimum stock display with this -->
          <div class="text-lg font-bold text-blue-600 mb-3">
            Min: {{ formatNumber(item.minimum_stock_level) }} {{ getUnitName(item.unit) }}
          </div>
          <!-- Replace the existing action buttons with these -->
          <div class="flex gap-2">
            <!-- <button 
              @click="$emit('view', item)"
              class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
            > -->
            <button 
              @click="$emit('view', item)"
              class="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm"
            >            
              <!-- <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />                
              </svg> -->
              <EyeIcon class="w-4 h-4" />
            </button>
              <PermissionBasedAccess collection="raw_materials" action="update">
                <button 
                  @click="$emit('edit', item)"
                  class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </PermissionBasedAccess>
              <PermissionBasedAccess collection="raw_materials" action="delete">
                <button 
                  @click="$emit('shrinkage', item)"
                  class="p-2.5 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </button>
              </PermissionBasedAccess>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'
import { formatDateTime } from '@/utils/helpers'
import { 
  EyeIcon
} from '@heroicons/vue/24/outline'
import { formatCurrency, formatNumber } from '../../../utils/helpers'
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
  getSupplierName: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'view', 'shrinkage'])

const stockStatus = computed(() => {
  const { total_stock, minimum_stock_level } = props.item
  
  if (total_stock <= 0) {
    return { 
      label: 'Out of Stock', 
      color: 'text-red-600',
      bg: 'bg-red-100',
      badgeColor: 'bg-red-100 text-red-600'
    }
  } else if (total_stock <= minimum_stock_level) {
    return { 
      label: 'Low Stock', 
      color: 'text-orange-500',
      bg: 'bg-orange-100',
      badgeColor: 'bg-orange-100 text-orange-600'
    }
  } else {
    return { 
      label: 'In Stock', 
      color: 'text-green-600',
      bg: 'bg-green-100',
      badgeColor: 'bg-green-100 text-green-600'
    }
  }
})
</script>