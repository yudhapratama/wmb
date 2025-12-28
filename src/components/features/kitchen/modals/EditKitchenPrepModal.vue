<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Edit Produksi</h2>
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
          <!-- Basic Info -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Produksi</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Cooked Item Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Item yang Diproduksi *
                </label>
                <Select
                  v-model="form.bahan_hasil_olahan"
                  :options="cookedItemOptions"
                  placeholder="Pilih item yang akan diproduksi"
                  @update:modelValue="onCookedItemChange"
                />
              </div>

              <!-- Production Quantity -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah yang Dihasilkan *
                </label>
                <div class="flex">
                  <input
                    :value="formatNumber(form.jumlah_dihasilkan)"
                    type="text"
                    inputmode="numeric"
                    class="flex-1 px-3 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    @input="handleNumericInput($event, (val) => form.jumlah_dihasilkan = val)"
                    min="0"
                    required
                    placeholder="0"
                    :disabled="!selectedCookedItemUnit"
                    :class="{'cursor-not-allowed': !selectedCookedItemUnit}"
                  />
                  <span class="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                    {{ selectedCookedItemUnit || 'pcs' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Raw Materials -->
          <div class="mb-8" v-if="requiredMaterials.length > 0">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Bahan Baku yang Dibutuhkan</h3>
            <div class="space-y-4">
              <div
                v-for="material in requiredMaterials"
                :key="material.raw_material_id"
                class="bg-gray-50 p-4 rounded-lg"
              >
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h4 class="font-medium text-gray-900">{{ material.raw_material_name }}</h4>
                    <p class="text-sm text-gray-600">Stok tersedia: {{ formatNumber(material.available_stock) }} {{ material.unit_name }}</p>
                  </div>
                  <span class="text-sm text-gray-500">{{ material.unit_name }}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah Dibutuhkan
                    </label>
                    <input
                      :value="formatNumber(material.required_quantity)"
                      type="text"
                      inputmode="numeric"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      @input="handleNumericInput($event, (val) => material.required_quantity = val)"
                      min="0"
                      required
                      readonly
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah Diambil *
                    </label>
                    <input
                      :value="formatNumber(material.jumlah_diambil)"
                      type="text"
                      inputmode="numeric"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :class="{
                        'border-red-300 focus:ring-red-500 focus:border-red-500': material.jumlah_diambil > material.available_stock
                      }"
                      @input="handleNumericInput($event, (val) => material.jumlah_diambil = val)"
                      min="0"
                      required
                      placeholder="0"
                      :max="material.available_stock"
                    />
                  </div>
                </div>
                
                <div v-if="material.jumlah_diambil > material.available_stock" class="mt-2 text-sm text-red-600">
                  ⚠️ Jumlah diambil melebihi stok yang tersedia
                </div>
              </div>
            </div>
          </div>

          <!-- HPP Calculation -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Perhitungan HPP</h3>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Total Biaya Bahan:</span>
                  <div class="font-semibold text-blue-900">{{ formatCurrency(totalMaterialCost) }}</div>
                </div>
                <div>
                  <span class="text-gray-600">Jumlah Dihasilkan:</span>
                  <div class="font-semibold text-blue-900">{{ formatNumber(form.jumlah_dihasilkan) }} {{ selectedCookedItemUnit }}</div>
                </div>
                <div>
                  <span class="text-gray-600">HPP per Unit:</span>
                  <div class="font-semibold text-blue-900">{{ formatCurrency(hppPerUnit) }}</div>
                </div>
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Select from '../../../ui/Select.vue'
import { formatCurrency, formatNumber, handleNumericInput } from '../../../../utils/helpers'
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

const emit = defineEmits(['close', 'save'])

// Form data
const form = ref({
  bahan_hasil_olahan: props.prep.bahan_hasil_olahan?.id || '', // ✅ Gunakan ID, bukan objek
  jumlah_dihasilkan: props.prep.jumlah_dihasilkan || 0,
  hpp_pembuatan: props.prep.hpp_pembuatan || 0
})

// Required materials
const requiredMaterials = ref([])

// Computed properties
const cookedItemOptions = computed(() => [
  { value: '', label: 'Pilih item yang akan diproduksi' },
  ...props.cookedItems.map(item => ({
    value: item.id,
    label: item.name
  }))
])

