<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  expense: {
    type: Object,
    default: () => null
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const categoryName = computed(() => {
  if (!props.expense?.kategori) return '-'
  const category = props.categories.find(cat => cat.id === props.expense.kategori)
  return category?.name || '-'
})

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getPaymentMethodLabel = (method) => {
  const methods = {
    cash: 'Cash',
    transfer: 'Transfer',
    debit: 'Kartu Debit'
  }
  return methods[method] || method
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-900">Detail Pengeluaran</h2>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div v-if="expense" class="space-y-6">
        <!-- Header Info -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Nama Pengeluaran</label>
              <p class="text-lg font-semibold text-gray-900">{{ expense.nama_pengeluaran || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Jumlah</label>
              <p class="text-lg font-bold text-red-600">{{ formatCurrency(expense.jumlah) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-2">Kategori</label>
            <div class="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg inline-block">
              {{ categoryName }}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-2">Metode Pembayaran</label>
            <div class="bg-green-50 text-green-800 px-3 py-2 rounded-lg inline-block">
              {{ getPaymentMethodLabel(expense.metode_pembayaran) }}
            </div>
          </div>
          
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-500 mb-2">Tanggal</label>
            <p class="text-gray-900">{{ formatDate(expense.tanggal) }}</p>
          </div>
        </div>
        
        <!-- Description -->
        <div v-if="expense.deskripsi">
          <label class="block text-sm font-medium text-gray-500 mb-2">Deskripsi</label>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-gray-900 whitespace-pre-wrap">{{ expense.deskripsi }}</p>
          </div>
        </div>
        
        <!-- Payment Proof -->
        <div v-if="expense.bukti_pembayaran">
          <label class="block text-sm font-medium text-gray-500 mb-2">Bukti Pembayaran</label>
          <div class="bg-gray-50 rounded-lg p-4">
            <img 
              :src="expense.bukti_pembayaran" 
              alt="Bukti pembayaran" 
              class="max-w-full h-auto max-h-64 object-contain rounded border cursor-pointer"
              @click="$event.target.requestFullscreen()"
            />
            <p class="text-xs text-gray-500 mt-2">Klik gambar untuk melihat ukuran penuh</p>
          </div>
        </div>
        
        <!-- Metadata -->
        <div class="border-t pt-4">
          <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div v-if="expense.date_created">
              <label class="block font-medium mb-1">Dibuat pada</label>
              <p>{{ formatDate(expense.date_created) }}</p>
            </div>
            <div v-if="expense.date_updated">
              <label class="block font-medium mb-1">Terakhir diupdate</label>
              <p>{{ formatDate(expense.date_updated) }}</p>
            </div>
            <div v-if="expense.user_created">
              <label class="block font-medium mb-1">Dibuat oleh</label>
              <p>{{ expense.user_created.first_name }} {{ expense.user_created.last_name }}</p>
            </div>
            <div v-if="expense.sync_status">
              <label class="block font-medium mb-1">Status Sync</label>
              <div class="flex items-center">
                <div 
                  class="w-2 h-2 rounded-full mr-2"
                  :class="{
                    'bg-green-500': expense.sync_status === 'synced',
                    'bg-yellow-500': expense.sync_status === 'pending',
                    'bg-red-500': expense.sync_status === 'failed'
                  }"
                ></div>
                <span class="capitalize">{{ expense.sync_status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Data State -->
      <div v-else class="text-center py-8">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500">Data pengeluaran tidak tersedia</p>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-end pt-6 border-t">
        <button
          @click="handleClose"
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>