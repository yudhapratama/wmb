<script setup>
import { computed } from 'vue'
import Modal from '../../../ui/Modal.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  product: {
    type: Object,
    default: null
  },
  getCategoryName: {
    type: Function,
    required: true
  },
  getSupplierName: {
    type: Function,
    required: true
  },
  getRawMaterialName: {
    type: Function,
    required: true
  },
  getUnitName: {
    type: Function,
    required: true
  },
  rawMaterials: {
    type: Array,
    default: () => []
  },
  units: {
    type: Array,
    default: () => []
  },
  formatCurrency: {
    type: Function,
    required: false
  },
  activeTab: {
    type: String,
    default: 'details'
  }
})

const emit = defineEmits(['close', 'edit'])

const modalTitle = computed(() => {
  if (!props.product) return 'Detail Produk'
  return `Detail Produk - ${props.product.nama_produk}`
})

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getProductTypeLabel(type) {
  return type === 'basic' ? 'Basic Product' : 'Recipe-based Product'
}

function getProductTypeClass(type) {
  return type === 'basic' 
    ? 'bg-blue-100 text-blue-800' 
    : 'bg-purple-100 text-purple-800'
}

function calculateMarginPercentage() {
  if (!props.product) return 0
  
  const costPrice = props.product.tipe_produk === 'basic' 
    ? props.product.harga_pokok 
    : props.product.total_harga_bahan
  
  if (!costPrice || costPrice === 0) return 0
  
  const margin = props.product.harga_jual - costPrice
  return ((margin / props.product.harga_jual) * 100).toFixed(1)
}

function getRawMaterialUnit(rawMaterialId) {
  const material = props.rawMaterials.find(m => m.id === rawMaterialId)
  if (material && material.unit) {
    const unit = props.units.find(u => u.id === material.unit)
    return unit ? unit.abbreviation || unit.name : 'Unknown'
  }
  return 'pcs'
}

function calculateTotalRecipeCost() {
  if (!props.product?.recipe_items) return 0
  
  return props.product.recipe_items.reduce((total, item) => {
    const material = props.rawMaterials.find(m => m.id === item.raw_material_id)
    const materialCost = material ? (material.harga_per_unit || 0) : 0
    return total + (materialCost * item.jumlah_dibutuhkan)
  }, 0)
}
</script>

<template>
  <Modal 
    :isOpen="true" 
    :title="modalTitle" 
    size="3xl"
    @close="$emit('close')"
  >
    <div v-if="product" class="space-y-6">
      <!-- Basic Information -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
            <p class="text-lg font-semibold text-gray-900">{{ product.nama_produk }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <p class="text-gray-900">{{ product.kategori.name }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Produk</label>
            <span :class="getProductTypeClass(product.tipe_produk)" class="px-3 py-1 rounded-full text-sm font-medium">
              {{ getProductTypeLabel(product.tipe_produk) }}
            </span>
          </div>
          
          <div v-if="product.konsinyasi">
            <label class="block text-sm font-medium text-gray-700 mb-1">Status Konsinyasi</label>
            <div class="flex items-center space-x-2">
              <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                Konsinyasi
              </span>
              <span class="text-gray-600">- {{ product.supplier_konsinyasi.nama_pt_toko }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Information -->
      <div class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Harga</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
            <p class="text-xl font-bold text-green-600">{{ formatCurrency(product.harga_jual) }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ product.tipe_produk === 'basic' ? 'Harga Pokok' : 'Total Harga Bahan' }}
            </label>
            <p class="text-lg font-semibold text-gray-900">
              {{ formatCurrency(product.tipe_produk === 'basic' ? product.harga_pokok : product.total_harga_bahan) }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Margin Keuntungan</label>
            <div class="space-y-1">
              <p class="text-lg font-semibold text-blue-600">
                {{ formatCurrency(product.harga_jual - (product.tipe_produk === 'basic' ? product.harga_pokok : product.total_harga_bahan)) }}
              </p>
              <p class="text-sm text-gray-500">({{ calculateMarginPercentage() }}%)</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recipe Information (for Recipe-based products) -->
      <div v-if="product.tipe_produk === 'recipe' && product.recipe_items && product.recipe_items.length > 0" class="bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Resep Bahan</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bahan Baku
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Dibutuhkan
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimasi Biaya
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in product.recipe_items" :key="item.raw_material_id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                  {{ getRawMaterialName(item.raw_material_id) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ item.jumlah_dibutuhkan }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ getRawMaterialUnit(item.raw_material_id) }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {{ formatCurrency((rawMaterials.find(m => m.id === item.raw_material_id)?.harga_per_unit || 0) * item.jumlah_dibutuhkan) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50">
              <tr>
                <td colspan="3" class="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                  Total Estimasi Biaya Bahan:
                </td>
                <td class="px-4 py-3 text-sm font-bold text-gray-900">
                  {{ formatCurrency(calculateTotalRecipeCost()) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Metadata -->
      <div class="border-t pt-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
          <div v-if="product.date_created">
            <label class="block font-medium mb-1">Dibuat pada</label>
            <p>{{ formatDate(product.date_created) }}</p>
          </div>
          <div v-if="product.date_updated">
            <label class="block font-medium mb-1">Terakhir diperbarui</label>
            <p>{{ formatDate(product.date_updated) }}</p>
          </div>
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
        <PermissionBasedAccess collection="products" action="update">
          <button
            @click="$emit('edit', product)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Produk
          </button>
        </PermissionBasedAccess>
      </div>
    </template>
  </Modal>
</template>