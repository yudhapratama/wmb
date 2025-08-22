<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Sesi #{{ session.id }}</h3>
        <p class="text-sm text-gray-500">{{ session.cashier?.first_name }} {{ session.cashier?.last_name }}</p>
      </div>
      <div class="flex space-x-2">
        <PermissionBasedAccess collection="sales_sessions" action="read">
          <button
            @click="$emit('view-transactions', session)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Lihat Transaksi"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="sales_sessions" action="update" v-if="!session.waktu_tutup">
          <button
            @click="$emit('open-pos', session)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-md"
            title="Buka POS Mode"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        </PermissionBasedAccess>
        
        <PermissionBasedAccess collection="sales_sessions" action="update" v-if="!session.waktu_tutup">
          <button
            @click="$emit('view-session-detail', session)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Lihat Detail Transaksi"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </PermissionBasedAccess>
      </div>
    </div>
    
    <!-- Session Status Badge -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Status Sesi</span>
        <span :class="`px-2 py-1 rounded-full text-xs font-medium ${sessionStatus.badgeColor}`">
          {{ sessionStatus.label }}
        </span>
      </div>
    </div>
    
    <!-- Modal Info -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-600">Modal Awal</span>
        <span class="text-lg font-bold text-green-600">{{ formatCurrency(session.modal_awal) }}</span>
      </div>
      
      <div class="flex justify-between items-center mb-2" v-if="session.waktu_tutup">
        <span class="text-sm text-gray-600">Modal Akhir</span>
        <span class="text-sm font-medium text-gray-900">{{ formatCurrency(session.modal_akhir || 0) }}</span>
      </div>
      
      <div class="flex justify-between items-center" v-if="session.waktu_tutup">
        <span class="text-sm text-gray-600">Selisih</span>
        <span :class="`text-sm font-bold ${(session.modal_akhir || 0) >= session.modal_awal ? 'text-green-600' : 'text-red-600'}`">
          {{ formatCurrency((session.modal_akhir || 0) - session.modal_awal) }}
        </span>
      </div>
    </div>
    
    <!-- Time Info -->
    <div class="border-t pt-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Waktu Operasional</h4>
      <div class="space-y-1">
        <div class="flex justify-between text-xs text-gray-600">
          <span>Waktu Buka</span>
          <span>{{ formatDateTime(session.waktu_buka) }}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-600" v-if="session.waktu_tutup">
          <span>Waktu Tutup</span>
          <span>{{ formatDateTime(session.waktu_tutup) }}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-600" v-if="session.waktu_tutup">
          <span>Durasi</span>
          <span>{{ calculateDuration(session.waktu_buka, session.waktu_tutup) }}</span>
        </div>
        <div class="flex justify-between text-xs text-gray-500" v-else>
          <span>Status</span>
          <span class="font-medium text-green-600">Sedang Aktif</span>
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

    return {
      sessionStatus,
      calculateDuration,
      formatCurrency,
      formatDateTime
    }
  }
}
</script>