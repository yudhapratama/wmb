<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <!-- Baris pertama: Pencarian & Metode Pembayaran -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text" 
            placeholder="Cari ID transaksi..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
        <div class="relative">
          <Select
            :modelValue="selectedPaymentMethod"
            @update:modelValue="$emit('update:selectedPaymentMethod', $event)"
            :options="paymentMethodOptions"
            placeholder="Pilih metode pembayaran..."
            class="w-full"
          />
        </div>
      </div>
    </div>
    
    <!-- Baris kedua: Filter Tanggal & Sesi -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter Tanggal</label>
        <input
          :value="dateFilter.start"
          @input="$emit('update:dateFilter', { ...dateFilter, start: $event.target.value })"
          type="date"
          class="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Sesi Penjualan</label>
        <Select
          :modelValue="selectedSession"
          @update:modelValue="$emit('update:selectedSession', $event)"
          :options="sessionOptions"
          placeholder="Pilih sesi penjualan..."
          class="w-full"
        />
      </div>
    </div>
    
    <!-- Clear filters button -->
    <div class="mt-4 flex justify-end">
      <button
        @click="clearFilters"
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      >
        Bersihkan Filter
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Select from '../../ui/Select.vue'

const props = defineProps({
  sessionOptions: {
    type: Array,
    default: () => []
  },
  selectedPaymentMethod: {
    type: String,
    required: true
  },
  selectedSession: {
    type: String,
    required: true
  },
  dateFilter: {
    type: Object,
    default: () => ({ start: '', end: '' })
  },
  searchQuery: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'update:selectedPaymentMethod',
  'update:selectedSession',
  'update:dateFilter',
  'update:searchQuery'
])

const paymentMethodOptions = [
  { value: 'all', label: 'Semua Metode' },
  { value: 'Cash', label: 'Tunai' },
  { value: 'BRI', label: 'BRI' },
  { value: 'BNI', label: 'BNI' },
  { value: 'OVO', label: 'OVO' },
  { value: 'QR', label: 'QR Code' }
]

const sessionOptions = computed(() => {
  return props.sessionOptions.map(session => ({
    value: session.id,
    label: `Sesi ${session.id} - ${formatDateTime(session.created_at)}`
  }))
})

// Tambahkan fungsi formatDateTime
function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function clearFilters() {
  emit('update:searchQuery', '')
  emit('update:selectedPaymentMethod', 'all')
  emit('update:selectedSession', 'all')
  emit('update:dateFilter', { start: '', end: '' })
}
</script>