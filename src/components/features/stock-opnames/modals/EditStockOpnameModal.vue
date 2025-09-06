<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Edit Stock Opname #{{ stockOpname?.id }}</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Tanggal Opname -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Opname <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.tanggal_opname"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Status <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="form.status"
              :options="statusOptions"
              placeholder="Pilih status..."
            />
            <p class="mt-1 text-sm text-gray-500">
              Pilih "draft" untuk melanjutkan penambahan item, atau "selesai" jika sudah final
            </p>
          </div>
          
          <!-- Catatan Keseluruhan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catatan Keseluruhan
            </label>
            <textarea
              v-model="form.catatan_keseluruhan"
              rows="4"
              placeholder="Masukkan catatan umum untuk stock opname ini (opsional)..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">
              Contoh: "Stock opname akhir bulan Januari 2025"
            </p>
          </div>
          
          <!-- Info Box -->
          <div class="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div class="flex">
              <ExclamationTriangleIcon class="w-5 h-5 text-amber-400 mt-0.5 mr-3" />
              <div class="text-sm text-amber-700">
                <p class="font-medium mb-1">Perhatian:</p>
                <ul class="list-disc list-inside space-y-1">
                  <li>Hanya stock opname dengan status "Draft" yang dapat diedit</li>
                  <li>Mengubah status ke "Selesai" akan mengunci data dan memproses koreksi stok</li>
                  <li>Setelah status "Selesai", data tidak dapat diubah lagi</li>
                </ul>
              </div>
            </div>
          </div>
          
          <!-- Metadata -->
          <div class="bg-gray-50 rounded-md p-4 space-y-2">
            <h4 class="text-sm font-medium text-gray-700">Informasi Stock Opname</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Dibuat:</span>
                <span class="ml-2 text-gray-900">{{ formatDateTime(stockOpname?.date_created) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Diperbarui:</span>
                <span class="ml-2 text-gray-900">{{ formatDateTime(stockOpname?.date_updated) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Dicatat oleh:</span>
                <span class="ml-2 text-gray-900">{{ stockOpname?.dicatat_oleh_name || 'Admin' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Jumlah Item:</span>
                <span class="ml-2 text-gray-900">{{ stockOpname?.items_count || 0 }} item</span>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="isLoading || !isFormValid"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import Select from '@/components/ui/Select.vue'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  stockOpname: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'submit'])

// Form data
const form = ref({
  tanggal_opname: '',
  status: 'draft',
  catatan_keseluruhan: ''
})

// Status options for Select component
const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' }
]

// Computed
const isFormValid = computed(() => {
  return form.value.tanggal_opname && form.value.status
})

// Methods
function handleSubmit() {
  if (!isFormValid.value) return
  
  const submitData = {
    id: props.stockOpname?.id,
    tanggal_opname: form.value.tanggal_opname,
    status: form.value.status,
    catatan_keseluruhan: form.value.catatan_keseluruhan || null
  }
  
  emit('submit', submitData)
}

function populateForm() {
  if (props.stockOpname) {
    form.value = {
      tanggal_opname: props.stockOpname.tanggal_opname || '',
      status: props.stockOpname.status || 'draft',
      catatan_keseluruhan: props.stockOpname.catatan_keseluruhan || ''
    }
  }
}

function resetForm() {
  form.value = {
    tanggal_opname: '',
    status: 'draft',
    catatan_keseluruhan: ''
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

// Watch for modal open/close and stock opname changes
watch(() => props.isOpen, (newValue) => {
  if (newValue && props.stockOpname) {
    populateForm()
  } else if (!newValue) {
    resetForm()
  }
})

watch(() => props.stockOpname, (newValue) => {
  if (newValue && props.isOpen) {
    populateForm()
  }
}, { deep: true })
</script>