<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div :class="statusConfig.bg" class="p-2 rounded-lg">
            <component :is="statusConfig.icon" class="w-5 h-5" :class="statusConfig.color" />
          </div>
          <div>
            <h3 class="font-semibold text-lg text-gray-900">Nomor PO: #{{ order.id }}</h3>
            <div class="flex items-center gap-4 mt-1 text-sm">
              <div class="flex items-center gap-1">
                <BuildingOfficeIcon class="w-4 h-4" /> 
                {{ order.supplier?.nama_pt_toko }}
              </div>
              <span :class="statusConfig.badgeColor" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ statusConfig.label }}
              </span>
              <span class="text-gray-500">oleh {{ order.pembuat_po?.first_name }}</span>
            </div>
            <div class="flex items-center gap-6 mt-2 text-sm">
              <div class="flex items-center gap-1 text-gray-500">
                <CalendarIcon class="w-4 h-4" />
                Order: {{ formatDate(order.date_created) }}
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <ArchiveBoxIcon class="w-4 h-4" />
                Delivery: {{ formatDate(order.tanggal_pembayaran || order.date_created) }}
              </div>
            </div>
            <div class="flex items-center gap-1 mt-1 text-sm text-gray-500">
              <HashtagIcon class="w-4 h-4" />
              {{ order.items?.length || 0 }} items
            </div>
            <p v-if="order.catatan_pembelian" class="text-xs text-gray-500 mt-1 truncate max-w-md">
              Note: {{ order.catatan_pembelian }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-blue-600 mb-3">
            {{ formatCurrency(order.total_pembayaran || 0) }}
          </div>
          <div class="flex gap-2">
            <!-- Tombol Terima untuk status Dibuat -->
            <PermissionBasedAccess collection="purchase_orders" action="update" v-if="order.status === 'Dibuat'">
              <button 
                @click="$emit('receive', order)" 
                class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1 text-sm"
              >
                <CheckIcon class="w-4 h-4" />
                Terima
              </button>
            </PermissionBasedAccess>
            
            <PermissionBasedAccess collection="purchase_orders" action="update">
              <button 
                @click="$emit('edit', order)" 
                class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
              >
                <PencilIcon class="w-4 h-4" />
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'
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
  CheckIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'receive'])

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

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0)
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('id-ID')
}
</script>