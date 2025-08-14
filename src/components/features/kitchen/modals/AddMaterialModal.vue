<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Tambah Bahan Baku</h2>
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
        <form @submit.prevent="handleSubmit">
          <!-- Material Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pilih Bahan Baku *
            </label>
            <select
              v-model="form.raw_materials_id"
              @change="onMaterialChange"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih bahan baku</option>
              <option 
                v-for="material in availableMaterials" 
                :key="material.id" 
                :value="material.id"
              >
                {{ material.nama_item }} (Stok: {{ material.total_stock }} {{ getMaterialUnit(material.id) }})
              </option>
            </select>
          </div>

          <!-- Material Info -->
          <div v-if="selectedMaterial" class="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Informasi Bahan</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Nama:</span>
                <div class="font-medium">{{ selectedMaterial.nama_item }}</div>
              </div>
              <div>
                <span class="text-gray-600">Kategori:</span>
                <div class="font-medium">{{ selectedMaterial.kategori?.name || '-' }}</div>
              </div>
              <div>
                <span class="text-gray-600">Stok Tersedia:</span>
                <div class="font-medium">{{ selectedMaterial.total_stock }} {{ selectedMaterialUnit }}</div>
              </div>
              <div>
                <span class="text-gray-600">Harga Pokok:</span>
                <div class="font-medium">Rp {{ formatCurrency(selectedMaterial.harga_pokok_rata_rata) }}</div>
              </div>
            </div>
          </div>

          <!-- Quantity Input -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Jumlah yang Digunakan *
            </label>
            <div class="flex">
              <input
                v-model.number="form.jumlah_digunakan"
                type="number"
                step="0.01"
                min="0"
                :max="selectedMaterial?.total_stock || 0"
                required
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{
                  'border-red-300 focus:ring-red-500 focus:border-red-500': form.jumlah_digunakan > (selectedMaterial?.total_stock || 0)
                }"
                placeholder="0.00"
              />
              <span class="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                {{ selectedMaterialUnit }}
              </span>
            </div>
            <div v-if="form.jumlah_digunakan > (selectedMaterial?.total_stock || 0)" class="mt-1 text-sm text-red-600">
              ⚠️ Jumlah melebihi stok yang tersedia
            </div>
          </div>

          <!-- Cost Calculation -->
          <div v-if="selectedMaterial && form.jumlah_digunakan > 0" class="mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Perhitungan Biaya</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Harga per Unit:</span>
                <div class="font-semibold text-blue-900">Rp {{ formatCurrency(selectedMaterial.harga_pokok_rata_rata) }}</div>
              </div>
              <div>
                <span class="text-gray-600">Jumlah:</span>
                <div class="font-semibold text-blue-900">{{ form.jumlah_digunakan }} {{ selectedMaterialUnit }}</div>
              </div>
              <div>
                <span class="text-gray-600">Total Biaya:</span>
                <div class="font-semibold text-blue-900">Rp {{ formatCurrency(totalCost) }}</div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="!canSubmit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Tambah Bahan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  rawMaterials: {
    type: Array,
    default: () => []
  },
  units: {
    type: Array,
    default: () => []
  },
  usedMaterials: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'add'])

// Form data
const form = ref({
  raw_materials_id: '',
  jumlah_digunakan: 0
})

// Computed properties
const availableMaterials = computed(() => {
  return props.rawMaterials.filter(material => 
    !props.usedMaterials.includes(material.id) && 
    material.total_stock > 0
  )
})

const selectedMaterial = computed(() => {
  return props.rawMaterials.find(material => material.id === form.value.raw_materials_id)
})

const selectedMaterialUnit = computed(() => {
  if (!selectedMaterial.value) return ''
  const unit = props.units.find(u => u.id === selectedMaterial.value.unit)
  return unit ? unit.name : ''
})

const totalCost = computed(() => {
  if (!selectedMaterial.value || !form.value.jumlah_digunakan) return 0
  return selectedMaterial.value.harga_pokok_rata_rata * form.value.jumlah_digunakan
})

const canSubmit = computed(() => {
  return form.value.raw_materials_id && 
         form.value.jumlah_digunakan > 0 &&
         form.value.jumlah_digunakan <= (selectedMaterial.value?.total_stock || 0)
})

// Methods
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID').format(amount || 0)
}

function getMaterialUnit(materialId) {
  const material = props.rawMaterials.find(m => m.id === materialId)
  if (!material) return ''
  const unit = props.units.find(u => u.id === material.unit)
  return unit ? unit.name : ''
}

function onMaterialChange() {
  // Reset quantity when material changes
  form.value.jumlah_digunakan = 0
}

function handleSubmit() {
  if (!canSubmit.value) return
  
  const materialData = {
    raw_materials_id: form.value.raw_materials_id,
    raw_material_name: selectedMaterial.value.nama_item,
    jumlah_digunakan: form.value.jumlah_digunakan,
    unit_name: selectedMaterialUnit.value,
    harga_per_unit: selectedMaterial.value.harga_pokok_rata_rata,
    total_biaya: totalCost.value
  }
  
  emit('add', materialData)
}
</script>