const selectedCookedItem = computed(() => {
  return props.cookedItems.find(item => item.id === form.value.bahan_hasil_olahan)
})

const selectedCookedItemUnit = computed(() => {
  if (!selectedCookedItem.value) return ''
  if (!selectedCookedItem.value.unit) return ''
  
  // Jika unit adalah objek, akses properti name
  if (typeof selectedCookedItem.value.unit === 'object') {
    return selectedCookedItem.value.unit.name || ''
  }
  
  // Jika unit adalah ID, cari di props.units
  const unit = props.units.find(u => u.id === selectedCookedItem.value.unit)
  return unit ? unit.name : ''
})

// Dalam computed totalMaterialCost
const totalMaterialCost = computed(() => {
  return requiredMaterials.value.reduce((total, material) => {
    // Gunakan harga_per_unit yang tersimpan atau hitung ulang
    const unitPrice = material.harga_per_unit || material.unit_price
    return total + (material.jumlah_diambil * unitPrice)
  }, 0)
})

// Dalam fungsi submit
async function handleSubmit() {
  try {
    const bahan_baku_dengan_harga = requiredMaterials.value.map(material => ({
      raw_materials_id: material.raw_materials_id,
      jumlah_diambil: material.jumlah_diambil,
      harga_per_unit: material.harga_per_unit || material.unit_price
    }))
    
    emit('save', {
      bahan_hasil_olahan: form.value.bahan_hasil_olahan,
      jumlah_dihasilkan: form.value.jumlah_dihasilkan,
      hpp_pembuatan: totalMaterialCost.value,
      harga_per_unit: hppPerUnit.value,
      bahan_baku_digunakan: bahan_baku_dengan_harga
    })
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

const hppPerUnit = computed(() => {
  if (form.value.jumlah_dihasilkan <= 0) return 0
  return totalMaterialCost.value / form.value.jumlah_dihasilkan
})

const canSubmit = computed(() => {
  return form.value.bahan_hasil_olahan && 
         form.value.jumlah_dihasilkan > 0 &&
         requiredMaterials.value.every(material => 
           material.jumlah_diambil > 0 && 
           material.jumlah_diambil <= material.available_stock
         )
})

// Methods
function onCookedItemChange() {
  if (selectedCookedItem.value) {
    loadRequiredMaterials()
  } else {
    requiredMaterials.value = []
  }
}

// Hapus fungsi onProductionQuantityChange
// function onProductionQuantityChange() {
//   if (selectedCookedItem.value && form.value.jumlah_dihasilkan > 0) {
//     calculateRequiredQuantities()
//   }
// }

function loadRequiredMaterials() {
  // Load recipe materials for the selected cooked item
  const recipe = selectedCookedItem.value.raw_material || []
  
  console.log('Loading required materials for recipe:', recipe) // Debug log
  console.log('Available raw materials:', props.rawMaterials) // Debug log
  
  requiredMaterials.value = recipe.map(recipeItem => {
    // ✅ Ambil ID dari recipeItem dengan benar
    const materialId = typeof recipeItem.raw_materials_id === 'object' 
      ? recipeItem.raw_materials_id.id 
      : recipeItem.raw_materials_id
    
    // ✅ Cari raw material berdasarkan ID
    const rawMaterial = props.rawMaterials.find(rm => rm.id === materialId)
    
    // ✅ Ambil unit dengan benar
    let unit = null
    if (rawMaterial?.unit) {
      if (typeof rawMaterial.unit === 'object') {
        unit = rawMaterial.unit
      } else {
        unit = props.units.find(u => u.id === rawMaterial.unit)
      }
    }
    
    // ✅ Hitung harga per unit dari harga_rata_rata / total_stock
    const unitPrice = rawMaterial && rawMaterial.total_stock > 0 
      ? (rawMaterial.harga_rata_rata || 0) / rawMaterial.total_stock 
      : 0
    
    const material = {
      raw_material_id: materialId,
      raw_materials_id: materialId, // ✅ Gunakan ID yang sama untuk konsistensi
      raw_material_name: rawMaterial?.nama_item || 'Unknown', // ✅ Ambil nama dari rawMaterial
      unit_name: unit?.name || unit?.abbreviation || '', // ✅ Ambil unit name dengan benar
      unit_price: unitPrice, // ✅ Gunakan harga per unit yang dihitung
      harga_per_unit: unitPrice, // ✅ Tambahkan untuk konsistensi
      available_stock: rawMaterial?.total_stock || 0, // ✅ Ambil stok dari rawMaterial
      recipe_quantity: recipeItem.jumlah_dibutuhkan || 0,
      required_quantity: recipeItem.jumlah_dibutuhkan || 0,
      jumlah_diambil: 0
    }
    
    console.log(`Created material for ${rawMaterial?.nama_item}:`, material) // Debug log
    return material
  })
  
  console.log('Final required materials:', requiredMaterials.value) // Debug log
}

// Hapus fungsi calculateRequiredQuantities
// function calculateRequiredQuantities() {
//   const productionQty = form.value.jumlah_dihasilkan || 0
//   
//   requiredMaterials.value.forEach(material => {
//     material.required_quantity = material.recipe_quantity * productionQty
//     if (material.jumlah_diambil === 0) {
//       material.jumlah_diambil = material.required_quantity
//     }
//   })
// }

// function handleSubmit() {
//   if (!canSubmit.value) return
  
//   const prepData = {
//     bahan_hasil_olahan: form.value.bahan_hasil_olahan,
//     jumlah_dihasilkan: form.value.jumlah_dihasilkan,
//     hpp_pembuatan: hppPerUnit.value,
//     bahan_baku: requiredMaterials.value.map(material => ({
//       raw_materials_id: material.raw_material_id,
//       jumlah_diambil: material.jumlah_diambil
//     }))
//   }
  
//   emit('save', prepData)
// }

// Initialize on mount
onMounted(() => {
  console.log('EditKitchenPrepModal mounted with prep:', props.prep) // Debug log
  console.log('Available props:', { 
    cookedItems: props.cookedItems.length, 
    rawMaterials: props.rawMaterials.length, 
    units: props.units.length 
  }) // Debug log
  
  if (form.value.bahan_hasil_olahan) {
    onCookedItemChange()
    
    // ✅ Load existing material quantities from prep data
    setTimeout(() => {
      // ✅ Cek berbagai kemungkinan field name
      const existingMaterials = props.prep.bahan_baku || 
                               props.prep.bahan_baku_digunakan || 
                               props.prep.bahan_baku_used || 
                               []
      
      console.log('Existing materials from prep:', existingMaterials) // Debug log
      console.log('Current required materials:', requiredMaterials.value) // Debug log
      
      if (existingMaterials.length > 0) {
        existingMaterials.forEach(existingMaterial => {
          // ✅ Handle berbagai format ID
          let materialId
          if (typeof existingMaterial.raw_materials_id === 'object') {
            materialId = existingMaterial.raw_materials_id?.id
          } else {
            materialId = existingMaterial.raw_materials_id
          }
          
          console.log(`Looking for material with ID: ${materialId}`) // Debug log
          
          const material = requiredMaterials.value.find(m => 
            m.raw_material_id === materialId || 
            m.raw_materials_id === materialId
          )
          
          if (material) {
            material.jumlah_diambil = existingMaterial.jumlah_diambil || 0
            
            // ✅ Gunakan harga_per_unit yang tersimpan jika ada
            if (existingMaterial.harga_per_unit) {
              material.harga_per_unit = existingMaterial.harga_per_unit
              material.unit_price = existingMaterial.harga_per_unit
            }
            
            console.log(`Updated material ${material.raw_material_name}:`, {
              jumlah_diambil: material.jumlah_diambil,
              harga_per_unit: material.harga_per_unit
            }) // Debug log
          } else {
            console.warn(`Material with ID ${materialId} not found in required materials`)
            console.log('Available material IDs:', requiredMaterials.value.map(m => m.raw_material_id))
          }
        })
      } else {
        console.warn('No existing materials found in prep data')
      }
    }, 500) // ✅ Increase delay to 500ms untuk memastikan data sudah ready
  } else {
    console.warn('No bahan_hasil_olahan selected')
  }
})

// Watch for changes
// Hapus watch untuk jumlah_dihasilkan
// watch(() => form.value.jumlah_dihasilkan, () => {
//   if (selectedCookedItem.value) {
//     calculateRequiredQuantities()
//   }
// })

// Tetap pertahankan watch untuk totalMaterialCost
watch(totalMaterialCost, () => {
  form.value.hpp_pembuatan = hppPerUnit.value
})
</script>