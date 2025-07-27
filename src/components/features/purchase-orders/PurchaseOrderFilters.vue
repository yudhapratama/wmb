<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  }
})

const emit = defineEmits(['update:selectedStatus', 'update:selectedSupplier', 'update:searchQuery'])

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
</script>