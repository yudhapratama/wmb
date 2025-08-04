<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Pembayaran Purchase Order</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

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
              <span class="font-medium ml-2">{{ formatDate(order?.date_created) }}</span>
            </div>
            <div>
              <span class="text-gray-600">Penerima PO:</span>
              <span class="font-medium ml-2">{{ order?.penerima_barang_name || order?.penerima_barang?.first_name || 'N/A' }}</span>
            </div>
            <div>
              <span class="text-gray-600">Tanggal Diterima:</span>
              <span class="font-medium ml-2">{{ formatDate(order?.date_updated) }}</span>
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
                    Harga Satuan
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
                    {{ formatCurrency(item.harga_satuan) }}
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
            <input 
              @change="handleFileUpload"
              type="file" 
              accept="image/*"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-6 border-t">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button 
            @click="handleSubmit" 
            :disabled="isLoading || !isFormValid"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Memproses...' : 'Bayar dan Selesaikan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

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
  const quantity = item.total_diterima || item.jumlah_pesan
  return quantity * (item.harga_satuan || 0)
}

const calculateShrinkageValue = (item) => {
  return (item.total_penyusutan || 0) * (item.harga_satuan || 0)
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

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validasi ukuran file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }
    paymentData.value.bukti_bayar = file
  }
}

const handleSubmit = () => {
  const submitData = {
    orderId: props.order.id,
    ...paymentData.value,
    final_total: finalTotal.value,
    subtotal: subtotal.value,
    total_shrinkage: totalShrinkageValue.value
  }
  
  emit('submit', submitData)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('id-ID')
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0)
}
</script>