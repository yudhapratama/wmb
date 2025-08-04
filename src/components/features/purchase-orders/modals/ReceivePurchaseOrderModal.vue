<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Penerimaan Purchase Order</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Informasi PO (Read-only) -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 class="font-semibold mb-3">Informasi Purchase Order</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Nomor PO:</span>
              <span class="font-medium ml-2">{{ order?.id }}</span>
            </div>
            <div>
              <span class="text-gray-600">Supplier:</span>
              <span class="font-medium ml-2">{{ order?.supplier?.nama_pt_toko }}</span>
            </div>
            <div>
              <span class="text-gray-600">Tanggal PO Dibuat:</span>
              <span class="font-medium ml-2">{{ formatDate(order?.date_created) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Pembuat PO:</span>
              <span class="font-medium ml-2">{{ order?.pembuat_po?.first_name }}</span>
            </div>
          </div>
        </div>

        <!-- Form Penerimaan -->
        <div class="space-y-4">
          <h3 class="font-semibold">Form Penerimaan Barang</h3>
          
          <div v-for="(item, index) in receiptItems" :key="item.id" class="border rounded-lg p-4"> <!-- item.items?.item?.unit?.unit -->
            <!-- <div><pre>{{ item }}</pre></div> -->
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-medium">{{ item.nama_item }}</h4>
                <p class="text-sm text-gray-600">Jumlah Pesan: {{ item.jumlah_pesan }} {{ item.unit }}</p>
                <p class="text-sm text-gray-600">Harga Satuan: {{ formatCurrency(item.harga_satuan) }}</p>
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
                <input 
                  @change="handleFileUpload($event, index)"
                  type="file" 
                  accept="image/*"
                  class="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p class="text-xs text-red-600 mt-1">Format: JPG, PNG, maksimal 5MB</p>
              </div>
            </div>
            
            <!-- Jumlah Dapat Digunakan (Calculated) -->
            <div class="mt-3 p-3 bg-green-50 rounded-lg">
              <span class="text-sm font-medium text-green-800">
                Jumlah Dapat Digunakan: {{ calculateUsableQuantity(item) }} {{ item.item?.unit?.abbreviation }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button 
            @click="handleSubmit" 
            :disabled="isLoading || !isFormValid"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Menyimpan...' : 'Simpan Penerimaan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import Select from '../../../ui/Select.vue'

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

// Initialize receipt items when order changes
watch(() => props.order, (newOrder) => {
  if (newOrder?.items) {
    receiptItems.value = newOrder.items.map(item => ({
      ...item,
      total_diterima: item.jumlah_pesan, // Default to ordered quantity
      total_penyusutan: 0,
      alasan_penyusutan: '',
      bukti_penyusutan: null,
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
      item.alasan_penyusutan?.trim()
    )
    return hasReceived && validShrinkage
  })
})

const handleFileUpload = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    // Validasi ukuran file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }
    receiptItems.value[index].bukti_penyusutan = file
  }
}

const handleSubmit = () => {
  const receiptData = {
    orderId: props.order.id,
    items: receiptItems.value.map(item => ({
      id: item.id,
      item: item.nama_item,
      raw_material_id: item.raw_material_id,
      total_diterima: item.total_diterima,
      total_penyusutan: item.has_penyusutan ? item.total_penyusutan : 0,
      alasan_penyusutan: item.has_penyusutan ? item.alasan_penyusutan : null,
      bukti_penyusutan: item.has_penyusutan ? item.bukti_penyusutan : null,
      harga_satuan: item.harga_satuan, // Tambahkan harga_satuan langsung dari item
      unit: item.unit, // Tambahkan unit untuk keperluan waste
      jumlah_dapat_digunakan: calculateUsableQuantity(item)
    }))
  }
  
  emit('submit', receiptData)
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