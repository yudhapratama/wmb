<template>
  <Modal :isOpen="isOpen" @close="$emit('close')" size="3xl">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Terima Purchase Order</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
    </template>

    <!-- Order Info -->
    <div v-if="order" class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-600">Nomor PO</p>
          <p class="font-medium">{{ order.id }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Supplier</p>
          <p class="font-medium">{{ order.supplier?.nama_pt_toko || 'N/A' }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Tanggal Order</p>
          <p class="font-medium">{{ formatDate(order.date_created) }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Total</p>
          <p class="font-medium">{{ formatCurrency(calculatedTotal) }}</p>
        </div>
      </div>
    </div>

    <!-- Form Penerimaan -->
    <div class="space-y-4">
          <h3 class="font-semibold">Form Penerimaan Barang</h3>
          
          <div v-for="(item, index) in receiptItems" :key="item.id" class="border rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-medium">{{ item.nama_item }}</h4>
                <p class="text-sm text-gray-600">Jumlah Pesan: {{ item.jumlah_pesan }} {{ item.unit }}</p>
                <p class="text-sm text-gray-600">Harga: {{ formatCurrency(item.harga_satuan) }}</p>
              </div>
            </div>
            
            <!-- Input Jumlah Diterima -->
            <div class="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Diterima *</label>
                <div class="flex">
                  <input 
                    v-model.number="item.total_diterima"
                    type="number" 
                    step="0.01"
                    :max="item.jumlah_pesan"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                  <span class="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                    {{ item.unit }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Checkbox Penyusutan -->
            <div class="mb-3">
              <label class="flex items-center">
                <input 
                  v-model="item.has_penyusutan"
                  type="checkbox" 
                  class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span class="ml-2 text-sm font-medium text-gray-700">Ada Penyusutan</span>
              </label>
            </div>
            
            <!-- Section Penyusutan -->
            <div v-if="item.has_penyusutan" class="bg-red-50 p-4 rounded-lg space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-red-700 mb-1">Jumlah Penyusutan *</label>
                  <div class="flex">
                    <input 
                      v-model.number="item.total_penyusutan"
                      type="number" 
                      step="0.01"
                      :max="item.total_diterima"
                      class="flex-1 px-3 py-2 border border-red-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="0"
                      required
                    />
                    <span class="px-3 py-2 bg-red-100 border border-l-0 border-red-300 rounded-r-md text-sm text-red-600">
                      {{ item.unit }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-red-700 mb-1">Alasan Penyusutan *</label>
                <Select
                  v-model="item.alasan_penyusutan"
                  :options="reasonOptions"
                  placeholder="Pilih alasan penyusutan"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-red-700 mb-1">Bukti Penyusutan (Upload Foto)</label>
                <div class="flex items-center gap-4">
                  <button
                    type="button"
                    @click="triggerFileInput(index)"
                    class="flex items-center gap-2 px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ambil Foto
                  </button>
                  <input 
                    :id="`shrinkageFileInput${index}`"
                    @change="handleFileUpload($event, index)"
                    type="file" 
                    accept="image/*"
                    class="hidden"
                  />
                  <img
                    v-if="item.bukti_penyusutan_preview"
                    :src="item.bukti_penyusutan_preview"
                    alt="Bukti Penyusutan"
                    class="w-20 h-20 object-cover rounded border"
                    @error="console.error('Error loading image:', $event)"
                    @load="console.log('Image loaded successfully')"
                  />
                </div>
                <p class="text-xs text-red-600 mt-1">Format: JPG, PNG, maksimal 5MB</p>
              </div>
            </div>
            
            <!-- Summary -->
            <div class="mt-4 p-3 bg-blue-50 rounded-lg">
              <div class="flex justify-between text-sm">
                <span class="text-blue-700">Jumlah yang dapat digunakan:</span>
                <span class="font-medium text-blue-900">{{ calculateUsableQuantity(item) }} {{ item.unit }}</span>
              </div>
            </div>
          </div>
    </div>

    <template #footer>
      <div class="flex gap-3 w-full">
        <button
          @click="$emit('close')"
          class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading || !isFormValid"
        >
          <svg v-if="!isLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Memproses...' : 'Proses Penerimaan' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import Select from '../../../ui/Select.vue'
import Modal from '../../../ui/Modal.vue'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { validateFile } from '../../../../utils/fileUtils'

const props = defineProps({
  isOpen: Boolean,
  order: Object,
  isLoading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const receiptItems = ref([])

// Opsi alasan penyusutan yang sama dengan shrinkagemodal
const reasonOptions = [
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'damaged', label: 'Rusak' },
  { value: 'lost', label: 'Hilang' },
  { value: 'theft', label: 'Pencurian' },
  { value: 'other', label: 'Lainnya' }
]

// Computed property untuk menghitung total dari semua items
const calculatedTotal = computed(() => {
  if (!props.order?.items || !Array.isArray(props.order.items)) {
    return 0
  }
  
  return props.order.items.reduce((total, item) => {
    // const quantity = item.jumlah_pesan || 0
    const price = item.harga_satuan || 0
    return total + price
  }, 0)
})

// Initialize receipt items when order changes
watch(() => props.order, (newOrder) => {
  if (newOrder?.items) {
    receiptItems.value = newOrder.items.map(item => ({
      ...item,
      total_diterima: item.jumlah_pesan, // Default to ordered quantity
      total_penyusutan: 0,
      alasan_penyusutan: '',
      bukti_penyusutan: null,
      bukti_penyusutan_preview: null,
      has_penyusutan: false
    }))
  }
}, { immediate: true })

const calculateUsableQuantity = (item) => {
  return (item.total_diterima || 0) - (item.total_penyusutan || 0)
}

const isFormValid = computed(() => {
  return receiptItems.value.every(item => {
    const hasReceived = item.total_diterima > 0
    const validShrinkage = !item.has_penyusutan || (
      item.total_penyusutan >= 0 && 
      item.total_penyusutan <= item.total_diterima &&
      item.alasan_penyusutan?.trim() &&
      item.bukti_penyusutan // Pastikan bukti penyusutan ada jika ada penyusutan
    )
    return hasReceived && validShrinkage
  })
})

// Fungsi untuk trigger file input
const triggerFileInput = (index) => {
  const fileInput = document.getElementById(`shrinkageFileInput${index}`)
  if (fileInput) {
    fileInput.click()
  }
}

// Single file upload instance for all items
const { 
  files, 
  previews, 
  errors: fileErrors, 
  isUploading, 
  uploadFiles, 
  handleFileSelect, 
  removeFile,
  clearFiles
} = useFileUpload({
  multiple: false,
  autoUpload: false,
  featureName: 'PurchaseOrderReceipt',
  dataId: null
})

const handleFileUpload = async (event, index) => {
  const file = event.target.files[0]
  if (file) {
    // Gunakan utility validation
    const validation = validateFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }
    
    try {
      console.log('Processing file for item:', index, file.name)
      
      // Clear previous files first
      clearFiles()
      
      // Handle file selection
      await handleFileSelect(event)
      
      console.log('After handleFileSelect - Files:', files.value)
      console.log('After handleFileSelect - Previews:', previews.value)
      
      // Check if files and previews are available
      if (files.value && files.value.length > 0 && 
          previews.value && previews.value.length > 0) {
        
        // Store file reference
        receiptItems.value[index].bukti_penyusutan = files.value[0]
        
        // Handle preview - get the preview URL
        const previewData = previews.value[0]
        receiptItems.value[index].bukti_penyusutan_preview = previewData.preview || previewData
        
        console.log('File berhasil diupload:', file.name)
        console.log('Preview berhasil dibuat:', receiptItems.value[index].bukti_penyusutan_preview)
      } else {
        console.error('Files or previews not available:', {
          files: files.value,
          previews: previews.value
        })
        throw new Error('Gagal memproses file')
      }
    } catch (error) {
      console.error('Error saat memproses file:', error)
      alert('Gagal memproses file. Silakan coba lagi.')
    }
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  // Collect all items that need file upload
  const itemsWithFiles = []
  
  // Persiapkan data item
  const itemsData = receiptItems.value.map((item, index) => {
    // If item has shrinkage and file, collect for upload
    if (item.has_penyusutan && item.bukti_penyusutan) {
      itemsWithFiles.push({ index, file: item.bukti_penyusutan })
    }
    
    return {
      id: item.id,
      item: item.nama_item,
      raw_material_id: item.raw_material_id,
      total_diterima: item.total_diterima,
      total_penyusutan: item.has_penyusutan ? item.total_penyusutan : 0,
      alasan_penyusutan: item.has_penyusutan ? item.alasan_penyusutan : null,
      bukti_penyusutan: null, // Will be updated after upload
      harga_satuan: item.harga_satuan,
      unit: item.unit,
      jumlah_dapat_digunakan: calculateUsableQuantity(item)
    }
  })
  
  try {
    // Upload files sequentially for each item that has files
    for (const { index, file } of itemsWithFiles) {
      console.log(`Uploading file for item ${index}:`, file.name)
      
      // Clear and set the file for upload
      clearFiles()
      
      // Create a new file input event to simulate file selection
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      
      const mockEvent = {
        target: {
          files: dataTransfer.files
        }
      }
      
      // Handle file selection
      await handleFileSelect(mockEvent)
      
      // Upload the file
      const tempId = `po_receipt_${props.order.id}_item_${index}`
      const uploadedIds = await uploadFiles(tempId)
      
      if (uploadedIds && uploadedIds.length > 0) {
        itemsData[index].bukti_penyusutan = uploadedIds[0]
        console.log(`Item ${index} bukti_penyusutan uploaded with ID:`, uploadedIds[0])
      } else {
        console.warn(`Item ${index} upload failed`)
        throw new Error(`Gagal mengupload bukti penyusutan untuk item ${index + 1}`)
      }
    }
    
    // Validasi final: pastikan semua item dengan penyusutan memiliki bukti_penyusutan
    const invalidItems = itemsData.filter((item, index) => 
      receiptItems.value[index].has_penyusutan && !item.bukti_penyusutan
    )
    
    if (invalidItems.length > 0) {
      console.error('Items dengan penyusutan tanpa bukti:', invalidItems)
      alert('Beberapa item dengan penyusutan tidak memiliki bukti. Silakan coba lagi.')
      return
    }
    
    // Siapkan data penerimaan
    const receiptData = {
      id: props.order.id,
      items: itemsData
    }
    
    console.log('Data penerimaan final:', JSON.stringify(receiptData, null, 2))
    
    // Kirim data ke parent component
    emit('submit', receiptData)
  } catch (error) {
    console.error('Error uploading files:', error)
    alert('Gagal mengupload bukti penyusutan. Silakan coba lagi.')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID')
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}
</script>
