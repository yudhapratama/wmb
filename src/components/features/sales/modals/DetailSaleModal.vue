<template>
  <Modal :show="show" @close="$emit('close')" size="xl">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">Detail Transaksi #{{ sale?.id }}</h3>
    </template>
    
    <template #body>
      <div class="space-y-6" v-if="sale">
        <!-- Transaction Info -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ID Transaksi</label>
              <p class="text-lg font-semibold text-gray-900">#{{ sale.id }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Waktu Transaksi</label>
              <p class="text-sm text-gray-900">{{ formatDateTime(sale.waktu_transaksi) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <span :class="`px-2 py-1 rounded-full text-xs font-medium ${paymentMethodStatus.badgeColor}`">
                {{ paymentMethodStatus.label }}
              </span>
            </div>
            <div v-if="sale.sesi_penjualan">
              <label class="block text-sm font-medium text-gray-700 mb-1">Sesi Penjualan</label>
              <p class="text-sm text-gray-900">#{{ sale.sesi_penjualan.id }}</p>
            </div>
          </div>
        </div>
        
        <!-- Items List -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-4">Item Transaksi</h4>
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Satuan
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HPP
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in sale.items" :key="item.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ getProductName(item.product_id) }}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(item.jumlah) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatCurrency(item.harga_jual_saat_transaksi) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatCurrency(item.hpp_saat_transaksi) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ formatCurrency(item.harga_jual_saat_transaksi * item.jumlah) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {{ formatCurrency(item.margin_saat_transaksi * item.jumlah) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Payment Summary -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="text-lg font-medium text-gray-900 mb-4">Ringkasan Pembayaran</h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Subtotal:</span>
              <span class="font-medium">{{ formatCurrency(sale.total_transaksi) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Dibayarkan:</span>
              <span class="font-medium">{{ formatCurrency(sale.dibayarkan) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="font-medium">Kembalian:</span>
              <span class="font-bold text-green-600">{{ formatCurrency(sale.kembalian) }}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="font-medium">Total Margin:</span>
              <span class="font-bold text-blue-600">{{ formatCurrency(totalMargin) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Tutup
        </button>
        <PermissionBasedAccess collection="sales" action="update">
          <button
            @click="$emit('edit', sale)"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Edit Transaksi
          </button>
        </PermissionBasedAccess>
      </div>
    </template>
  </Modal>
</template>

<script>
import { computed } from 'vue'
import Modal from '../../../ui/Modal.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'
import { useProducts } from '@/composables/useProducts'
import { formatCurrency, formatDateTime } from '@/utils/helpers'

export default {
  name: 'DetailSaleModal',
  components: {
    Modal,
    PermissionBasedAccess
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    sale: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'edit'],
  setup(props) {
    const { products } = useProducts()
    
    const paymentMethodStatus = computed(() => {
      if (!props.sale) return { label: '', badgeColor: '' }
      
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
    
    const totalMargin = computed(() => {
      if (!props.sale?.items) return 0
      return props.sale.items.reduce((total, item) => {
        return total + (item.margin_saat_transaksi * item.jumlah)
      }, 0)
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
      totalMargin,
      getProductName,
      formatCurrency,
      formatDateTime,
      formatNumber
    }
  }
}
</script>