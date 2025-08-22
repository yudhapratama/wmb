<template>
  <Modal :isOpen="isOpen" @close="$emit('close')" size="lg">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">Tutup Sesi Penjualan</h3>
    </template>
    
    <template #body>
      <div class="space-y-6">
        <!-- Session Summary -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Ringkasan Sesi</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Kasir:</span>
              <span class="font-medium ml-2">{{ session?.cashier?.first_name }} {{ session?.cashier?.last_name }}</span>
            </div>
            <div>
              <span class="text-gray-600">Waktu Buka:</span>
              <span class="font-medium ml-2">{{ formatDateTime(session?.waktu_buka) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Modal Awal:</span>
              <span class="font-medium ml-2">{{ formatCurrency(session?.modal_awal) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Total Transaksi:</span>
              <span class="font-medium ml-2">{{ sales?.length || 0 }} transaksi</span>
            </div>
          </div>
        </div>

        <!-- Sales Summary -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Ringkasan Penjualan</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Total Penjualan:</span>
              <span class="font-medium ml-2">{{ formatCurrency(totalSales) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Total HPP:</span>
              <span class="font-medium ml-2">{{ formatCurrency(totalHPP) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Total Margin:</span>
              <span class="font-medium ml-2 text-green-600">{{ formatCurrency(totalMargin) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Persentase Margin:</span>
              <span class="font-medium ml-2 text-green-600">{{ marginPercentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Payment Methods Breakdown -->
        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-3">Rincian Pembayaran</h4>
          <div class="space-y-2 text-sm">
            <div v-for="(amount, method) in paymentBreakdown" :key="method" class="flex justify-between">
              <span class="text-gray-600">{{ method }}:</span>
              <span class="font-medium">{{ formatCurrency(amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Cash Count Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Uang Tunai di Kasir</label>
            <input
              v-model.number="formData.cash_count"
              type="number"
              step="0.01"
              min="0"
              placeholder="Hitung uang tunai yang ada di kasir..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Jumlah uang tunai aktual yang ada di kasir saat ini</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
            <textarea
              v-model="formData.notes"
              rows="3"
              placeholder="Catatan tambahan untuk penutupan sesi..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Cash Difference Alert -->
          <div v-if="cashDifference !== 0" class="p-4 rounded-md" :class="cashDifference > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg v-if="cashDifference > 0" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <svg v-else class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium" :class="cashDifference > 0 ? 'text-green-800' : 'text-red-800'">
                  {{ cashDifference > 0 ? 'Kelebihan Kas' : 'Kekurangan Kas' }}
                </h3>
                <div class="mt-2 text-sm" :class="cashDifference > 0 ? 'text-green-700' : 'text-red-700'">
                  <p>Selisih: {{ formatCurrency(Math.abs(cashDifference)) }}</p>
                  <p class="text-xs mt-1">
                    Expected: {{ formatCurrency(expectedCash) }} | Actual: {{ formatCurrency(formData.cash_count || 0) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </template>
    
    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tutup Sesi
        </button>
      </div>
    </template>
  </Modal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import { formatCurrency, formatDateTime } from '../../../../utils/helpers'

export default {
  name: 'CloseSessionModal',
  components: {
    Modal
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    session: {
      type: Object,
      required: true
    },
    sales: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const formData = ref({
      cash_count: 0,
      notes: ''
    })
    
    // Calculate totals
    const totalSales = computed(() => {
      return props.sales?.reduce((sum, sale) => {
        return sum + (sale.dibayarkan || 0)
      }, 0) || 0
    })
    
    const totalHPP = computed(() => {
      return props.sales?.reduce((sum, sale) => {
        return sum + (sale.items?.reduce((itemSum, item) => {
          return itemSum + ((item.hpp_saat_transaksi || 0) * (item.jumlah || 0))
        }, 0) || 0)
      }, 0) || 0
    })
    
    const totalMargin = computed(() => {
      return totalSales.value - totalHPP.value
    })
    
    const marginPercentage = computed(() => {
      if (totalSales.value === 0) return 0
      return ((totalMargin.value / totalSales.value) * 100).toFixed(1)
    })
    
    // Payment methods breakdown
    const paymentBreakdown = computed(() => {
      const breakdown = {}
      props.sales?.forEach(sale => {
        const method = sale.mekanisme_pembayaran || 'Cash'
        breakdown[method] = (breakdown[method] || 0) + (sale.dibayarkan || 0)
      })
      return breakdown
    })
    
    // Expected cash calculation
    const expectedCash = computed(() => {
      const cashSales = (paymentBreakdown.value['Cash'] || 0)
      const modalAwal = props.session?.modal_awal || 0
      return modalAwal + cashSales
    })
    
    // Cash difference
    const cashDifference = computed(() => {
      return (formData.value.cash_count || 0) - expectedCash.value
    })
    
    const canSubmit = computed(() => {
      return formData.value.cash_count >= 0
    })
    
    const handleSubmit = () => {
      if (!canSubmit.value) return
      
      const submitData = {
        waktu_tutup: new Date().toISOString(),
        cash_count: formData.value.cash_count,
        cash_difference: cashDifference.value,
        total_sales: totalSales.value,
        total_hpp: totalHPP.value,
        total_margin: totalMargin.value,
        payment_breakdown: paymentBreakdown.value,
        notes: formData.value.notes
      }
      
      emit('save', submitData)
    }
    
    // Reset form when modal closes
    watch(() => props.isOpen, (newIsOpen) => {
      if (!newIsOpen) {
        formData.value = {
          cash_count: 0,
          notes: ''
        }
      } else {
        // Set initial cash count to expected amount
        formData.value.cash_count = expectedCash.value
        // Tambahkan computed untuk debugging
        const debugInfo = computed(() => {
          return {
            salesCount: props.sales?.length || 0,
            salesData: props.sales,
            sessionId: props.session?.id,
            hasValidSales: props.sales?.some(sale => sale.sesi_penjualan?.id === props.session?.id)
          }
        })
        
        // Set initial cash count to expected amount
        formData.value.cash_count = expectedCash.value
        // Tambahkan logging untuk debugging
        console.log('CloseSessionModal opened with data:')
        console.log('Session:', props.session)
        console.log('Sales:', props.sales)
        console.log('Total Sales:', totalSales.value)
        console.log('Payment Breakdown:', paymentBreakdown.value)
      }
    })
    
    return {
      formData,
      totalSales,
      totalHPP,
      totalMargin,
      marginPercentage,
      paymentBreakdown,
      expectedCash,
      cashDifference,
      canSubmit,
      handleSubmit,
      formatCurrency,
      formatDateTime
    }
  }
}
</script>