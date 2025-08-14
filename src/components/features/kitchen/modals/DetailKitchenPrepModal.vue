<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Detail Produksi</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <!-- Production Summary - Dipindahkan ke atas -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Ringkasan Produksi</h3>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ prep.jumlah_dihasilkan }} {{ cookedItemUnit }}</div>
                <div class="text-sm text-gray-600"> Diproduksi</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">Rp {{ formatCurrency(prep.hpp_pembuatan) }}</div>
                <div class="text-sm text-gray-600">Total Biaya Produksi</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">Rp {{ formatCurrency(hppPerUnit) }}</div>
                <div class="text-sm text-gray-600">HPP per Unit</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Produksi</h3>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Item yang Diproduksi
                </label>
                <p class="text-gray-900 font-medium">{{ cookedItemName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Dihasilkan
                </label>
                <p class="text-gray-900 font-medium">{{ prep.jumlah_dihasilkan }} {{ cookedItemUnit }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Total Biaya Produksi
                </label>
                <p class="text-gray-900 font-medium">Rp {{ formatCurrency(prep.hpp_pembuatan) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  HPP Per Unit
                </label>
                <p class="text-gray-900 font-medium">Rp {{ formatCurrency(hppPerUnit) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Produksi
                </label>
                <p class="text-gray-900 font-medium">{{ formatDate(prep.date_created) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Dicatat Oleh
                </label>
                <p class="text-gray-900 font-medium">{{ prep.dicatat_oleh?.first_name || 'Unknown' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Raw Materials Used -->
        <div class="mb-8" v-if="prep.bahan_baku && prep.bahan_baku.length > 0">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Bahan Baku yang Digunakan</h3>
          <div class="space-y-4">
            <div
              v-for="material in prep.bahan_baku"
              :key="material.raw_materials_id?.id"
              class="bg-gray-50 p-4 rounded-lg"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900">{{ getRawMaterialName(material) }}</h4>
                  <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="text-gray-600">Jumlah Diambil:</span>
                      <div class="font-medium text-gray-900">{{ material.jumlah_diambil }} {{ getRawMaterialUnit(material) }}</div>
                    </div>
                    <div>
                      <span class="text-gray-600">Harga per Unit:</span>
                      <div class="font-medium text-gray-900">Rp {{ formatCurrency(getRawMaterialPrice(material)) }}</div>
                    </div>
                    <div>
                      <span class="text-gray-600">Total Biaya:</span>
                      <div class="font-medium text-blue-600">Rp {{ formatCurrency(material.jumlah_diambil * getRawMaterialPrice(material)) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer - Standarisasi dengan InventoryDetailView -->
      <div class="flex justify-start p-6 border-t border-gray-200">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  prep: {
    type: Object,
    required: true
  },
  cookedItems: {
    type: Array,
    default: () => []
  },
  rawMaterials: {
    type: Array,
    default: () => []
  },
  units: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

// Computed properties
const cookedItem = computed(() => {
  // prep.bahan_hasil_olahan sudah berupa objek lengkap dari API
  return props.prep.bahan_hasil_olahan
})

const cookedItemName = computed(() => {
  return props.prep.bahan_hasil_olahan?.name || 'Unknown Item'
})

const cookedItemUnit = computed(() => {
  const unit = props.prep.bahan_hasil_olahan?.unit
  if (!unit) return ''
  return unit.abbreviation || unit.name || ''
})

// HPP Per Unit
const hppPerUnit = computed(() => {
  // Gunakan harga_per_unit yang tersimpan di kitchen_prep
  if (props.prep.harga_per_unit) {
    return props.prep.harga_per_unit
  }
  
  // Fallback ke perhitungan manual (untuk data lama)
  if (props.prep.jumlah_dihasilkan > 0) {
    return props.prep.hpp_pembuatan / props.prep.jumlah_dihasilkan
  }
  return 0
})

// Methods
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRawMaterialName(material) {
  // Jika raw_materials_id adalah objek dengan property nama_item
  if (typeof material.raw_materials_id === 'object' && material.raw_materials_id?.nama_item) {
    return material.raw_materials_id.nama_item
  }
  
  // Jika raw_materials_id adalah ID, cari dari props.rawMaterials
  const rawMaterialId = typeof material.raw_materials_id === 'object' 
    ? material.raw_materials_id?.id 
    : material.raw_materials_id
    
  const rawMaterial = props.rawMaterials?.find(rm => rm.id === rawMaterialId)
  return rawMaterial?.nama_item || 'Unknown Material'
}

function getRawMaterialUnit(material) {
  // Jika raw_materials_id adalah objek dengan property unit
  if (typeof material.raw_materials_id === 'object' && material.raw_materials_id?.unit) {
    const unit = material.raw_materials_id.unit
    return unit.abbreviation || unit.name || ''
  }
  
  // Jika raw_materials_id adalah ID, cari dari props.rawMaterials
  const rawMaterialId = typeof material.raw_materials_id === 'object' 
    ? material.raw_materials_id?.id 
    : material.raw_materials_id
    
  const rawMaterial = props.rawMaterials?.find(rm => rm.id === rawMaterialId)
  const unit = rawMaterial?.unit
  if (!unit) return ''
  return unit.abbreviation || unit.name || ''
}

function getRawMaterialPrice(material) {
  // raw_materials_id bisa berupa ID langsung atau objek dengan property id
  const rawMaterialId = typeof material.raw_materials_id === 'object' 
    ? material.raw_materials_id?.id 
    : material.raw_materials_id
  
  const rawMaterial = props.rawMaterials?.find(rm => rm.id === rawMaterialId)
  
  if (!rawMaterial) return 0
  
  // Langkah 1: Dapatkan harga rata-rata saat ini dari bahan baku per item
  const hargaRataRata = rawMaterial.harga_rata_rata || 0
  
  // Langkah 2: Dapatkan total stok saat ini dari bahan baku per item  
  const totalStok = rawMaterial.total_stock || 0
  
  // Langkah 3: Hitung harga per unit saat ini dengan cara harga rata-rata / total stok
  if (totalStok > 0 && hargaRataRata > 0) {
    return hargaRataRata / totalStok
  }
  
  return 0
}
</script>