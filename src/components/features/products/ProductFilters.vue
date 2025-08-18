<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <!-- Baris pertama: Pencarian & Kategori -->
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
            placeholder="Cari nama produk..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori Produk</label>
        <div class="relative">
          <Select
            :modelValue="selectedCategory"
            @update:modelValue="$emit('update:selectedCategory', $event)"
            :options="categoryOptions"
            placeholder="Pilih kategori produk..."
            class="w-full"
          />
        </div>
      </div>
    </div>
    
    <!-- Baris kedua: Filter Tipe Produk & Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Produk</label>
        <Select
          :modelValue="selectedType"
          @update:modelValue="$emit('update:selectedType', $event)"
          :options="typeOptions"
          placeholder="Pilih tipe produk..."
          class="w-full"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status Konsinyasi</label>
        <Select
          :modelValue="selectedConsignment"
          @update:modelValue="$emit('update:selectedConsignment', $event)"
          :options="consignmentOptions"
          placeholder="Pilih status konsinyasi..."
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
  categories: {
    type: Array,
    required: true
  },
  selectedCategory: {
    type: String,
    required: true
  },
  selectedType: {
    type: String,
    required: true
  },
  selectedConsignment: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'update:selectedCategory', 
  'update:selectedType',
  'update:selectedConsignment',
  'update:searchQuery'
])

const categoryOptions = computed(() => [
  { value: 'all', label: 'Semua Kategori' },
  ...props.categories.map(category => ({
    value: category.id,
    label: category.nama_kategori
  }))
])

const typeOptions = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'basic', label: 'Produk Dasar' },
  { value: 'recipe', label: 'Produk Resep' }
]

const consignmentOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'true', label: 'Konsinyasi' },
  { value: 'false', label: 'Non-Konsinyasi' }
]

function clearFilters() {
  emit('update:searchQuery', '')
  emit('update:selectedCategory', 'all')
  emit('update:selectedType', 'all')
  emit('update:selectedConsignment', 'all')
}
</script>