<script setup>
import { ref, watch, computed } from 'vue'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { validateFile, createFilePreview, getAllowedFileTypes } from '../../../../utils/fileUtils'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  nama_pengeluaran: '',
  kategori: '',
  jumlah: 0,
  deskripsi: '',
  tanggal: new Date().toISOString().split('T')[0],
  metode_pembayaran: 'cash',
  bukti_pembayaran: null
})

const errors = ref({})
// Remove imagePreview - use previews from useFileUpload instead
// const imagePreview = ref('')

// Category options for Select component
const categoryOptions = computed(() => [
  { value: '', label: 'Pilih kategori' },
  ...props.categories.map(category => ({
    value: category.id,
    label: category.name
  }))
])

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

function resetForm() {
  formData.value = {
    nama_pengeluaran: '',
    kategori: '',
    jumlah: 0,
    deskripsi: '',
    tanggal: new Date().toISOString().split('T')[0],
    metode_pembayaran: 'cash',
    bukti_pembayaran: null
  }
  errors.value = {}
  // Clear files instead of imagePreview
  clearFiles()
}

function validateForm() {
  errors.value = {}
  
  if (!formData.value.nama_pengeluaran.trim()) {
    errors.value.nama_pengeluaran = 'Nama pengeluaran harus diisi'
  }
  
  if (!formData.value.kategori) {
    errors.value.kategori = 'Kategori harus dipilih'
  }
  
  if (!formData.value.jumlah || formData.value.jumlah <= 0) {
    errors.value.jumlah = 'Jumlah harus lebih dari 0'
  }
  
  if (!formData.value.tanggal) {
    errors.value.tanggal = 'Tanggal harus diisi'
  }
  
  return Object.keys(errors.value).length === 0
}

// Use enhanced file upload composable
const { 
  files, 
  previews, 
  errors: fileErrors, 
  isUploading, 
  uploadFiles, 
  handleFileSelect, 
  removeFile,
  clearFiles // Add clearFiles
} = useFileUpload({
  multiple: false,
  autoUpload: false,
  featureName: 'Expenses',
  dataId: null
})

const handleImageChange = async (event) => {
  await handleFileSelect(event)
}

const handleSubmit = async () => {
  if (validateForm()) {
    let bukti_pembayaran = null
    
    // Upload file first if selected
    if (files.value.length > 0) {
      // We need a temporary ID for folder structure, use timestamp
      const tempId = Date.now().toString()
      const uploadedIds = await uploadFiles(tempId)
      bukti_pembayaran = uploadedIds[0] || null
    }
    
    // Include bukti_pembayaran in the expense data
    const expenseData = { 
      ...formData.value,
      bukti_pembayaran 
    }
    
    // Emit submit with expense data that includes file ID
    emit('submit', {
      data: expenseData,
      uploadFile: null // No longer needed since we upload before creating expense
    })
  }
}

function removeImage() {
  removeFile(0)
  formData.value.bukti_pembayaran = null
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Tambah Pengeluaran Baru" 
    size="3xl"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
          <Select
            :modelValue="formData.kategori"
            @update:modelValue="formData.kategori = $event"
            :options="categoryOptions"
            placeholder="Pilih kategori"
          />
          <p v-if="errors.kategori" class="text-red-500 text-xs mt-1">{{ errors.kategori }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
          <input
            v-model.number="formData.jumlah"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.jumlah }"
            placeholder="150000"
          />
          <p v-if="errors.jumlah" class="text-red-500 text-xs mt-1">{{ errors.jumlah }}</p>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pengeluaran *</label>
        <input
          v-model="formData.nama_pengeluaran"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          :class="{ 'border-red-500': errors.nama_pengeluaran }"
          placeholder="Bayar listrik bulan Januari"
        />
        <p v-if="errors.nama_pengeluaran" class="text-red-500 text-xs mt-1">{{ errors.nama_pengeluaran }}</p>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
        <textarea
          v-model="formData.deskripsi"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Deskripsi pengeluaran..."
        ></textarea>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
          <select
            v-model="formData.metode_pembayaran"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="debit">Kartu Debit</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
          <input
            v-model="formData.tanggal"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.tanggal }"
          />
          <p v-if="errors.tanggal" class="text-red-500 text-xs mt-1">{{ errors.tanggal }}</p>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Bukti Pembayaran</label>
        <div class="flex items-center gap-4">
          <button
            type="button"
            @click="$refs.fileInput.click()"
            class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ambil Foto
          </button>
          <input
            ref="fileInput"
            type="file"
            :accept="getAllowedFileTypes()"
            @change="handleImageChange"
            class="hidden"
          />
          <img
            v-if="previews && previews[0]"
            :src="previews[0].preview || previews[0]"
            alt="Payment proof preview"
            class="w-20 h-20 object-cover rounded border"
          />
          <button
            v-if="previews && previews[0]"
            type="button"
            @click="removeImage"
            class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </form>
    
    <template #footer>
      <div class="flex gap-3 w-full">
        <button
          @click="emit('close')"
          class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="isLoading"
          class="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-sm font-medium text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="!isLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Memproses...' : 'Tambah Pengeluaran' }}
        </button>
      </div>
    </template>
  </Modal>
</template>