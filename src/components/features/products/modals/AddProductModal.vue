<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  },
  suppliers: {
    type: Array,
    default: () => []
  },
  // Tambahkan props cookedItems untuk recipe-based products
  cookedItems: {
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

const emit = defineEmits(['close', 'submit'])

// Di bagian formData (sekitar baris 35)
const formData = ref({
  nama_produk: '',
  kategori: null, // ← Ubah dari '' ke null
  harga_jual: 0,
  deskripsi: '',
  tipe_produk: 'basic',
  harga_pokok: 0,
  total_harga_bahan: 0,
  konsinyasi: false,
  supplier_konsinyasi: null, // ← Ubah dari '' ke null
  recipe_items: [] // Ubah struktur untuk menggunakan cooked_items_id
})

const errors = ref({})

// Computed options
const categoryOptions = computed(() => [
  { value: '', label: 'Pilih kategori' },
  ...props.categories.map(category => ({
    value: category.id,
    label: category.name
  }))
])

const supplierOptions = computed(() => [
  { value: '', label: 'Pilih supplier' },
  ...props.suppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.nama_supplier
  }))
])

// Di bagian computed options (sekitar baris 65), hapus rawMaterialOptions:
// const rawMaterialOptions = computed(() => 
//   props.rawMaterials.map(material => ({
//     value: material.id,
//     label: material.nama_item
//   }))
// )

const unitOptions = computed(() => 
  props.units.map(unit => ({
    value: unit.id,
    label: unit.name
  }))
)

const productTypeOptions = [
  { value: 'basic', label: 'Basic Product' },
  { value: 'recipe', label: 'Recipe-based Product' }
]

// Ubah computed options untuk cooked items
const cookedItemOptions = computed(() => 
  props.cookedItems.map(item => ({
    value: item.id,
    label: item.name
  }))
)

const isFormValid = computed(() => {
  const basicValid = formData.value.nama_produk && 
                    formData.value.kategori &&
                    formData.value.harga_jual > 0
  
  if (formData.value.tipe_produk === 'basic') {
    return basicValid && formData.value.harga_pokok > 0
  } else {
    return basicValid && 
           formData.value.recipe_items.length > 0 &&
           formData.value.recipe_items.every(item => 
             item.cooked_items_id && item.jumlah_dibutuhkan > 0
           )
  }
})

// Watch untuk menghitung total harga bahan pada recipe-based product
watch(
  () => formData.value.recipe_items,
  (newItems) => {
    if (formData.value.tipe_produk === 'recipe') {
      formData.value.total_harga_bahan = newItems.reduce((total, item) => {
        const cookedItem = props.cookedItems.find(c => c.id === item.cooked_items_id)
        if (cookedItem && item.jumlah_dibutuhkan) {
          // Gunakan harga_pokok_per_unit instead of harga_pokok_rata_rata
          return total + (cookedItem.harga_pokok_per_unit * item.jumlah_dibutuhkan)
        }
        return total
      }, 0)
    }
  },
  { deep: true }
)

// Watch untuk reset form ketika tipe produk berubah
watch(
  () => formData.value.tipe_produk,
  (newType) => {
    if (newType === 'basic') {
      formData.value.recipe_items = []
      formData.value.total_harga_bahan = 0
    } else {
      formData.value.harga_pokok = 0
    }
  }
)

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

function resetForm() {
  formData.value = {
    nama_produk: '',
    kategori: '',
    harga_jual: 0,
    tipe_produk: 'basic',
    harga_pokok: 0,
    total_harga_bahan: 0,
    konsinyasi: false,
    supplier_konsinyasi: '',
    recipe_items: []
  }
  errors.value = {}
}

function addRecipeItem() {
  formData.value.recipe_items.push({
    cooked_items_id: '',
    jumlah_dibutuhkan: 0
  })
}

function removeRecipeItem(index) {
  formData.value.recipe_items.splice(index, 1)
}

function getCookedItemUnit(cookedItemId) {
  if (!cookedItemId) return 'Pilih bahan setengah jadi'
  
  const cookedItem = props.cookedItems.find(c => c.id === cookedItemId)
  if (cookedItem && cookedItem.unit) {
    if (typeof cookedItem.unit === 'object') {
      return cookedItem.unit.abbreviation || cookedItem.unit.name || 'Unknown'
    } else {
      const unit = props.units.find(u => u.id === cookedItem.unit)
      return unit ? unit.abbreviation : 'Unknown'
    }
  }
  return 'Unknown'
}

function getCookedItemPrice(cookedItemId) {
  const cookedItem = props.cookedItems.find(c => c.id === cookedItemId)
  // Gunakan harga_pokok_per_unit instead of harga_pokok_rata_rata
  return cookedItem ? cookedItem.harga_pokok_per_unit : 0
}

