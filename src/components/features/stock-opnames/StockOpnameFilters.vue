<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-3 sm:p-6">
    <!-- Baris pertama: Pencarian & Status -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <!-- Search Input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Cari Stock Opname
        </label>
        <div class="relative">
          <input
            type="text"
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            placeholder="Cari berdasarkan ID, pembuat, atau catatan..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      
      <!-- Status Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <Select
          :modelValue="selectedStatus"
          @update:modelValue="$emit('update:selectedStatus', $event)"
          :options="statusOptions"
          placeholder="Pilih status..."
          class="w-full"
        />
      </div>
    </div>
    
    <!-- Baris kedua: Filter Berdasarkan -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <!-- Date Field Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Filter Berdasarkan
        </label>
        <Select
          :modelValue="dateFilter.dateField"
          @update:modelValue="updateDateField($event)"
          :options="dateFieldOptions"
          placeholder="Pilih field tanggal..."
          class="w-full"
        />
      </div>
    </div>
    
    <!-- Baris ketiga: Rentang Tanggal -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Start Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tanggal Mulai
        </label>
        <input
          type="date"
          :value="dateFilter.startDate"
          @change="updateStartDate($event.target.value)"
          class="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Pilih tanggal mulai..."
        />
      </div>
      
      <!-- End Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Tanggal Akhir
        </label>
        <input
          type="date"
          :value="dateFilter.endDate"
          @change="updateEndDate($event.target.value)"
          class="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Pilih tanggal akhir..."
        />
      </div>
    </div>
    
    <!-- Reset Button -->
    <div class="flex justify-end mt-6">
      <button
        @click="resetFilters"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <XMarkIcon class="h-4 w-4 mr-2" />
        Bersihkan Filter
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import Select from '../../ui/Select.vue'

// Props
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  selectedStatus: {
    type: String,
    default: 'all'
  },
  dateFilter: {
    type: Object,
    default: () => ({
      startDate: '',
      endDate: '',
      dateField: 'tanggal_opname'
    })
  }
})

// Emits
const emit = defineEmits([
  'update:searchQuery',
  'update:selectedStatus',
  'update:dateFilter'
])

// Computed options for dropdowns
const statusOptions = computed(() => [
  { value: 'all', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' }
])

const dateFieldOptions = computed(() => [
  { value: 'tanggal_opname', label: 'Tanggal Opname' },
  { value: 'date_created', label: 'Tanggal Dibuat' }
])

// Methods
function updateDateField(field) {
  emit('update:dateFilter', {
    ...props.dateFilter,
    dateField: field
  })
}

function updateStartDate(date) {
  emit('update:dateFilter', {
    ...props.dateFilter,
    startDate: date
  })
}

function updateEndDate(date) {
  emit('update:dateFilter', {
    ...props.dateFilter,
    endDate: date
  })
}

function resetFilters() {
  emit('update:searchQuery', '')
  emit('update:selectedStatus', 'all')
  emit('update:dateFilter', {
    startDate: '',
    endDate: '',
    dateField: 'tanggal_opname'
  })
}

</script>
