<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <!-- Baris pertama: Pencarian -->
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
            placeholder="Cari nama bahan siap masak..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
    
    <!-- Baris kedua: Filter Tanggal -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter Berdasarkan</label>
        <select
          :value="dateFilter.dateField"
          @change="updateDateField($event.target.value)"
          class="w-full px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="" disabled>Pilih jenis tanggal...</option>
          <option value="date_created">Tanggal Dibuat</option>
          <option value="date_updated">Tanggal Diperbarui</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Rentang Tanggal</label>
        <div class="flex gap-2">
          <input
            type="date"
            :value="dateFilter.startDate"
            @input="updateDateRange('startDate', $event.target.value)"
            class="flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Pilih tanggal mulai..."
          />
          <input
            type="date"
            :value="dateFilter.endDate"
            @input="updateDateRange('endDate', $event.target.value)"
            class="flex-1 px-3 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  dateFilter: {
    type: Object,
    default: () => ({ dateField: '', startDate: '', endDate: '' })
  }
})

const emit = defineEmits(['update:searchQuery', 'update:dateFilter'])

function updateDateField(field) {
  emit('update:dateFilter', { 
    ...props.dateFilter, 
    dateField: field 
  })
}

function updateDateRange(key, value) {
  emit('update:dateFilter', { 
    ...props.dateFilter, 
    [key]: value 
  })
}

function clearFilters() {
  emit('update:searchQuery', '')
  emit('update:dateFilter', { dateField: '', startDate: '', endDate: '' })
}
</script>