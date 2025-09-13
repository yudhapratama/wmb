<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Buat Produksi Baru</h2>
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
          <!-- Step A: Input Utama -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Langkah A: Input Utama</h3>
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
                    v-model.number="form.jumlah_dihasilkan"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="flex-1 px-3 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  >
                  <div class="px-3 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
                    {{ selectedCookedItemUnit }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step B: Resep Bahan Baku -->
          <div v-if="form.bahan_hasil_olahan" class="mb-8">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Langkah B: Resep Bahan Baku</h3>
              <!-- <button
                type="button"
                @click="addRawMaterial"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Bahan
              </button> -->
            </div>
            
            <div v-if="isLoadingRecipe" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            
            <div v-else-if="form.bahan_baku_digunakan.length === 0" class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>Belum ada bahan baku yang ditambahkan</p>
              <p class="text-sm">Item yang dipilih belum memiliki resep atau klik "Tambah Bahan" untuk menambahkan manual</p>
            </div>
            
            <div v-else class="space-y-4">
              <div
                v-for="(material, index) in form.bahan_baku_digunakan"
                :key="material.raw_materials_id"
                class="flex items-end gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Bahan Baku *
                  </label>
                  <Select
                    :model-value="material.raw_materials_id"
                    @update:model-value="(value) => onRawMaterialChange(index, value)"
                    :options="rawMaterialOptions"
                    placeholder="Pilih Bahan Baku"
                    required
                  />
                </div>
                
                <div class="flex-1">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Diambil *
                  </label>
                  <input
                    v-model.number="material.jumlah_diambil"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div class="w-20">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <div class="px-3 py-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                    {{ getRawMaterialUnit(material.raw_materials_id) }}
                  </div>
                </div>
                
                <button
                  type="button"
                  @click="removeMaterial(index)"
                  class="p-3 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- HPP Calculation -->
          <div v-if="form.bahan_hasil_olahan && form.bahan_baku_digunakan.length > 0" class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Perhitungan HPP</h3>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Total Biaya Bahan:</span>
                  <div class="font-semibold text-blue-900">Rp {{ formatCurrency(totalMaterialCost) }}</div>
                </div>
                <div>
                  <span class="text-gray-600">Jumlah Dihasilkan:</span>
                  <div class="font-semibold text-blue-900">{{ form.jumlah_dihasilkan }} {{ selectedCookedItemUnit }}</div>
                </div>
                <div>
                  <span class="text-gray-600">HPP per Unit:</span>
                  <div class="font-semibold text-blue-900">Rp {{ formatCurrency(hppPerUnit) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="!canSubmit || isSubmitting"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
            >
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan Produksi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useKitchen } from '../../../../composables/useKitchen'
import AddMaterialModal from './AddMaterialModal.vue'
import Select from '../../../ui/Select.vue'

// Props
const props = defineProps({
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

// Emits
const emit = defineEmits(['close', 'save'])

// Kitchen composable
const { getCookedItemRecipe, calculateRequiredMaterials } = useKitchen()

// State
const isLoadingRecipe = ref(false)
const isSubmitting = ref(false)
const showAddMaterialModal = ref(false)

// Form data
const form = ref({
  bahan_hasil_olahan: '',
  jumlah_dihasilkan: 0,
  bahan_baku_digunakan: []
})

// Computed properties
const cookedItemOptions = computed(() => [
  { value: '', label: 'Pilih item yang akan diproduksi' },
  ...props.cookedItems.map(item => ({
    value: item.id,
    label: item.name
  }))
])

const rawMaterialOptions = computed(() => 
  props.rawMaterials.map(material => ({
    value: material.id,
    label: material.nama_item
  }))
)

const selectedCookedItem = computed(() => {
  return props.cookedItems.find(item => item.id === form.value.bahan_hasil_olahan)
})

const selectedCookedItemUnit = computed(() => {
  if (!selectedCookedItem.value?.unit) return ''
  return selectedCookedItem.value.unit.abbreviation || selectedCookedItem.value.unit.name || ''
})

const canSubmit = computed(() => {
  return form.value.bahan_hasil_olahan && 
         form.value.jumlah_dihasilkan > 0 && 
         form.value.bahan_baku_digunakan.length > 0 &&
         form.value.bahan_baku_digunakan.every(material => material.jumlah_diambil > 0)
})

// Watch for cooked item changes only
watch(() => form.value.bahan_hasil_olahan, async (newValue) => {
  if (newValue) {
    await loadRecipeAndCalculate()
  } else {
    form.value.bahan_baku_digunakan = []
  }
})

// Hapus watch untuk jumlah_dihasilkan
// Methods
async function onCookedItemChange() {
  if (form.value.bahan_hasil_olahan) {
    await loadRecipeAndCalculate()
  }
}

// Hapus fungsi onProductionQuantityChange
// async function onProductionQuantityChange() {
//   if (form.value.bahan_hasil_olahan && form.value.jumlah_dihasilkan > 0) {
//     await loadRecipeAndCalculate()
//   }
// }

async function loadRecipeAndCalculate() {
  if (!form.value.bahan_hasil_olahan) {
    return
  }

  isLoadingRecipe.value = true
  try {
    const recipe = await getCookedItemRecipe(form.value.bahan_hasil_olahan)
    // console.log('Recipe data:', recipe) // Debug log
    
    // Recipe adalah objek dengan property raw_material yang berisi array
    if (recipe && Array.isArray(recipe.raw_material)) {
      // console.log('Raw materials from recipe:', recipe.raw_material) // Debug log
      
      form.value.bahan_baku_digunakan = recipe.raw_material.map(material => {
        // console.log('Processing material:', material) // Debug log
        
        // Perbaikan: ambil ID dari objek raw_materials_id
        let materialId = null
        if (material.raw_materials_id && typeof material.raw_materials_id === 'object') {
          // Jika raw_materials_id adalah objek, ambil property id-nya
          materialId = material.raw_materials_id.id
        } else if (material.raw_materials_id) {
          // Jika raw_materials_id sudah berupa ID langsung
          materialId = material.raw_materials_id
        } else if (material.raw_materials) {
          // Fallback untuk struktur lain
          materialId = material.raw_materials.id || material.raw_materials
        } else if (material.id) {
          // Fallback terakhir
          materialId = material.id
        }
        
        // console.log('Material ID extracted:', materialId) // Debug log
        
        return {
          raw_materials_id: materialId,
          jumlah_diambil: material.jumlah_dibutuhkan || 0
        }
      })
      
      // console.log('Final bahan_baku_digunakan:', form.value.bahan_baku_digunakan) // Debug log
    } else {
      // Jika recipe.raw_material bukan array, set sebagai array kosong
      // console.warn('Recipe raw_material is not an array:', recipe)
      form.value.bahan_baku_digunakan = []
    }
  } catch (error) {
    console.error('Error loading recipe:', error)
    form.value.bahan_baku_digunakan = []
  } finally {
    isLoadingRecipe.value = false
  }
}

function getRawMaterialName(id) {
  const material = props.rawMaterials.find(m => m.id === id)
  return material?.nama_item || 'Unknown'
}

function getRawMaterialUnit(id) {
  const material = props.rawMaterials.find(m => m.id === id)
  if (!material?.unit) return ''
  return material.unit.abbreviation || material.unit.name || ''
}

function removeMaterial(index) {
  form.value.bahan_baku_digunakan.splice(index, 1)
}

// Computed properties untuk HPP calculation
const totalMaterialCost = computed(() => {
  return form.value.bahan_baku_digunakan.reduce((total, material) => {
    const rawMaterial = props.rawMaterials.find(m => m.id === material.raw_materials_id)
    if (rawMaterial && material.jumlah_diambil > 0) {
      // HPP Bahan = harga rata-rata saat ini / jumlah stok saat ini
      const unitPrice = rawMaterial.total_stock > 0 
        ? (rawMaterial.harga_rata_rata || 0) / rawMaterial.total_stock 
        : 0
      return total + (material.jumlah_diambil * unitPrice)
    }
    return total
  }, 0)
})

const hppPerUnit = computed(() => {
  if (form.value.jumlah_dihasilkan <= 0) return 0
  return totalMaterialCost.value / form.value.jumlah_dihasilkan
})

async function handleSubmit() {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    // Hitung harga per unit untuk setiap bahan baku
    const bahan_baku_dengan_harga = form.value.bahan_baku_digunakan.map(material => {
      const rawMaterial = props.rawMaterials.find(m => m.id === material.raw_materials_id)
      const unitPrice = rawMaterial && rawMaterial.total_stock > 0 
        ? (rawMaterial.harga_rata_rata || 0) / rawMaterial.total_stock 
        : 0
      
      return {
        ...material,
        harga_per_unit: unitPrice
      }
    })
    
    emit('save', {
      bahan_hasil_olahan: form.value.bahan_hasil_olahan,
      jumlah_dihasilkan: form.value.jumlah_dihasilkan,
      hpp_pembuatan: totalMaterialCost.value,
      harga_per_unit: hppPerUnit.value, // ✅ HPP per unit hasil jadi
      bahan_baku_digunakan: bahan_baku_dengan_harga
    })
  } catch (error) {
    console.error('Error submitting form:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Fungsi untuk menangani perubahan bahan baku
function onRawMaterialChange(index, materialId) {
  const material = form.value.bahan_baku_digunakan[index]
  material.raw_materials_id = materialId
}
function addRawMaterial() {
  form.value.bahan_baku_digunakan.push({
    raw_materials_id: '',
    jumlah_diambil: 0
  })
}
// Fungsi untuk format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0)
}
</script>