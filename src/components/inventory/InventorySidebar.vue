<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'Inventory Items', path: '/inventory', icon: 'cube' },
  { name: 'Categories', path: '/inventory-categories', icon: 'folder' }
]
</script>

<template>
  <div class="bg-white shadow-sm rounded-lg overflow-hidden mb-4 border border-gray-100">
    <div class="px-4 py-3 border-b">
      <h3 class="text-base font-medium text-gray-800">Inventory Management</h3>
    </div>
    <div class="p-2">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
        :class="{ 'bg-blue-50 text-blue-700': route.path === item.path }"
      >
        <svg v-if="item.icon === 'cube'" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <svg v-if="item.icon === 'folder'" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span>{{ item.name }}</span>
      </router-link>
    </div>
  </div>
</template>