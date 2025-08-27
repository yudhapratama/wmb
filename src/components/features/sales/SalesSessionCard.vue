<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">
          Sesi #{{ session.id }}
        </h3>
        <div class="flex items-center text-sm text-gray-600 space-x-4">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ session.cashier?.first_name }} {{ session.cashier?.last_name }}
          </span>
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatDateTime(session.waktu_buka) }}
          </span>
        </div>
      </div>
      <div class="flex space-x-2">
        <!-- <PermissionBasedAccess collection="sales_sessions" action="read">
          <button
            @click="$emit('view-transactions', session)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Lihat Transaksi"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </PermissionBasedAccess> -->
        
        <button
          @click="$emit('view-session-detail', session)"
          class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Lihat Detail"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <PermissionBasedAccess collection="sales_sessions" action="update" v-if="!session.waktu_tutup">
          <button
            @click="$emit('open-pos', session)"
            class="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
            title="Buka POS Mode"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        <PermissionBasedAccess collection="sales_sessions" action="update" v-if="!session.waktu_tutup">
          <button
            @click="$emit('close-session', session)"
            class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Tutup Sesi"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </PermissionBasedAccess>
      </div>
    </div>
    
    <!-- Session Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium mb-1">Total Item Terjual</div>
        <div class="text-xl font-bold text-blue-900">
          {{ formatNumber(totalItemsSold) }}
          <span class="text-sm font-normal text-blue-700">item</span>
        </div>
      </div>
      <div class="bg-green-50 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium mb-1">Total Pendapatan</div>
        <div class="text-xl font-bold text-green-900">
          {{ formatCurrency(totalRevenue) }}
        </div>
      </div>
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium mb-1">Total Margin</div>
        <div class="text-xl font-bold text-purple-900">
          {{ formatCurrency(totalMargin) }}
        </div>
      </div>
    </div>
    
    <!-- Session Details -->
    <div v-if="session.waktu_tutup">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Detail Sesi yang Ditutup:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div class="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm">
          <span class="text-gray-700">Waktu Tutup</span>
          <span class="font-medium text-gray-900">{{ formatDateTime(session.waktu_tutup) }}</span>
        </div>
        <div class="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm">
          <span class="text-gray-700">Modal Awal</span>
          <span class="font-medium text-gray-900">{{ formatCurrency(session.modal_awal) }}</span>
        </div>
        <div class="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm">
          <span class="text-gray-700">Modal Akhir</span>
          <span class="font-medium text-gray-900">{{ formatCurrency(session.modal_akhir || 0) }}</span>
        </div>
        <div class="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm">
          <span class="text-gray-700">Selisih Modal</span>
          <span :class="`font-medium ${(session.modal_akhir || 0) >= session.modal_awal ? 'text-green-600' : 'text-red-600'}`">
            {{ formatCurrency(session.modal_selisih || ((session.modal_akhir || 0) - session.modal_awal)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'
import { formatCurrency, formatDateTime } from '@/utils/helpers'

export default {
  name: 'SalesSessionCard',
  components: {
    PermissionBasedAccess
  },
  props: {
    session: {
      type: Object,
      required: true
    },
    sales: {
      type: Array,
      default: () => []
    }
  },
  emits: ['view-transactions', 'open-pos', 'close-session'], // Ubah ke kebab-case
  setup(props) {
    const sessionStatus = computed(() => {
      if (props.session.waktu_tutup) {
        return {
          label: 'Ditutup',
          badgeColor: 'bg-gray-100 text-gray-800'
        }
      } else {
        return {
          label: 'Aktif',
          badgeColor: 'bg-green-100 text-green-800'
        }
      }
    })

    const calculateDuration = (start, end) => {
      if (!start || !end) return '-'
      
      const startTime = new Date(start)
      const endTime = new Date(end)
      const diffMs = endTime - startTime
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        return `${hours}j ${minutes}m`
      } else {
        return `${minutes}m`
      }
    }

    const calculateActiveDuration = (start) => {
      if (!start) return '-'
      
      const startTime = new Date(start)
      const currentTime = new Date()
      const diffMs = currentTime - startTime
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        return `${hours}j ${minutes}m`
      } else {
        return `${minutes}m`
      }
    }

    const formatNumber = (value) => {
      if (value === null || value === undefined) return '0'
      return parseFloat(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    }

    // Computed properties untuk menghitung data dari sales
    const sessionSales = computed(() => {
      return props.sales.filter(sale => 
        sale.sesi_penjualan && sale.sesi_penjualan.id === props.session.id
      )
    })

    const totalItemsSold = computed(() => {
      return sessionSales.value.reduce((total, sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          return total + sale.items.reduce((itemTotal, item) => {
            return itemTotal + (item.jumlah || 0)
          }, 0)
        }
        return total
      }, 0)
    })

    const totalRevenue = computed(() => {
      return sessionSales.value.reduce((total, sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          return total + sale.items.reduce((itemTotal, item) => {
            return itemTotal + ((item.harga_jual_saat_transaksi || 0) * (item.jumlah || 0))
          }, 0)
        }
        return total
      }, 0)
    })

    const totalMargin = computed(() => {
      return sessionSales.value.reduce((total, sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          return total + sale.items.reduce((itemTotal, item) => {
            return itemTotal + ((item.margin_saat_transaksi || 0) * (item.jumlah || 0))
          }, 0)
        }
        return total
      }, 0)
    })

    return {
      sessionStatus,
      calculateDuration,
      calculateActiveDuration,
      formatCurrency,
      formatDateTime,
      formatNumber,
      totalItemsSold,
      totalRevenue,
      totalMargin
    }
  }
}
</script>