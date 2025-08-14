<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">
          {{ prep.bahan_hasil_olahan?.name || 'Unknown Item' }}
        </h3>
        <div class="flex items-center text-sm text-gray-600 space-x-4">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatDate(prep.date_created) }}
          </span>
          <span class="flex items-center" v-if="prep.dicatat_oleh">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ prep.dicatat_oleh.first_name }} {{ prep.dicatat_oleh.last_name }}
          </span>
        </div>
      </div>
      <div class="flex space-x-2">
        <button
          @click="$emit('view', prep)"
          class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Lihat Detail"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <PermissionBasedAccess collection="kitchen_prep" action="update">
          <button
            @click="$emit('edit', prep)"
            class="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
            title="Edit"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </PermissionBasedAccess>
        <PermissionBasedAccess collection="kitchen_prep" action="delete">
          <button
            @click="$emit('delete', prep)"
            class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Hapus"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </PermissionBasedAccess>
      </div>
    </div>

    <!-- Production Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="text-sm text-blue-600 font-medium mb-1">Jumlah Dihasilkan</div>
        <div class="text-xl font-bold text-blue-900">
          {{ formatNumber(prep.jumlah_dihasilkan) }} 
          <span class="text-sm font-normal text-blue-700">
            {{ prep.bahan_hasil_olahan?.unit?.abbreviation || prep.bahan_hasil_olahan?.unit?.name || '' }}
          </span>
        </div>
      </div>
      <div class="bg-green-50 rounded-lg p-4">
        <div class="text-sm text-green-600 font-medium mb-1">HPP Pembuatan</div>
        <div class="text-xl font-bold text-green-900">
          {{ formatCurrency(prep.hpp_pembuatan || 0) }}
        </div>
      </div>
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="text-sm text-purple-600 font-medium mb-1">Bahan Baku</div>
        <div class="text-xl font-bold text-purple-900">
          {{ prep.bahan_baku?.length || 0 }} item
        </div>
      </div>
    </div>

    <!-- Raw Materials Used -->
    <div v-if="prep.bahan_baku && prep.bahan_baku.length > 0">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Bahan Baku yang Digunakan:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="material in prep.bahan_baku.slice(0, 4)"
          :key="material.id"
          class="flex justify-between items-center bg-gray-50 rounded px-3 py-2 text-sm"
        >
          <span class="text-gray-700">
            {{ material.raw_materials_id?.nama_item || 'Unknown' }}
          </span>
          <span class="font-medium text-gray-900">
            {{ formatNumber(material.jumlah_diambil) }}
            {{ material.raw_materials_id?.unit?.abbreviation || material.raw_materials_id?.unit?.name || '' }}
          </span>
        </div>
      </div>
      <div v-if="prep.bahan_baku.length > 4" class="text-sm text-gray-500 mt-2">
        +{{ prep.bahan_baku.length - 4 }} bahan baku lainnya
      </div>
    </div>
  </div>
</template>

<script setup>
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'

// Props
defineProps({
  prep: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['view', 'edit', 'delete'])

// Utility functions
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return parseFloat(value).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

function formatCurrency(value) {
  if (value === null || value === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}
</script>