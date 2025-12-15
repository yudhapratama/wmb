<template>
  <Modal 
    :isOpen="isOpen" 
    title="Pembayaran Purchase Order" 
    size="3xl"
    @close="$emit('close')"
  >

    <!-- Section Informasi PO -->
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold mb-3">Informasi Purchase Order</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Nomor PO:</span>
              <span class="font-medium ml-2">#{{ order?.id }}</span>
            </div>
            <div>
              <span class="text-gray-600">Supplier:</span>
              <span class="font-medium ml-2">{{ order?.supplier?.nama_pt_toko }}</span>
            </div>
            <div>
              <span class="text-gray-600">Pembuat PO:</span>
              <span class="font-medium ml-2">{{ order?.pembuat_po?.first_name }}</span>
            </div>
            <div>
              <span class="text-gray-600">Tanggal Dibuat:</span>
              <span class="font-medium ml-2">{{ formatDateTimeIndonesian(order?.date_created, { day: 'numeric', month: 'numeric', year: 'numeric' }) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Penerima PO:</span>
              <span class="font-medium ml-2">{{ order?.penerima_barang_name || order?.penerima_barang?.first_name || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-gray-600">Tanggal Diterima:</span>
              <span class="font-medium ml-2">{{ formatDateTimeIndonesian(order?.date_updated, { day: 'numeric', month: 'numeric', year: 'numeric' }) }}</span>
            </div>
          </div>
    </div>

    <!-- Section Detail per Item -->
    <div class="mb-6">
          <h3 class="font-semibold mb-3">Detail Item</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Item
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Pesanan
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Diterima
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Harga
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in order?.items" :key="item.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ item.nama_item }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.jumlah_pesan }} {{ item.unit }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.total_diterima || item.jumlah_pesan }} {{ item.unit }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(calculateItemTotal(item)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
    </div>

    <!-- Section Penyusutan (hanya muncul jika ada penyusutan) -->
    <div v-if="hasShrinkage" class="mb-6">
          <h3 class="font-semibold mb-3 text-red-700">Detail Penyusutan</h3>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-red-200">
                <thead class="bg-red-100">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                      Nama Item
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                      Jumlah Penyusutan
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                      Alasan
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                      Nilai Penyusutan
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-red-50 divide-y divide-red-200">
                  <tr v-for="item in shrinkageItems" :key="item.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-900">
                      {{ item.nama_item }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                      {{ item.total_penyusutan }} {{ item.unit }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                      {{ getShrinkageReasonLabel(item.alasan_penyusutan) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                      {{ formatCurrency(calculateShrinkageValue(item)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 text-right">
              <span class="text-sm font-medium text-red-700">
                Total Nilai Penyusutan: {{ formatCurrency(totalShrinkageValue) }}
              </span>
            </div>
          </div>
    </div>

    <!-- Total Pembayaran -->
    <div class="bg-blue-50 p-4 rounded-lg mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-semibold text-blue-900">Total yang Harus Dibayarkan</h3>
              <p class="text-sm text-blue-700 mt-1">
                Subtotal: {{ formatCurrency(subtotal) }}
                <span v-if="hasShrinkage" class="block">
                  Dikurangi Penyusutan: {{ formatCurrency(totalShrinkageValue) }}
                </span>
              </p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-blue-900">
                {{ formatCurrency(finalTotal) }}
              </div>
            </div>
          </div>
    </div>

    <!-- Form Pembayaran -->
    <div class="space-y-4 mb-6">
          <h3 class="font-semibold">Informasi Pembayaran</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembayaran *</label>
              <input 
                v-model="paymentData.tanggal_pembayaran"
                type="date" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Total Pembayaran *</label>
              <input 
                v-model.number="paymentData.total_pembayaran"
                type="number" 
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :placeholder="finalTotal.toString()"
                required
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bukti Pembayaran</label>
            <div class="flex items-center gap-4">
              <button
                type="button"
                @click="triggerPaymentFileInput"
                class="flex items-center gap-2 px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ambil Foto
              </button>
              <input 
                id="paymentProofInput"
                @change="handleFileUpload"
                type="file" 
                accept="image/*"
                class="hidden"
              />
              <img
                v-if="paymentPreview"
                :src="paymentPreview"
                alt="Bukti Pembayaran"
                class="w-20 h-20 object-cover rounded border"
              />
            </div>
            <p class="text-xs text-gray-600 mt-1">Format: JPG, PNG, maksimal 5MB</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catatan Pembayaran</label>
            <textarea 
              v-model="paymentData.catatan_pembayaran"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Catatan tambahan untuk pembayaran..."
            ></textarea>
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
          {{ isLoading ? 'Memproses...' : 'Proses Pembayaran' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import Modal from '../../../ui/Modal.vue'
import { validateFile, createFilePreview } from '../../../../utils/fileUtils'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { formatCurrency, formatDateTimeIndonesian } from '@/utils/helpers'
const props = defineProps({
  isOpen: Boolean,
  order: Object,
  isLoading: Boolean
})

const emit = defineEmits(['close', 'submit'])

const paymentData = ref({
  tanggal_pembayaran: new Date().toISOString().split('T')[0],
  total_pembayaran: 0,
  bukti_bayar: null,
  catatan_pembayaran: ''
})
const paymentPreview = ref(null)

// Setup single-file upload for payment proof
const { 
  files,
  previews,
  errors: fileErrors,
  isUploading,
  uploadFiles,
  handleFileSelect,
  clearFiles,
  removeFile
} = useFileUpload({
  multiple: false,
  autoUpload: false,
  featureName: 'PurchaseOrderPayment',
  dataId: null
})

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.order) {
    paymentData.value.total_pembayaran = finalTotal.value
  }
})

// Computed properties
const subtotal = computed(() => {
  if (!props.order?.items) return 0
  return props.order.items.reduce((total, item) => {
    return total + calculateItemTotal(item)
  }, 0)
})

const shrinkageItems = computed(() => {
  if (!props.order?.items) return []
  return props.order.items.filter(item => item.total_penyusutan > 0)
})

const hasShrinkage = computed(() => {
  return shrinkageItems.value.length > 0
})

const totalShrinkageValue = computed(() => {
  return shrinkageItems.value.reduce((total, item) => {
    return total + calculateShrinkageValue(item)
  }, 0)
})

const finalTotal = computed(() => {
  return subtotal.value - totalShrinkageValue.value
})

const isFormValid = computed(() => {
  return paymentData.value.tanggal_pembayaran && 
         paymentData.value.total_pembayaran > 0
})

// Methods
const calculateItemTotal = (item) => {
  // Sekarang harga_satuan sudah merupakan total harga, bukan harga per unit
  return item.harga_satuan || 0
}

const calculateShrinkageValue = (item) => {
  // Untuk penyusutan, kita perlu menghitung proporsi dari total harga
  const totalReceived = item.total_diterima || item.jumlah_pesan
  const shrinkageRatio = (item.total_penyusutan || 0) / item.jumlah_pesan
  return shrinkageRatio * (item.harga_satuan || 0)
}

const getShrinkageReasonLabel = (reason) => {
  const reasons = {
    'expired': 'Kadaluarsa',
    'damaged': 'Rusak',
    'lost': 'Hilang',
    'theft': 'Pencurian',
    'other': 'Lainnya'
  }
  return reasons[reason] || reason
}

const triggerPaymentFileInput = () => {
  const input = document.getElementById('paymentProofInput')
  if (input) {
    input.click()
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    const validation = validateFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }
    try {
      // Clear previous selection and use composable to manage files
      clearFiles()
      await handleFileSelect(event)
      
      // Set preview from composable
      if (previews.value && previews.value.length > 0) {
        const previewData = previews.value[0]
        paymentPreview.value = previewData.preview || previewData
      } else {
        // Fallback
        paymentPreview.value = await createFilePreview(file)
      }
    } catch (error) {
      console.error('Error creating preview:', error)
      paymentPreview.value = URL.createObjectURL(file)
    }
    
    // Do NOT assign raw File to bukti_bayar; will upload on submit
  }
}

const handleSubmit = async () => {
  const submitData = {
    orderId: props.order.id,
    ...paymentData.value,
    final_total: finalTotal.value,
    subtotal: subtotal.value,
    total_shrinkage: totalShrinkageValue.value
  }
  
  // Upload payment proof if selected and attach asset ID
  if (files.value && files.value.length > 0) {
    const tempId = `po_payment_${props.order.id}`
    const uploadedIds = await uploadFiles(tempId)
    submitData.bukti_bayar = uploadedIds?.[0] || null
  } else {
    // Keep existing value if any (e.g., when re-opening modal)
    submitData.bukti_bayar = paymentData.value.bukti_bayar
  }
  
  emit('submit', submitData)
}
</script>