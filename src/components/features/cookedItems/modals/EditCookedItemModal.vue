<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  rawMaterials: {
    type: Array,
    default: () => []
  },
  units: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'close'])

const formData = ref({
  id: '',
  name: '',
  unit: '',
  total_stock: 0,
  harga_pokok_rata_rata: 0,
  raw_materials: []
})

// Initialize form data when item changes
watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value = {
      id: newItem.id,
      name: newItem.name || '',
      unit: typeof newItem.unit === 'object' ? newItem.unit.id : newItem.unit || '',
      total_stock: newItem.total_stock || 0,
      harga_pokok_rata_rata: newItem.harga_pokok_rata_rata || 0,
      raw_materials: newItem.raw_material ? newItem.raw_material.map(rm => ({
        raw_materials_id: typeof rm.raw_materials_id === 'object' ? rm.raw_materials_id.id : rm.raw_materials_id,
        jumlah_dibutuhkan: rm.jumlah_dibutuhkan
      })) : []
    }
  }
}, { immediate: true, deep: true })

const rawMaterialOptions = computed(() => 
  props.rawMaterials.map(material => ({
    value: material.id,
    label: material.nama_item
  }))
)

const unitOptions = computed(() => 
  props.units.map(unit => ({
    value: unit.id,
    label: unit.name
  }))
)

const isFormValid = computed(() => {
  return formData.value.name && 
         formData.value.unit &&
         formData.value.raw_materials.length > 0 &&
         formData.value.raw_materials.every(material => 
           material.raw_materials_id && material.jumlah_dibutuhkan > 0
         )
})

function addRawMaterial() {
  formData.value.raw_materials.push({
    raw_materials_id: '',
    jumlah_dibutuhkan: 0
  })
}

function removeRawMaterial(index) {
  formData.value.raw_materials.splice(index, 1)
}

function getRawMaterialUnit(rawMaterialId) {
  if (!rawMaterialId) return 'Pilih bahan baku'
  
  const material = props.rawMaterials.find(m => m.id === rawMaterialId)
  if (material && material.unit) {
    // Cek apakah unit adalah objek atau ID
    if (typeof material.unit === 'object') {
      // Jika unit adalah objek, langsung ambil abbreviation atau name
      return material.unit.abbreviation || material.unit.name || 'Unknown'
    } else {
      // Jika unit adalah ID, cari di units
      const unit = props.units.find(u => u.id === material.unit)
      return unit ? unit.abbreviation : 'Unknown'
    }
  }
  return 'Unknown'
}

// Tambahkan fungsi ini
function onRawMaterialChange(index, materialId) {
  const material = formData.value.raw_materials[index]
  material.raw_materials_id = materialId
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function handleSubmit() {
  if (isFormValid.value) {
    emit('save', { ...formData.value })
  }
}
</script>

<template>
  <Modal 
    :isOpen="true" 
    :title="item ? `Edit Bahan Siap Masak - ${item.name}` : 'Edit Bahan Siap Masak'" 
    size="3xl"
    @close="$emit('close')"
  >
    <PermissionBasedAccess collection="cooked_items" action="update">
      <div v-if="item && formData">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                Nama Bahan Siap Masak *
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="Contoh: Adonan Kue Bolu"
                class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label for="unit" class="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <Select
                v-model="formData.unit"
                :options="unitOptions"
                placeholder="Pilih Unit"
                required
              />
            </div>
            
            <div>
              <label for="total_stock" class="block text-sm font-medium text-gray-700 mb-2">
                Stok Saat Ini
              </label>
              <input
                id="total_stock"
                v-model.number="formData.total_stock"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div v-if="formData.harga_pokok_rata_rata">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Harga Pokok Rata-rata
              </label>
              <div class="px-3 py-3 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                Rp {{ formatCurrency(formData.harga_pokok_rata_rata) }}
              </div>
            </div>
          </div>
          
          <!-- Raw Materials Section -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Resep Bahan Baku</h3>
              <button
                type="button"
                @click="addRawMaterial"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Bahan
              </button>
            </div>
            
            <div v-if="formData.raw_materials.length === 0" class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>Belum ada bahan baku yang ditambahkan</p>
              <p class="text-sm">Klik "Tambah Bahan" untuk menambahkan resep</p>
            </div>
            
            <div v-else class="space-y-4">
              <div
                v-for="(material, index) in formData.raw_materials"
                :key="index"
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
                    Jumlah Dibutuhkan *
                  </label>
                  <input
                    v-model.number="material.jumlah_dibutuhkan"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
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
                  @click="removeRawMaterial(index)"
                  class="p-3 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PermissionBasedAccess>
    
    <template v-slot:fallback>
      <div class="p-6 text-center text-gray-500">
        Anda tidak memiliki akses untuk mengedit bahan siap masak ini.
      </div>
    </template>
    
    <template #footer>
      <PermissionBasedAccess collection="cooked_items" action="update">
        <div class="flex gap-2 w-full">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
            :disabled="isLoading || !isFormValid"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Simpan Perubahan
          </button>
        </div>
      </PermissionBasedAccess>
    </template>
  </Modal>
</template>