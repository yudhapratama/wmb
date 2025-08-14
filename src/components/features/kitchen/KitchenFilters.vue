<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <!-- Baris pertama: Pencarian & Item yang Diproduksi -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            :value="search"  
            @input="$emit('update:search', $event.target.value)"  
            type="text" 
            placeholder="Cari berdasarkan nama item atau penanggung jawab..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Item yang Diproduksi</label>
        <div class="relative">
          <Select
            :modelValue="selectedCookedItem"
            @update:modelValue="$emit('update:selectedCookedItem', $event)"
            :options="cookedItemOptions"
            placeholder="Pilih item yang diproduksi..."
            class="w-full"
          />
        </div>
      </div>
    </div>
    
    <!-- Baris kedua: Filter Tanggal -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
        <input
          :value="dateFilter.startDate"
          @input="updateDateRange('startDate', $event.target.value)"
          type="date"
          class="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Pilih tanggal mulai..."
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
        <input
          :value="dateFilter.endDate"
          @input="updateDateRange('endDate', $event.target.value)"
          type="date"
          class="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Pilih tanggal akhir..."
        >
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
  cookedItems: {
    type: Array,
    required: true
  },
  selectedCookedItem: {
    type: [String, Number, null],  // Tambahkan null sebagai tipe yang valid
    default: null  // Set default value
  },
  search: {  // Ubah dari searchQuery ke search untuk sesuai dengan Kitchen.vue
    type: String,
    default: ''
  },
  dateFilter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'update:selectedCookedItem', 
  'update:search',  // Ubah dari update:searchQuery ke update:search
  'update:dateFilter'
])

const cookedItemOptions = computed(() => [
  { value: null, label: 'Semua Item' },  // Ubah value dari 'all' ke null
  ...props.cookedItems.map(item => ({
    value: item.id,
    label: item.name
  }))
])

function updateDateRange(field, value) {
  emit('update:dateFilter', {
    ...props.dateFilter,
    [field]: value
  })
}

function clearFilters() {
  emit('update:search', '')  // Ubah dari update:searchQuery
  emit('update:selectedCookedItem', null)  // Set ke null, bukan 'all'
  emit('update:dateFilter', {
    startDate: '',
    endDate: ''
  })
}
</script>