<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ item.name }}</h3>
        <p class="text-sm text-gray-500">{{ getUnitName(item.unit.id) }}</p>
      </div>
      <div class="flex space-x-2">
        <PermissionBasedAccess collection="cooked_items" action="read">
          <button
            @click="$emit('view', item)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Lihat Detail"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="cooked_items" action="update">
          <button
            @click="$emit('edit', item)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-md"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="cooked_items" action="delete">
          <button
            @click="$emit('delete', item.id)"
            class="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Hapus"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </PermissionBasedAccess>
      </div>
    </div>
    
    <!-- Stock Info -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Stok Tersedia</span>
        <span class="text-lg font-bold text-gray-900">{{ formatNumber(item.total_stock) }}</span>
      </div>
      
      <!-- Stock Status Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-300"
          :class="getStockStatusColor(item.total_stock)"
          :style="{ width: getStockPercentage(item.total_stock) + '%' }"
        ></div>
      </div>
    </div>
    
    <!-- Price Info -->
    <div class="mb-4" v-if="item.harga_pokok_rata_rata">
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">Harga Pokok Rata-rata</span>
        <span class="text-sm font-medium text-gray-900">{{ formatCurrency(item.harga_pokok_rata_rata) }}</span>
      </div>
    </div>
    
    <!-- Raw Materials Summary -->
    <div class="border-t pt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Bahan Baku ({{ item.raw_material?.length || 0 }})</h4>
      <div class="space-y-1">
        <template v-if="item.raw_material && item.raw_material.length > 0">
          <div 
            v-for="(material, index) in item.raw_material.slice(0, 3)" 
            :key="index"
            class="flex justify-between text-xs text-gray-600"
          >
            <span>{{ getRawMaterialName(material.raw_materials_id?.id || material.raw_materials_id) }}</span>
            <span>{{ formatNumber(material.jumlah_dibutuhkan) }} {{ getRawMaterialUnit(material.raw_materials_id?.id || material.raw_materials_id) }}</span>
          </div>
          <div v-if="item.raw_material.length > 3" class="text-xs text-gray-500">
            +{{ item.raw_material.length - 3 }} bahan lainnya
          </div>
        </template>
        <div v-else class="text-xs text-gray-500 italic">
          Belum ada bahan baku
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  getUnitName: {
    type: Function,
    required: true
  },
  getRawMaterialName: {
    type: Function,
    required: true
  },
  rawMaterials: {
    type: Array,
    default: () => []
  }
})

defineEmits(['view', 'edit', 'delete'])

function formatNumber(value) {
  if (!value) return '0'
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatCurrency(value) {
  if (!value) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value)
}

function getStockStatusColor(stock) {
  if (stock <= 0) return 'bg-red-500'
  if (stock <= 10) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getStockPercentage(stock) {
  // Simple percentage calculation based on stock level
  if (stock <= 0) return 0
  if (stock <= 10) return 30
  if (stock <= 50) return 60
  return 100
}

function getRawMaterialUnit(rawMaterialId) {
  // console.log('getRawMaterialUnit called with:', rawMaterialId)
  // console.log('Available rawMaterials:', props.rawMaterials)
  
  if (!rawMaterialId) return 'Unknown'
  
  const material = props.rawMaterials.find(m => m.id === rawMaterialId)
  // console.log('Found material:', material)
  
  if (material && material.unit) {
    // Perbaikan: Cek apakah unit adalah object atau ID
    if (typeof material.unit === 'object' && material.unit.abbreviation) {
      // Jika unit adalah object, langsung ambil abbreviation
      // console.log('Unit abbreviation:', material.unit.abbreviation)
      return material.unit.abbreviation
    } else if (typeof material.unit === 'number') {
      // Jika unit adalah ID, gunakan getUnitName
      const unitName = props.getUnitName(material.unit)
      // console.log('Unit name from ID:', unitName)
      return unitName
    }
  }
  return 'Unknown'
}
</script>