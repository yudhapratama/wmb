<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">#{{ sale.id }}</h3>
        <p class="text-sm text-gray-500">{{ formatDateTime(sale.waktu_transaksi) }}</p>
      </div>
      <div class="flex space-x-2">
        <PermissionBasedAccess collection="sales" action="read">
          <button
            @click="$emit('view', sale)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Lihat Detail"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="sales" action="update">
          <button
            @click="$emit('edit', sale)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-md"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="sales" action="delete">
          <button
            @click="$emit('delete', sale)"
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
    
    <!-- Payment Method Badge -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Metode Pembayaran</span>
        <span :class="`px-2 py-1 rounded-full text-xs font-medium ${paymentMethodStatus.badgeColor}`">
          {{ paymentMethodStatus.label }}
        </span>
      </div>
    </div>
    
    <!-- Transaction Info -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-600">Total Transaksi</span>
        <span class="text-lg font-bold text-green-600">{{ formatCurrency(sale.total_transaksi) }}</span>
      </div>
      
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-600">Dibayarkan</span>
        <span class="text-sm font-medium text-gray-900">{{ formatCurrency(sale.dibayarkan) }}</span>
      </div>
      
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">Kembalian</span>
        <span class="text-sm font-bold text-blue-600">{{ formatCurrency(sale.kembalian) }}</span>
      </div>
    </div>
    
    <!-- Session Info -->
    <div class="mb-4" v-if="sale.sesi_penjualan">
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">Sesi Penjualan</span>
        <span class="text-sm font-medium text-gray-900">#{{ sale.sesi_penjualan.id }}</span>
      </div>
    </div>
    
    <!-- Items Summary -->
    <div class="border-t pt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Item ({{ sale.items?.length || 0 }})</h4>
      <div class="space-y-1">
        <template v-if="sale.items && sale.items.length > 0">
          <div 
            v-for="(item, index) in sale.items.slice(0, 3)" 
            :key="index"
            class="flex justify-between text-xs text-gray-600"
          >
            <span>{{ getProductName(item.product_id) }}</span>
            <span>{{ formatNumber(item.jumlah) }}x</span>
          </div>
          <div v-if="sale.items.length > 3" class="text-xs text-gray-500">
            +{{ sale.items.length - 3 }} item lainnya
          </div>
        </template>
        <div v-else class="text-xs text-gray-500 italic">
          Belum ada item
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'
import { useProducts } from '@/composables/useProducts'
import { formatCurrency, formatDateTime } from '@/utils/helpers'

export default {
  name: 'SalesCard',
  components: {
    PermissionBasedAccess
  },
  props: {
    sale: {
      type: Object,
      required: true
    }
  },
  emits: ['view', 'edit', 'delete'],
  setup(props) {
    const { products } = useProducts()

    const paymentMethodStatus = computed(() => {
      const method = props.sale.mekanisme_pembayaran
      const methodConfig = {
        'Cash': { label: 'Tunai', badgeColor: 'bg-green-100 text-green-800' },
        'BRI': { label: 'BRI', badgeColor: 'bg-blue-100 text-blue-800' },
        'BNI': { label: 'BNI', badgeColor: 'bg-orange-100 text-orange-800' },
        'OVO': { label: 'OVO', badgeColor: 'bg-purple-100 text-purple-800' },
        'QR': { label: 'QR Code', badgeColor: 'bg-gray-100 text-gray-800' }
      }
      return methodConfig[method] || { label: method, badgeColor: 'bg-gray-100 text-gray-800' }
    })

    const getProductName = (productId) => {
      const product = products.value.find(p => p.id === productId)
      return product ? product.nama_produk : 'Unknown Product'
    }
    
    function formatNumber(value) {
      if (!value) return '0'
      return new Intl.NumberFormat('id-ID').format(value)
    }

    return {
      paymentMethodStatus,
      getProductName,
      formatCurrency,
      formatDateTime,
      formatNumber
    }
  }
}
</script>