<script setup>
import { defineProps, defineEmits } from 'vue'

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
  }
})

const emit = defineEmits(['update:selectedCategory', 'update:selectedDateFilter', 'update:searchQuery'])
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex gap-4">
      <div class="flex-1">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari pengeluaran..."
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            class="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>
      <select
        :value="selectedCategory"
        @change="$emit('update:selectedCategory', $event.target.value)"
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-48"
      >
        <option value="all">Semua Kategori</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <select
        :value="selectedDateFilter"
        @change="$emit('update:selectedDateFilter', $event.target.value)"
        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-48"
      >
        <option value="all">Semua Waktu</option>
        <option value="today">Hari Ini</option>
        <option value="week">7 Hari Terakhir</option>
        <option value="month">30 Hari Terakhir</option>
      </select>
    </div>
  </div>
</template>