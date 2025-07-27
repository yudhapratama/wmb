<template>
  <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="Cari nama supplier..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div class="md:col-span-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori Supplier</label>
        <Select
          :modelValue="selectedCategory"
          @update:modelValue="$emit('update:selectedCategory', $event)"
          :options="categoryOptions"
          placeholder="Semua Kategori"
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
  selectedCategory: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:selectedCategory', 'update:searchQuery'])

const categoryOptions = computed(() => {
  const categories = [...new Set(props.suppliers.map(s => s.kategori_supplier).filter(Boolean))]
  return [
    { value: 'all', label: 'Semua Kategori' },
    ...categories.map(category => ({
      value: category,
      label: category
    }))
  ]
})
</script>