<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">{{ product.nama_produk }}</h3>
        <p class="text-sm text-gray-500">{{ product.kategori.name }}</p>
      </div>
      <div class="flex space-x-2">
        <PermissionBasedAccess collection="products" action="read">
          <button
            @click="$emit('view', product)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Lihat Detail"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="products" action="update">
          <button
            @click="$emit('edit', product)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-md"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="products" action="delete">
          <button
            @click="$emit('delete', product)"
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
    
    <!-- Product Type Badge -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Tipe Produk</span>
        <span :class="`px-2 py-1 rounded-full text-xs font-medium ${productTypeStatus.badgeColor}`">
          {{ productTypeStatus.label }}
        </span>
      </div>
    </div>
    
    <!-- Price Info -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-600">Harga Jual</span>
        <span class="text-lg font-bold text-green-600">{{ formatCurrency(product.harga_jual) }}</span>
      </div>
      
      <div class="flex justify-between items-center mb-2" v-if="product.tipe_produk === 'basic'">
        <span class="text-sm text-gray-600">Harga Pokok</span>
        <span class="text-sm font-medium text-gray-900">{{ formatCurrency(product.harga_pokok) }}</span>
      </div>
      
      <div class="flex justify-between items-center mb-2" v-else>
        <span class="text-sm text-gray-600">Total Harga Bahan</span>
        <span class="text-sm font-medium text-gray-900">{{ formatCurrency(product.total_harga_bahan) }}</span>
      </div>
      
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">Margin</span>
        <span class="text-sm font-bold text-blue-600">
          {{ product.tipe_produk === 'basic' ? calculateMargin(product.harga_jual, product.harga_pokok) : calculateMargin(product.harga_jual, product.total_harga_bahan) }}%
        </span>
      </div>
    </div>
    
    <!-- Consignment Info -->
    <div class="mb-4" v-if="product.konsinyasi && product.supplier_konsinyasi">
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">Supplier Konsinyasi</span>
        <span class="text-sm font-medium text-gray-900">{{ product.supplier_konsinyasi.nama_pt_toko }}</span>
      </div>
    </div>
    
    <!-- Recipe Items Summary (for recipe-based products) -->
    <div class="border-t pt-4" v-if="product.tipe_produk === 'recipe'">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Bahan Resep ({{ product.recipe_items?.length || 0 }})</h4>
      <div class="space-y-1">
        <template v-if="product.recipe_items && product.recipe_items.length > 0">
          <div 
            v-for="(item, index) in product.recipe_items.slice(0, 3)" 
            :key="index"
            class="flex justify-between text-xs text-gray-600"
          >
            <span>{{ getCookedItemName(item.cooked_items_id) }}</span>
            <span>{{ formatNumber(item.quantity) }}</span>
          </div>
          <div v-if="product.recipe_items.length > 3" class="text-xs text-gray-500">
            +{{ product.recipe_items.length - 3 }} bahan lainnya
          </div>
        </template>
        <div v-else class="text-xs text-gray-500 italic">
          Belum ada bahan resep
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'
import { useProductCategories } from '@/composables/useProductCategories'
import { useSuppliers } from '@/composables/useSuppliers'
import { useCookedItems } from '@/composables/useCookedItems'
import { formatCurrency, formatDateTime } from '@/utils/helpers'

export default {
  name: 'ProductCard',
  components: {
    PermissionBasedAccess
  },
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  emits: ['view', 'edit', 'delete'],
  setup(props) {
    const { categories } = useProductCategories()
    const { suppliers } = useSuppliers()
    const { cookedItems } = useCookedItems()

    const productTypeStatus = computed(() => {
      if (props.product.tipe_produk === 'basic') {
        return {
          bg: 'bg-blue-100',
          color: 'text-blue-600',
          label: 'Basic Product',
          badgeColor: 'bg-blue-100 text-blue-800'
        }
      } else {
        return {
          bg: 'bg-purple-100',
          color: 'text-purple-600',
          label: 'Recipe-based',
          badgeColor: 'bg-purple-100 text-purple-800'
        }
      }
    })

    const getCategoryName = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId)
      return category ? category.nama_kategori : 'Unknown Category'
    }

    const getSupplierName = (supplierId) => {
      const supplier = suppliers.value.find(s => s.id === supplierId)
      return supplier ? supplier.nama_supplier : 'Unknown Supplier'
    }
    
    const getCookedItemName = (cookedItemId) => {
      const item = cookedItems.value.find(i => i.id === cookedItemId)
      return item ? item.name : 'Unknown Item'
    }

    const calculateMargin = (hargaJual, hargaPokok) => {
      if (!hargaJual || !hargaPokok) return 0
      return Math.round(((hargaJual - hargaPokok) / hargaJual) * 100)
    }
    
    function formatNumber(value) {
      if (!value) return '0'
      return new Intl.NumberFormat('id-ID').format(value)
    }

    return {
      productTypeStatus,
      getCategoryName,
      getSupplierName,
      getCookedItemName,
      calculateMargin,
      formatCurrency,
      formatDateTime,
      formatNumber
    }
  }
}
</script>