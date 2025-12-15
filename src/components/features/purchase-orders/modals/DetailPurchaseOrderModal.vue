<template>
  <Modal 
    :isOpen="isOpen" 
    title="Detail Purchase Order" 
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
              <span class="text-gray-600">Status:</span>
              <span :class="statusBadgeClass" class="px-2 py-1 rounded-full text-xs font-medium ml-2">
                {{ order?.status }}
              </span>
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
              <span class="font-medium ml-2">{{ formatDateTimeIndonesian(order?.date_created, false, {day: 'numeric', month: 'numeric', year: 'numeric' }) }}</span>
            </div>
            <div v-if="order?.status !== 'Dibuat'">
              <span class="text-gray-600">Penerima Barang:</span>
              <span class="font-medium ml-2">{{ order?.penerima_barang_name || order?.penerima_barang?.first_name || 'N/A' }}</span>
            </div>
            <div v-if="order?.status !== 'Dibuat'">
              <span class="text-gray-600">Tanggal Diterima:</span>
              <span class="font-medium ml-2">{{ formatDateTimeIndonesian(order?.date_updated, false, {day: 'numeric', month: 'numeric', year: 'numeric' }) }}</span>
            </div>
            <div v-if="order?.status === 'Selesai'">
              <span class="text-gray-600">Tanggal Pembayaran:</span>
              <span class="font-medium ml-2">{{ formatDateTimeIndonesian(order?.tanggal_pembayaran, false, {day: 'numeric', month: 'numeric', year: 'numeric' }) }}</span>
            </div>
            <div v-if="order?.status === 'Selesai'">
              <span class="text-gray-600">Bukti Pembayaran:</span>
              <template v-if="paymentProofUrl">
                <a :href="paymentProofUrl" target="_blank" class="ml-2 inline-block">
                  <img :src="paymentProofUrl" alt="Bukti Pembayaran" class="h-16 w-auto object-cover rounded border border-gray-300 hover:border-blue-500 transition-colors" />
                </a>
              </template>
              <span v-else class="font-medium ml-2 text-gray-400 italic">Tidak ada bukti</span>
            </div>
          </div>
          <div v-if="order?.catatan_pembelian" class="mt-3">
            <span class="text-gray-600">Catatan:</span>
            <p class="text-sm text-gray-800 mt-1">{{ order.catatan_pembelian }}</p>
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
                  <th v-if="order?.status !== 'Dibuat'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Diterima
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
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
                  <td v-if="order?.status !== 'Dibuat'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.total_diterima || item.jumlah_pesan }} {{ item.unit }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatCurrency(item.harga_satuan) }}
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                      Bukti
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-red-200">
                  <tr v-for="item in shrinkageItems" :key="item.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ item.nama_item }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {{ item.total_penyusutan }} {{ item.unit }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ item.alasan_penyusutan || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {{ formatCurrency(calculateShrinkageValue(item)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a v-if="item.bukti_penyusutan_preview" :href="item.bukti_penyusutan_preview" target="_blank" class="block">
                        <img :src="item.bukti_penyusutan_preview" alt="Bukti Penyusutan" class="h-16 w-auto object-cover rounded border border-gray-300 hover:border-blue-500 transition-colors" />
                      </a>
                      <span v-else class="text-gray-400 italic">Tidak ada bukti</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
    </div>

    <!-- Section Total -->
    <div class="bg-blue-50 p-4 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold text-gray-900">Total Purchase Order:</span>
            <span class="text-xl font-bold text-blue-600">{{ formatCurrency(totalAmount) }}</span>
          </div>
          <div v-if="totalShrinkageValue > 0" class="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
            <span class="text-sm text-red-700">Total Nilai Penyusutan:</span>
            <span class="text-sm font-semibold text-red-600">{{ formatCurrency(totalShrinkageValue) }}</span>
          </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          @click="$emit('close')"
          class="px-6 py-2 bg-gray-600 text-sm font-medium text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Tutup
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import Modal from '../../../ui/Modal.vue'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { formatCurrency , formatDateTimeIndonesian} from '../../../../utils/helpers'
// Add useFileUpload to get getFileUrl function
const { getFileUrl } = useFileUpload()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

// Computed properties
const statusBadgeClass = computed(() => {
  const { status } = props.order || {}
  
  switch (status) {
    case 'Dibuat':
      return 'bg-gray-100 text-gray-800'
    case 'Diterima':
      return 'bg-blue-100 text-blue-800'
    case 'Selesai':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const hasShrinkage = computed(() => {
  if (!props.order?.items) return false
  return props.order.items.some(item => item.total_penyusutan > 0)
})

const shrinkageItems = computed(() => {
  if (!props.order?.items) return []
  return props.order.items
    .filter(item => item.total_penyusutan > 0)
    .map(item => ({
      ...item,
      // Convert bukti_penyusutan file ID to preview URL with authentication
      bukti_penyusutan_preview: item.bukti_penyusutan 
        ? getFileUrl(item.bukti_penyusutan)
        : null
    }))
})

// Preview URL untuk bukti pembayaran purchase order (file privat)
const paymentProofUrl = computed(() => {
  const fileId = props.order?.bukti_bayar
  return fileId ? getFileUrl(fileId) : null
})

const totalAmount = computed(() => {
  if (!props.order?.items) return 0
  return props.order.items.reduce((total, item) => {
    return total + (item.harga_satuan || 0)
  }, 0)
})

const totalShrinkageValue = computed(() => {
  if (!props.order?.items) return 0
  return props.order.items.reduce((total, item) => {
    return total + calculateShrinkageValue(item)
  }, 0)
})

// Methods
function calculateShrinkageValue(item) {
  if (!item.total_penyusutan || item.total_penyusutan <= 0) return 0
  
  const totalOrdered = item.jumlah_pesan || 0
  if (totalOrdered === 0) return 0
  
  const shrinkageRatio = item.total_penyusutan / totalOrdered
  return shrinkageRatio * (item.harga_satuan || 0)
}
</script>
