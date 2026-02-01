<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div class="p-3 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex items-start gap-4 min-w-0">
          <div :class="statusConfig.bg" class="p-2 rounded-lg">
            <component :is="statusConfig.icon" class="w-5 h-5" :class="statusConfig.color" />
          </div>
          <div class="min-w-0">
            <h3 class="font-semibold text-lg text-gray-900">Nomor PO: #{{ order.id }}</h3>
            <div class="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm">
              <div class="flex items-center gap-1 min-w-0">
                <BuildingOfficeIcon class="w-4 h-4" /> 
                <span class="truncate">{{ order.supplier?.nama_pt_toko }}</span>
              </div>
              <span :class="statusConfig.badgeColor" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ statusConfig.label }}
              </span>
              <span class="text-gray-500 whitespace-nowrap">oleh {{ order.pembuat_po?.first_name }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-3 sm:gap-6 mt-2 text-sm">
              <div class="flex items-center gap-1 text-gray-500">
                <CalendarIcon class="w-4 h-4" />
                Order: {{ formatDateTimeIndonesian(order.date_created, false, {day: 'numeric', month: 'numeric', year: 'numeric' }) }}
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <ArchiveBoxIcon class="w-4 h-4" />
                Delivery: {{ formatDateTimeIndonesian(order.tanggal_pembayaran || order.date_created, false, {day: 'numeric', month: 'numeric', year: 'numeric' }) }}
              </div>
            </div>
            <div class="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <HashtagIcon class="w-4 h-4" />
              {{ order.items?.length || 0 }} items
            </div>
            <p v-if="order.catatan_pembelian" class="text-xs text-gray-500 mt-1 truncate sm:max-w-md">
              Note: {{ order.catatan_pembelian }}
            </p>
          </div>
        </div>
        <div class="text-left sm:text-right w-full sm:w-auto">
          <div class="text-lg font-bold text-blue-600 mb-3">
            {{ formatCurrency(calculatedTotal) }}
          </div>
          <div class="flex flex-wrap gap-2 justify-start sm:justify-end">
            <!-- Status: Dibuat - Tombol: Terima, Detail, Edit, Hapus -->
            <template v-if="order.status === 'Dibuat'">
              <PermissionBasedAccess collection="purchase_orders" action="update">
                <button 
                  @click="$emit('receive', order)" 
                  class="w-full sm:w-auto px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1 text-sm"
                >
                  <CheckIcon class="w-4 h-4" />
                  Terima
                </button>
              </PermissionBasedAccess>
              
              <button 
                @click="$emit('detail', order)" 
                class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              
              <PermissionBasedAccess collection="purchase_orders" action="update">
                <button 
                  @click="$emit('edit', order)" 
                  class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </PermissionBasedAccess>
              
              <PermissionBasedAccess collection="purchase_orders" action="delete">
                <button 
                  @click="$emit('delete', order)" 
                  class="p-2.5 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </PermissionBasedAccess>
            </template>
            
            <!-- Status: Diterima - Tombol: Bayar dan Selesaikan, Detail -->
            <template v-else-if="order.status === 'Diterima'">
              <PermissionBasedAccess collection="purchase_orders" action="update">
                <button 
                  @click="$emit('pay', order)" 
                  class="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-1 text-sm"
                >
                  <CreditCardIcon class="w-4 h-4" />
                  Bayar dan Selesaikan
                </button>
              </PermissionBasedAccess>
              
              <button 
                @click="$emit('detail', order)" 
                class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </template>
            
            <!-- Status: Selesai - Tombol: Detail saja -->
            <template v-else-if="order.status === 'Selesai'">
              <button 
                @click="$emit('detail', order)" 
                class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'
import { formatCurrency, formatDateTimeIndonesian } from '../../../utils/helpers'
import { 
  PencilIcon, 
  TrashIcon, 
  ArchiveBoxIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  HashtagIcon, 
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  CheckIcon,
  CreditCardIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'receive', 'pay', 'detail'])

// Computed property untuk menghitung total dari semua items
const calculatedTotal = computed(() => {
  if (!props.order.items || !Array.isArray(props.order.items)) {
    return 0
  }
  
  return props.order.items.reduce((total, item) => {
    // const quantity = item.jumlah_pesan || 0
    const price = item.harga_satuan || 0
    return total + price
  }, 0)
})

const statusConfig = computed(() => {
  const { status } = props.order
  
  switch (status) {
    case 'Dibuat':
      return {
        label: 'Dibuat',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        badgeColor: 'bg-gray-100 text-gray-800',
        icon: ClockIcon
      }
    case 'Diterima':
      return {
        label: 'Diterima',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: CheckCircleIcon
      }
    case 'Selesai':
      return {
        label: 'Selesai',
        color: 'text-green-600',
        bg: 'bg-green-100',
        badgeColor: 'bg-green-100 text-green-800',
        icon: TruckIcon
      }
    default:
      return {
        label: status || 'Unknown',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        badgeColor: 'bg-gray-100 text-gray-800',
        icon: ClockIcon
      }
  }
})
</script>
