<script setup>
import { ref, watch, computed } from 'vue'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { getAllowedFileTypes } from '../../../../utils/fileUtils'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'

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
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  id: null, // Add id field
  nama_pengeluaran: '',
  kategori: '',
  jumlah: 0,
  deskripsi: '',
  tanggal: '',
  metode_pembayaran: 'cash',
  bukti_pembayaran: null
})

const errors = ref({})

// Category options for Select component
const categoryOptions = computed(() => [
  { value: '', label: 'Pilih kategori' },
  ...props.categories.map(category => ({
    value: category.id,
    label: category.name
  }))
])

// Use enhanced file upload composable
const { 
  files, 
  previews, 
  errors: fileErrors, 
  isUploading, 
  uploadFiles, 
  handleFileSelect, 
  removeFile,
  clearFiles,
  getFileUrl // Extract getFileUrl from useFileUpload
} = useFileUpload({
  multiple: false,
  autoUpload: false,
  featureName: 'Expenses',
  dataId: null
})

// Reset form when modal opens or expense changes
watch([() => props.isOpen, () => props.expense], ([newIsOpen, newExpense]) => {
  if (newIsOpen && newExpense) {
    populateForm(newExpense)
  }
})

function populateForm(expense) {
  formData.value = {
    id: expense.id, // Include the expense ID
    nama_pengeluaran: expense.nama_pengeluaran || '',
    kategori: expense.kategori?.id || expense.kategori || '',
    jumlah: expense.jumlah || 0,
    deskripsi: expense.deskripsi || '',
    tanggal: expense.tanggal ? expense.tanggal.split('T')[0] : '',
    metode_pembayaran: expense.metode_pembayaran || 'cash',
    bukti_pembayaran: expense.bukti_pembayaran || null
  }
  
  // Clear previous file selections
  files.value = []
  previews.value = []
  
  errors.value = {}
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

const handleImageChange = async (event) => {
  await handleFileSelect(event)
}

function removeImage() {
  removeFile(0)
  formData.value.bukti_pembayaran = null
}

const handleSubmit = async () => {
  if (validateForm()) {
    let bukti_pembayaran = formData.value.bukti_pembayaran
    
    // Upload new file if selected
    if (files.value.length > 0) {
      const uploadedIds = await uploadFiles(props.expense.id)
      bukti_pembayaran = uploadedIds[0] || bukti_pembayaran
    }
    
    emit('submit', { 
      id: formData.value.id, // Ensure ID is included
      ...formData.value, 
      bukti_pembayaran 
    })
  }
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    :title="expense ? `Edit Pengeluaran - ${expense.nama_pengeluaran}` : 'Edit Pengeluaran'" 
    size="3xl"
    @close="emit('close')"
  >
    <div v-if="expense && formData">
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
            <Select
              :modelValue="formData.metode_pembayaran"
              @update:modelValue="formData.metode_pembayaran = $event"
              :options="[
                { value: 'cash', label: 'Cash'},
                { value: 'transfer', label: 'Transfer'},
                { value: 'debit', label: 'Kartu Debit'}
              ]"
              placeholder="Pilih Metode Pembayaran"
            />
            <p v-if="errors.metode_pembayaran" class="text-red-500 text-xs mt-1">{{ errors.metode_pembayaran }}</p>
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
            <!-- Show new uploaded image preview -->
            <img
              v-if="previews && previews[0]"
              :src="previews[0].preview"
              alt="Payment proof preview"
              class="w-20 h-20 object-cover rounded border"
            />
            <!-- Show existing image if no new upload -->
            <img
              v-else-if="formData.bukti_pembayaran && !previews.length"
              :src="getFileUrl(formData.bukti_pembayaran)"
              alt="Payment proof preview"
              class="w-20 h-20 object-cover rounded border"
            />
            <button
              v-if="(previews && previews[0]) || formData.bukti_pembayaran"
              type="button"
              @click="removeImage"
              class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Hapus
            </button>
          </div>
        </div>
      </form>
    </div>
    
    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          @click="emit('close')"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-sm text-white rounded-md hover:bg-red-700"
          :disabled="isLoading || !formData?.kategori"
        >
          <svg v-if="!isLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Memproses...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </template>
  </Modal>
</template>