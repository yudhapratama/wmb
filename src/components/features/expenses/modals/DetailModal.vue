<script setup>
import { computed } from 'vue'
import Modal from '../../../ui/Modal.vue'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { formatCurrency, formatDateTimeIndonesian } from '@/utils/helpers'
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

// Add useFileUpload to get getFileUrl function
const { getFileUrl } = useFileUpload()

const categoryName = computed(() => {
  console.log(props.expense.kategori);
  if (!props.expense?.kategori) return '-'
  const category = props.expense.kategori
  return category?.name || '-'
})

const getPaymentMethodLabel = (method) => {
  const methods = {
    cash: 'Cash',
    transfer: 'Transfer',
    debit: 'Kartu Debit'
  }
  return methods[method] || method
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Detail Pengeluaran" 
    size="3xl"
    @close="emit('close')"
  >
    <div v-if="expense" class="space-y-6">
      <!-- Header Info -->
      <div class="bg-gray-50 rounded-lg">
        <h3 class="font-semibold mb-3">Informasi Pengeluaran</h3>
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
      <hr>
      
      <!-- Details Grid -->
      <div>
        <h3 class="font-semibold mb-3">Detail Pengeluaran</h3>
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
            <p class="text-gray-900">{{ formatDateTimeIndonesian(expense.tanggal, false, { weekday: 'long' }) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <div v-if="expense.deskripsi">
        <label class="block text-sm font-medium text-gray-500 mb-2">Deskripsi</label>
        <div class="bg-gray-50 rounded-lg">
          <p class="text-gray-900 whitespace-pre-wrap">{{ expense.deskripsi }}</p>
        </div>
      </div>
      
      <!-- Payment Proof -->
      <div v-if="expense.bukti_pembayaran">
        <label class="block text-sm font-medium text-gray-500 mb-2">Bukti Pembayaran</label>
        <div class="bg-gray-50 rounded-lg p-4">
          <img 
            :src="getFileUrl(expense.bukti_pembayaran)" 
            alt="Bukti pembayaran" 
            class="max-w-full h-auto max-h-64 object-contain rounded border cursor-pointer"
            @click="$event.target.requestFullscreen()"
            @error="$event.target.style.display = 'none'"
          />
          <p class="text-xs text-gray-500 mt-2">Klik gambar untuk melihat ukuran penuh</p>
        </div>
      </div>
      
      <!-- Metadata -->
      <div class="border-t pt-4">
        <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div v-if="expense.date_created">
            <label class="block font-medium mb-1">Dibuat pada</label>
            <p>{{ formatDateTimeIndonesian(expense.date_created, false, { weekday: 'long' }) }}</p>
          </div>
          <div v-if="expense.date_updated">
            <label class="block font-medium mb-1">Terakhir diupdate</label>
            <p>{{ formatDateTimeIndonesian(expense.date_updated, false, { weekday: 'long' }) }}</p>
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
    
    <template #footer>
      <div class="flex justify-end">
        <button
          @click="emit('close')"
          class="px-6 py-2 bg-gray-600 text-sm font-medium text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Tutup
        </button>
      </div>
    </template>
  </Modal>
</template>