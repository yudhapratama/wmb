<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-3 sm:p-6">
    <!-- Baris pertama: Pencarian, Status, Supplier -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text" 
            placeholder="Cari nomor order atau supplier..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <Select
          :modelValue="selectedStatus"
          @update:modelValue="$emit('update:selectedStatus', $event)"
          :options="statusOptions"
          placeholder="Semua Status"
        />
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
        <Select
          :modelValue="selectedSupplier"
          @update:modelValue="$emit('update:selectedSupplier', $event)"
          :options="supplierOptions"
          placeholder="Semua Supplier"
        />
      </div>
    </div>
    
    <!-- Baris kedua: Filter Tanggal -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter Berdasarkan</label>
        <Select
          :modelValue="dateFilter.dateField"
          @update:modelValue="updateDateField($event)"
          :options="[
            { value: 'date_created', label: 'Tanggal Dibuat'},
            { value: 'date_updated', label: 'Tanggal Diperbarui'}
          ]"
          placeholder="Semua Filter"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Rentang Tanggal</label>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            :value="dateFilter.startDate"
            @input="updateDateRange('startDate', $event.target.value)"
            class="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Pilih tanggal mulai..."
          />
          <input
            type="date"
            :value="dateFilter.endDate"
            @input="updateDateRange('endDate', $event.target.value)"
            class="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Pilih tanggal akhir..."
          />
        </div>
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
  suppliers: {
    type: Array,
    required: true
  },
  selectedStatus: {
    type: String,
    required: true
  },
  selectedSupplier: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    required: true
  },
  dateFilter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'update:selectedStatus', 
  'update:selectedSupplier', 
  'update:searchQuery',
  'update:dateFilter'
])

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Dibuat', label: 'Dibuat' },
  { value: 'Diterima', label: 'Diterima' },
  { value: 'Selesai', label: 'Selesai' }
]

const supplierOptions = computed(() => [
  { value: 'all', label: 'Semua Supplier' },
  ...props.suppliers.map(supplier => ({
    value: supplier.nama_pt_toko,
    label: supplier.nama_pt_toko
  }))
])

function updateDateField(field) {
  emit('update:dateFilter', {
    ...props.dateFilter,
    dateField: field
  })
}

function updateDateRange(field, value) {
  emit('update:dateFilter', {
    ...props.dateFilter,
    [field]: value
  })
}

function clearFilters() {
  emit('update:searchQuery', '')
  emit('update:selectedStatus', 'all')
  emit('update:selectedSupplier', 'all')
  emit('update:dateFilter', {
    startDate: '',
    endDate: '',
    dateField: 'date_created'
  })
}
</script>
