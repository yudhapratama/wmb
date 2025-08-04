<script setup>
import { ref, watch } from 'vue'
import { handleImageUpload } from '../../../../utils/imageUtils'

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
  nama_pengeluaran: '',
  kategori: '',
  jumlah: 0,
  deskripsi: '',
  tanggal: '',
  metode_pembayaran: 'cash',
  bukti_pembayaran: null
})

const errors = ref({})
const imagePreview = ref('')

// Reset form when modal opens or expense changes
watch([() => props.isOpen, () => props.expense], ([newIsOpen, newExpense]) => {
  if (newIsOpen && newExpense) {
    populateForm(newExpense)
  }
})

function populateForm(expense) {
  formData.value = {
    nama_pengeluaran: expense.nama_pengeluaran || '',
    kategori: expense.kategori || '',
    jumlah: expense.jumlah || 0,
    deskripsi: expense.deskripsi || '',
    tanggal: expense.tanggal ? expense.tanggal.split('T')[0] : '',
    metode_pembayaran: expense.metode_pembayaran || 'cash',
    bukti_pembayaran: expense.bukti_pembayaran || null
  }
  
  // Set image preview if exists
  if (expense.bukti_pembayaran) {
    imagePreview.value = expense.bukti_pembayaran
  } else {
    imagePreview.value = ''
  }
  
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

async function handleImageChange(event) {
  const imageData = await handleImageUpload(event)
  if (imageData) {
    formData.value.bukti_pembayaran = imageData
    imagePreview.value = imageData
  }
}

function removeImage() {
  formData.value.bukti_pembayaran = null
  imagePreview.value = ''
}

function handleSubmit() {
  if (validateForm()) {
    emit('submit', { 
      id: props.expense.id,
      ...formData.value 
    })
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">Edit Pengeluaran</h2>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              v-model="formData.kategori"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.kategori }"
            >
              <option value="">Pilih kategori</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
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
          <div class="space-y-2">
            <input
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer"
            />
            <div v-if="imagePreview" class="relative">
              <img 
                :src="imagePreview" 
                alt="Payment proof preview" 
                class="w-32 h-32 object-cover rounded border"
              />
              <button
                type="button"
                @click="removeImage"
                class="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Hapus Gambar
              </button>
            </div>
            <div v-else class="border-dashed border-2 border-gray-300 rounded-lg p-4 text-center">
              <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-sm text-gray-500">Upload bukti pembayaran</p>
            </div>
          </div>
        </div>
        
        <div class="flex gap-2 pt-4">
          <button
            type="submit"
            :disabled="isLoading"
            class="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Menyimpan...' : 'Update Pengeluaran' }}
          </button>
          <button
            type="button"
            @click="handleClose"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  </div>
</template>