function calculateItemCost(item) {
  const price = getCookedItemPrice(item.cooked_items_id)
  return price * (item.jumlah_dibutuhkan || 0)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID').format(amount || 0)
}

function calculateMargin() {
  const hargaJual = formData.value.harga_jual
  const hargaPokok = formData.value.tipe_produk === 'basic' 
    ? formData.value.harga_pokok 
    : formData.value.total_harga_bahan
  
  if (!hargaJual || !hargaPokok) return 0
  return Math.round(((hargaJual - hargaPokok) / hargaJual) * 100)
}

function handleSubmit() {
  if (!isFormValid.value) return
  
  // Validate form
  errors.value = {}
  
  if (!formData.value.nama_produk) {
    errors.value.nama_produk = 'Nama produk harus diisi'
  }
  
  if (!formData.value.kategori) {
    errors.value.kategori = 'Kategori harus dipilih'
  }
  
  if (formData.value.harga_jual <= 0) {
    errors.value.harga_jual = 'Harga jual harus lebih dari 0'
  }
  
  if (formData.value.tipe_produk === 'basic' && formData.value.harga_pokok <= 0) {
    errors.value.harga_pokok = 'Harga pokok harus lebih dari 0'
  }
  
  if (formData.value.tipe_produk === 'recipe') {
    if (formData.value.recipe_items.length === 0) {
      errors.value.recipe_items = 'Minimal harus ada 1 bahan setengah jadi'
    } else {
      const invalidItems = formData.value.recipe_items.some(item => 
        !item.cooked_items_id || item.jumlah_dibutuhkan <= 0
      )
      if (invalidItems) {
        errors.value.recipe_items = 'Semua bahan setengah jadi harus dipilih dan jumlah harus lebih dari 0'
      }
    }
  }
  
  if (formData.value.konsinyasi && !formData.value.supplier_konsinyasi) {
    errors.value.supplier_konsinyasi = 'Supplier konsinyasi harus dipilih'
  }
  
  if (Object.keys(errors.value).length > 0) {
    return
  }
  
  // Prepare data untuk submit dengan proper null handling
  const submitData = {
    ...formData.value,
    // Convert empty string atau falsy values ke null untuk integer fields
    kategori: formData.value.kategori || null,
    supplier_konsinyasi: (formData.value.konsinyasi && formData.value.supplier_konsinyasi) 
      ? parseInt(formData.value.supplier_konsinyasi) 
      : null,
    // Pastikan numeric fields adalah number
    harga_jual: parseFloat(formData.value.harga_jual) || 0,
    harga_pokok: parseFloat(formData.value.harga_pokok) || 0,
    total_harga_bahan: parseFloat(formData.value.total_harga_bahan) || 0
  }
  
  emit('submit', submitData)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Tambah Produk Baru" 
    size="3xl"
    @close="emit('close')"
  >
    <PermissionBasedAccess collection="products" action="create">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Nama Produk -->
          <div>
            <label for="nama_produk" class="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk *
            </label>
            <input
              id="nama_produk"
              v-model="formData.nama_produk"
              type="text"
              placeholder="Masukkan nama produk"
              class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-red-500': errors.nama_produk }"
              required
            />
            <p v-if="errors.nama_produk" class="mt-1 text-sm text-red-600">{{ errors.nama_produk }}</p>
          </div>

          <!-- Kategori -->
          <div>
            <label for="kategori" class="block text-sm font-medium text-gray-700 mb-2">
              Kategori *
            </label>
            <!-- Select Kategori -->
            <select
              v-model="formData.kategori"
              class="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.kategori }"
              required
            >
              <option :value="null">Pilih Kategori</option> <!-- ← Ubah dari '' ke null -->
              <option 
                v-for="category in categoryOptions" 
                :key="category.value" 
                :value="category.value"
              >
                {{ category.label }}
              </option>
            </select>
            
            <p v-if="errors.kategori" class="mt-1 text-sm text-red-600">{{ errors.kategori }}</p>
          </div>
        </div>

        <!-- Tipe Produk -->
        <div>
          <label for="tipe_produk" class="block text-sm font-medium text-gray-700 mb-2">
            Tipe Produk *
          </label>
          <Select
            v-model="formData.tipe_produk"
            :options="productTypeOptions"
            placeholder="Pilih tipe produk"
            required
          />
        </div>

        <!-- Harga Jual -->
        <div>
          <label for="harga_jual" class="block text-sm font-medium text-gray-700 mb-2">
            Harga Jual *
          </label>
          <input
            id="harga_jual"
            v-model.number="formData.harga_jual"
            type="number"
            min="0"
            step="100"
            placeholder="0"
            class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-500': errors.harga_jual }"
            required
          />
          <p v-if="errors.harga_jual" class="mt-1 text-sm text-red-600">{{ errors.harga_jual }}</p>
        </div>

        <!-- Basic Product Fields -->
        <div v-if="formData.tipe_produk === 'basic'">
          <label for="harga_pokok" class="block text-sm font-medium text-gray-700 mb-2">
            Harga Pokok *
          </label>
          <input
            id="harga_pokok"
            v-model.number="formData.harga_pokok"
            type="number"
            min="0"
            step="100"
            placeholder="0"
            class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-500': errors.harga_pokok }"
            required
          />
          <p v-if="errors.harga_pokok" class="mt-1 text-sm text-red-600">{{ errors.harga_pokok }}</p>
  `        <!-- Konsinyasi -->
          <div class="space-y-4">
            <div class="flex items-center">
              <input
                v-model="formData.konsinyasi"
                type="checkbox"
                id="konsinyasi"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="konsinyasi" class="ml-2 block text-sm text-gray-700">
                Produk Konsinyasi
              </label>
            </div>
            
            <div v-if="formData.konsinyasi">
              <label for="supplier_konsinyasi" class="block text-sm font-medium text-gray-700 mb-2">
                Supplier Konsinyasi *
              </label>
              <Select
                v-model="formData.supplier_konsinyasi"
                :options="supplierOptions"
                placeholder="Pilih supplier konsinyasi"
                :class="{ 'border-red-500': errors.supplier_konsinyasi }"
                required
              />
              <p v-if="errors.supplier_konsinyasi" class="mt-1 text-sm text-red-600">{{ errors.supplier_konsinyasi }}</p>
            </div>
          </div>          
        </div>

        <!-- Recipe-based Product Fields -->
        <div v-if="formData.tipe_produk === 'recipe'">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Resep Bahan Setengah Jadi</h3>
            <button
              type="button"
              @click="addRecipeItem"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Bahan
            </button>
          </div>
          
          <div v-if="formData.recipe_items.length === 0" class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>Belum ada bahan setengah jadi yang ditambahkan</p>
            <p class="text-sm">Klik "Tambah Bahan" untuk menambahkan resep</p>
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in formData.recipe_items"
              :key="index"
              class="flex items-end gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Bahan Setengah Jadi *
                </label>
                <Select
                  v-model="item.cooked_items_id"
                  :options="cookedItemOptions"
                  placeholder="Pilih Bahan Setengah Jadi"
                  required
                />
              </div>
              
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Dibutuhkan *
                </label>
                <input
                  v-model.number="item.jumlah_dibutuhkan"
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
                  {{ getCookedItemUnit(item.cooked_items_id) }}
                </div>
              </div>
              
              <div class="w-32">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Biaya
                </label>
                <div class="px-3 py-3 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600">
                  Rp {{ formatCurrency(calculateItemCost(item)) }}
                </div>
              </div>
              
              <button
                type="button"
                @click="removeRecipeItem(index)"
                class="p-3 text-red-600 hover:text-red-800 focus:outline-none"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <!-- Total Harga Bahan -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="font-medium text-gray-700">Total Harga Bahan:</span>
                <span class="text-lg font-bold text-blue-600">Rp {{ formatCurrency(formData.total_harga_bahan) }}</span>
              </div>
            </div>
          </div>
          
          <p v-if="errors.recipe_items" class="mt-1 text-sm text-red-600">{{ errors.recipe_items }}</p>
        </div>

        <!-- Margin Calculation -->
        <div v-if="formData.harga_jual > 0 && ((formData.tipe_produk === 'basic' && formData.harga_pokok > 0) || (formData.tipe_produk === 'recipe' && formData.total_harga_bahan > 0))" class="bg-green-50 p-4 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-medium text-gray-700">Margin Keuntungan:</span>
            <span class="text-lg font-bold" :class="calculateMargin() > 0 ? 'text-green-600' : 'text-red-600'">
              {{ calculateMargin() }}%
            </span>
          </div>
        </div>
      </form>
    </PermissionBasedAccess>
    
    <template v-slot:fallback>
      <div class="p-6 text-center text-gray-500">
        Anda tidak memiliki akses untuk menambah produk.
      </div>
    </template>
    
    <template #footer>
      <PermissionBasedAccess collection="products" action="create">
        <div class="flex gap-2 w-full">
          <button
            @click="emit('close')"
            class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
            :disabled="isLoading || !isFormValid"
          >
            <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ isLoading ? 'Menyimpan...' : 'Simpan Produk' }}</span>
          </button>
        </div>
      </PermissionBasedAccess>
    </template>
  </Modal>
</template>