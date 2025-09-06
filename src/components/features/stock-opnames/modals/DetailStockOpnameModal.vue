<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Detail Stock Opname #{{ stockOpname?.id }}</h2>
          <p class="text-sm text-gray-600 mt-1">
            {{ formatDate(stockOpname?.tanggal_opname) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Status Badge -->
          <span :class="getStatusBadgeClass(stockOpname?.status)" class="px-3 py-1 rounded-full text-xs font-medium">
            {{ stockOpname?.status }}
          </span>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <!-- Stock Opname Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Basic Info -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Umum</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">ID:</span>
                <span class="font-medium text-gray-900">#{{ stockOpname?.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal Opname:</span>
                <span class="font-medium text-gray-900">{{ formatDate(stockOpname?.tanggal_opname) }}</span>
              </div>
              <!-- <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span :class="getStatusBadgeClass(stockOpname?.status)" class="px-2 py-1 rounded text-xs font-medium">
                  {{ stockOpname?.status }}
                </span>
              </div> -->
              <div class="flex justify-between">
                <span class="text-gray-600">Dicatat oleh:</span>
                <span class="font-medium text-gray-900">{{ stockOpname?.dicatat_oleh_name || 'Admin' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Timestamps -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Waktu</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Dibuat:</span>
                <span class="font-medium text-gray-900">{{ formatDateTime(stockOpname?.date_created) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Diperbarui:</span>
                <span class="font-medium text-gray-900">{{ formatDateTime(stockOpname?.date_updated) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Jumlah Item:</span>
                <span class="font-medium text-gray-900">{{ stockOpname?.items_opname?.length || 0 }} item</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Notes -->
        <div v-if="stockOpname?.catatan_keseluruhan" class="mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-3">Catatan Keseluruhan</h3>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-gray-700 leading-relaxed">{{ stockOpname.catatan_keseluruhan }}</p>
          </div>
        </div>
        
        <!-- Items Section -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Item Stock Opname</h3>
            <PermissionBasedAccess collection="stock_opnames" action="update">
              <button
                v-if="stockOpname?.status === 'Draft'"
                @click="$emit('manage-items', stockOpname)"
                class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <PlusIcon class="w-4 h-4" />
                Kelola Item
              </button>
            </PermissionBasedAccess>
          </div>
          
          <!-- Items List -->
          <div v-if="stockOpname?.items_opname && stockOpname.items_opname.length > 0" class="space-y-3">
            <div
              v-for="item in stockOpname.items_opname"
              :key="item.id"
              class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{{ item.nama_bahan_name || item.nama_bahan?.nama_item }}</h4>
                  <p class="text-sm text-gray-600 mt-1">ID: {{ item.nama_bahan.id }}</p>
                  
                  <!-- Bukti Opname -->
                  <div v-if="item.bukti_opname" class="mt-3">
                    <p class="text-sm text-gray-600 mb-1 flex items-center">
                      <PhotoIcon class="h-4 w-4 mr-1" />
                      <span>Bukti Opname:</span>
                    </p>
                    <div class="relative w-24 h-24 border rounded-md overflow-hidden cursor-pointer" @click="openFullImage(item.bukti_opname)">
                      <img 
                        :src="getFileUrl(item.bukti_opname)" 
                        class="w-full h-full object-cover" 
                        @error="handleImageError"
                        alt="Bukti Opname"
                      />
                      <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                        <span class="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">Klik untuk memperbesar</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-right ml-4">
                  <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500 block">Stok Sistem</span>
                      <span class="font-medium text-gray-900">{{ item.stok_sistem || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block">Stok Fisik</span>
                      <span class="font-medium text-gray-900">{{ item.stok_fisik || 0 }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 block">Selisih</span>
                      <span :class="getSelisihClass(item.selisih)" class="font-medium">
                        {{ item.selisih > 0 ? '+' : '' }}{{ item.selisih || 0 }}
                      </span>
                    </div>
                  </div>
                  <div v-if="item.catatan_item" class="mt-2 text-xs text-gray-600">
                    <span class="font-medium">Catatan:</span> {{ item.catatan_item }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <ClipboardDocumentListIcon class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-gray-500 mb-2">Belum ada item yang ditambahkan</p>
            <PermissionBasedAccess collection="stock_opnames" action="update">
              <button
                v-if="stockOpname?.status === 'Draft'"
                @click="$emit('manage-items', stockOpname)"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Tambah item pertama
              </button>
            </PermissionBasedAccess>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div class="flex space-x-3">
          <PermissionBasedAccess collection="stock_opnames" action="update">
            <button
              v-if="stockOpname?.status === 'Draft'"
              @click="$emit('edit', stockOpname)"
              class="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              <PencilIcon class="w-4 h-4" />
              Edit
            </button>
          </PermissionBasedAccess>
          
          <PermissionBasedAccess collection="stock_opnames" action="update">
            <button
              v-if="stockOpname?.status === 'Draft'"
              @click="$emit('complete', stockOpname)"
              class="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors flex items-center gap-2"
            >
              <CheckIcon class="w-4 h-4" />
              Selesaikan
            </button>
          </PermissionBasedAccess>
        </div>
        
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  PhotoIcon
} from '@heroicons/vue/24/outline'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'
import { useFileUpload } from '@/composables/useFileUpload.js'

// Composables
const { getFileUrl } = useFileUpload({
  featureName: 'StockOpname'
})

// Props
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  stockOpname: {
    type: Object,
    default: null
  }
})

// Emits
defineEmits(['close', 'edit', 'complete', 'manage-items'])

// Methods
function formatDate(dateString) {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return '-'
  }
}

function formatDateTime(dateString) {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return '-'
  }
}

function getStatusBadgeClass(status) {
  const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium'
  
  // Default to Draft if no status
  const currentStatus = status || 'Draft'
  
  switch (currentStatus.toLowerCase()) {
    case 'draft':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'selesai':
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'dibatalkan':
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

function getSelisihClass(selisih) {
  if (selisih > 0) {
    return 'text-green-600'
  } else if (selisih < 0) {
    return 'text-red-600'
  }
  return 'text-gray-900'
}

// Fungsi untuk menampilkan gambar dalam ukuran penuh
function openFullImage(fileId) {
  if (!fileId) return
  
  const imageUrl = getFileUrl(fileId)
  window.open(imageUrl, '_blank')
}

// Fungsi untuk menangani error pada gambar
function handleImageError(event) {
  event.target.src = '/placeholder.svg'
  event.target.classList.add('bg-gray-100')
}
</script>