<script setup>
import { computed } from 'vue'
import Modal from '../../../ui/Modal.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'
import { formatCurrency, formatNumber } from '../../../../utils/helpers'
const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  getUnitName: {
    type: Function,
    required: true
  },
  getRawMaterialName: {
    type: Function,
    required: true
  },
  // Tambahkan props untuk rawMaterials dan units
  rawMaterials: {
    type: Array,
    default: () => []
  },
  units: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'edit'])

const modalTitle = computed(() => {
  if (!props.item) return 'Detail Bahan Siap Masak'
  return `Detail Bahan Siap Masak - ${props.item.name}`
})

function getStockStatus() {
  const stock = props.item?.total_stock || 0
  if (stock === 0) return 'Habis'
  if (stock < 10) return 'Stok Rendah'
  return 'Tersedia'
}

function getStockStatusClass() {
  const stock = props.item?.total_stock || 0
  if (stock === 0) return 'bg-red-100 text-red-800'
  if (stock < 10) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

function getRawMaterialUnit(rawMaterialId) {
  const material = props.rawMaterials.find(m => m.id === rawMaterialId)
  if (material && material.unit) {
    const unit = props.units.find(u => u.id === material.unit)
    return unit ? unit.abbreviation : 'Unknown'
  }
  return 'Unknown'
}
</script>

<template>
  <Modal 
    :isOpen="true" 
    :title="modalTitle" 
    size="3xl"
    @close="$emit('close')"
  >
    <div v-if="item" class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <p class="text-lg font-semibold text-gray-900">{{ item.name }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <p class="text-gray-900">{{ getUnitName(item.unit.id) }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stok Tersedia</label>
            <div class="flex items-center space-x-2">
              <span class="text-lg font-semibold text-gray-900">
                {{ formatNumber(item.total_stock) || 0 }} {{ getUnitName(item.unit.id) }}
              </span>
              <span :class="getStockStatusClass()" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ getStockStatus() }}
              </span>
            </div>
          </div>
          
          <div v-if="item.harga_pokok_rata_rata">
            <label class="block text-sm font-medium text-gray-700 mb-1">Harga Pokok Rata-rata</label>
            <p class="text-lg font-semibold text-green-600">
             {{ formatCurrency(item.harga_pokok_rata_rata) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- Recipe Section -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Resep Bahan Baku</h3>
        
        <div v-if="!item.raw_material || item.raw_material.length === 0" class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>Belum ada resep yang ditambahkan</p>
        </div>
        
        <div v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bahan Baku
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Dibutuhkan
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Stok
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(material, index) in item.raw_material" :key="index">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ getRawMaterialName(material.raw_materials_id.id) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ formatNumber(material.jumlah_dibutuhkan) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getUnitName(material.raw_materials_id.unit) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Tersedia
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Tutup
        </button>
        <PermissionBasedAccess collection="cooked_items" action="update">
          <button
            @click="$emit('edit', item)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Item
          </button>
        </PermissionBasedAccess>
      </div>
    </template>
  </Modal>
</template>