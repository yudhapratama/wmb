<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <!-- Baris pertama: Pencarian, Kategori, Filter Waktu -->
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
            placeholder="Cari pengeluaran..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <Select
          :modelValue="selectedCategory"
          @update:modelValue="$emit('update:selectedCategory', $event)"
          :options="categoryOptions"
          placeholder="Semua Kategori"
        />
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter Waktu</label>
        <Select
          :modelValue="selectedDateFilter"
          @update:modelValue="$emit('update:selectedDateFilter', $event)"
          :options="dateFilterOptions"
          placeholder="Semua Waktu"
        />
      </div>
    </div>
    
    <!-- Baris kedua: Filter Tanggal (opsional untuk custom range) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="selectedDateFilter === 'custom'">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter Berdasarkan</label>
        <Select
          :modelValue="dateFilter.dateField"
          @update:modelValue="updateDateField($event)"
          :options="[
            {value: 'tanggal', label: 'Tanggal Pengeluaran'},
            {value: 'date_created', label: 'Tanggal Dibuat'},
            {value: 'date_updated', label: 'Tanggal Diperbarui'},
          ]"
          placeholder="Semua Filter"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Rentang Tanggal</label>
        <div class="flex gap-2">
          <input
            type="date"
            :value="dateFilter.startDate"
            @input="updateDateRange('startDate', $event.target.value)"
            class="flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Pilih tanggal mulai..."
          />
          <input
            type="date"
            :value="dateFilter.endDate"
            @input="updateDateRange('endDate', $event.target.value)"
            class="flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
  categories: {
    type: Array,
    default: () => []
  },
  selectedCategory: {
    type: String,
    default: 'all'
  },
  selectedDateFilter: {
    type: String,
    default: 'all'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  dateFilter: {
    type: Object,
    default: () => ({
      startDate: '',
      endDate: '',
      dateField: 'tanggal'
    })
  }
})

const emit = defineEmits([
  'update:selectedCategory', 
  'update:selectedDateFilter', 
  'update:searchQuery',
  'update:dateFilter'
])

const categoryOptions = computed(() => [
  { value: 'all', label: 'Semua Kategori' },
  ...props.categories.map(category => ({
    value: category.id.toString(),
    label: category.name
  }))
])

const dateFilterOptions = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari Terakhir' },
  { value: 'month', label: '30 Hari Terakhir' },
  { value: 'custom', label: 'Rentang Kustom' }
]

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
  emit('update:selectedCategory', 'all')
  emit('update:selectedDateFilter', 'all')
  emit('update:dateFilter', {
    startDate: '',
    endDate: '',
    dateField: 'tanggal'
  })
}
</script>