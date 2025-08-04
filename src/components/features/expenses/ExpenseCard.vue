<script setup>
import { defineProps, defineEmits } from 'vue'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  expense: {
    type: Object,
    required: true
  },
  getCategoryName: {
    type: Function,
    required: true
  },
  formatCurrency: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPaymentMethodLabel(method) {
  const methods = {
    'cash': 'Cash',
    'transfer': 'Transfer',
    'debit': 'Kartu Debit'
  }
  return methods[method] || method
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
    <div class="p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="p-2 bg-red-100 rounded-lg">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 class="font-medium text-gray-900">{{ expense.nama_pengeluaran }}</h3>
            <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L15 7" />
                </svg>
                {{ formatDate(expense.tanggal) }}
              </div>
              <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {{ getCategoryName(expense.kategori) }}
              </span>
              <span>{{ getPaymentMethodLabel(expense.metode_pembayaran) }}</span>
            </div>
            <p v-if="expense.deskripsi" class="mt-2 text-sm text-gray-600">
              {{ expense.deskripsi }}
            </p>
            <div v-if="expense.bukti_pembayaran" class="mt-2">
              <img 
                :src="`${$api.defaults.baseURL}/assets/${expense.bukti_pembayaran}`" 
                alt="Payment proof" 
                class="w-16 h-16 object-cover rounded border cursor-pointer"
                @click="$emit('view', expense)"
              />
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold text-red-600 mb-2">
            {{ formatCurrency(expense.jumlah) }}
          </div>
          <div class="flex gap-2">
            <button 
              @click="$emit('view', expense)"
              class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Details"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <PermissionBasedAccess collection="expenses" action="update">
              <button 
                @click="$emit('edit', expense)"
                class="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                title="Edit"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </PermissionBasedAccess>
            <PermissionBasedAccess collection="expenses" action="delete">
              <button 
                @click="$emit('delete', expense)"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete"
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