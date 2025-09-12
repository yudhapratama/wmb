<template>
  <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div :class="statusConfig.bg" class="p-2 rounded-lg">
            <svg class="w-5 h-5" :class="statusConfig.color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-lg text-gray-900">{{ supplier.nama_pt_toko }}</h3>
            <div class="flex items-center gap-4 mt-1 text-sm">
              <span class="px-2 py-1 rounded-full text-xs font-medium border border-gray-200">{{ supplier.kategori_supplier || 'Tidak ada kategori' }}</span>
              <span :class="statusConfig.badgeColor" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ supplier.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="flex items-center gap-6 mt-2 text-sm">
              <div class="flex items-center gap-1 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ supplier.no_telp_pic || 'No contact' }}
              </div>
            </div>
            <div class="flex items-center gap-1 mt-1 text-sm text-gray-500" v-if="supplier.alamat_pt_toko">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="truncate max-w-xs">{{ supplier.alamat_pt_toko }}</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="flex gap-2">
            <button 
              @click="$emit('view', supplier)"
              class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <PermissionBasedAccess collection="suppliers" action="update">
              <button 
                @click="$emit('edit', supplier)"
                class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </PermissionBasedAccess>
            <PermissionBasedAccess collection="suppliers" action="delete">
              <button 
                @click="$emit('delete', supplier)"
                class="p-2.5 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </PermissionBasedAccess>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  supplier: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'view'])

const statusConfig = computed(() => {
  if (props.supplier.status === 'active') {
    return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      badgeColor: 'bg-green-100 text-green-600'
    }
  } else {
    return {
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      badgeColor: 'bg-gray-100 text-gray-600'
    }
  }
})

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('id-ID')
}
</script>