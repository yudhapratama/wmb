<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'
import { useProductCategories } from '../../../../composables/useProductCategories'
import { useSuppliers } from '../../../../composables/useSuppliers'
import { useCookedItems } from '../../../../composables/useCookedItems'
import { formatCurrency, formatNumber, handleNumericInput } from '../../../../utils/helpers'
import { useFileUpload } from '../../../../composables/useFileUpload'
import { getAllowedFileTypes } from '../../../../utils/fileUtils'
const props = defineProps({
  product: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'close'])

// Composables
const { categories: productCategories, loadData: loadCategoriesData } = useProductCategories()
const { suppliers, loadData: loadSuppliersData } = useSuppliers()
const { cookedItems, units, loadData: loadCookedItemsData } = useCookedItems()

// Form data
const formData = ref({
  id: '',
  nama_produk: '',
  kategori: '',
  harga_jual: 0,
  deskripsi: '',
  tipe_produk: 'basic',
  harga_pokok: 0,
  total_harga_bahan: 0,
  konsinyasi: false,
  supplier_konsinyasi: '',
  recipe_items: [],
  image: null
})

// Tambahkan watcher untuk cookedItems
watch(() => cookedItems.value, (newCookedItems) => {
  if (newCookedItems.length > 0 && formData.value.recipe_items.length > 0) {
    // Update unit untuk setiap recipe item yang sudah ada
    formData.value.recipe_items.forEach(item => {
      const cookedItem = newCookedItems.find(c => c.id === item.cooked_items_id)
      if (cookedItem && cookedItem.unit) {
        item.unit = cookedItem.unit
      }
    })
  }
}, { deep: true })

watch(() => props.product, (newProduct) => {
  if (newProduct && typeof newProduct === 'object' && newProduct !== null && 'id' in newProduct && newProduct.id) {
    formData.value = {
      id: newProduct.id,
      nama_produk: newProduct.nama_produk || '',
      kategori: typeof newProduct.kategori === 'object' && newProduct.kategori !== null ? newProduct.kategori.id : newProduct.kategori || '',
      harga_jual: newProduct.harga_jual || 0,
      deskripsi: newProduct.deskripsi || '',
      tipe_produk: newProduct.tipe_produk || 'basic',
      harga_pokok: newProduct.harga_pokok || 0,
      total_harga_bahan: newProduct.total_harga_bahan || 0,
      konsinyasi: newProduct.konsinyasi || false,
      supplier_konsinyasi: typeof newProduct.supplier_konsinyasi === 'object' && newProduct.supplier_konsinyasi !== null ? newProduct.supplier_konsinyasi.id : newProduct.supplier_konsinyasi || '',
      recipe_items: Array.isArray(newProduct.recipe_items) ? newProduct.recipe_items.map(item => {
        // Jika cooked_items_id sudah berupa objek, ambil ID-nya
        let cookedItemId = item.cooked_items_id
        if (typeof cookedItemId === 'object' && cookedItemId !== null) {
          cookedItemId = cookedItemId.id
        }
        
        // Cari unit dari cookedItems - pastikan cookedItems sudah dimuat
        const cookedItem = cookedItems.value.find(c => c.id === cookedItemId)
        
        return {
          cooked_items_id: cookedItemId,
          quantity: item.quantity || 0,
          unit: cookedItem?.unit || item.unit || 'pcs'
        }
      }) : [],
      image: newProduct.image || null
    }
    
    // Update unit untuk setiap recipe item setelah cookedItems dimuat
    if (cookedItems.value.length > 0) {
      formData.value.recipe_items.forEach(item => {
        const cookedItem = cookedItems.value.find(c => c.id === item.cooked_items_id)
        if (cookedItem && cookedItem.unit) {
          item.unit = cookedItem.unit
        }
      })
    }
  } else {
    // Reset form jika product null atau tidak valid
    formData.value = {
      id: '',
      nama_produk: '',
      kategori: '',
      harga_jual: 0,
      deskripsi: '',
      tipe_produk: 'basic',
      harga_pokok: 0,
      total_harga_bahan: 0,
      konsinyasi: false,
      supplier_konsinyasi: '',
      recipe_items: [],
      image: null
    }
  }
}, { immediate: true, deep: true })

// Computed properties
const categoryOptions = computed(() => [
  { value: '', label: 'Pilih Kategori' },
  ...productCategories.value.map(category => ({
    value: category.id,
    label: category.name
  }))
])

// Perbaiki computed supplierOptions (sekitar baris 92-97)
const supplierOptions = computed(() => [
  { value: '', label: 'Pilih Supplier' },
  ...suppliers.value.map(supplier => ({
    value: supplier.id,
    label: supplier.nama_supplier || supplier.nama_pt_toko || 'Supplier Tanpa Nama'
  }))
])

const cookedItemOptions = computed(() => 
  cookedItems.value.map(item => ({
    value: item.id,
    label: item.name,
    unit: item.unit || 'pcs',
    harga_pokok_per_unit: item.harga_pokok_per_unit || 0
  }))
)

// Tambahkan computed property yang hilang
const isRecipeBased = computed(() => {
  return formData.value.tipe_produk === 'recipe'
})
const handleImageChange = async (event) => {
  await handleFileSelect(event)
}

function removeImage() {
  removeFile(0)
  formData.value.image = null
}
// Use enhanced file upload composable
const { 
  files, 
  previews, 
  errors: fileErrors, 
  isUploading, 
  uploadFiles, 
  handleFileSelect, 
  removeFile,
  clearFiles,
  getFileUrl // Extract getFileUrl from useFileUpload
} = useFileUpload({
  multiple: false,
  autoUpload: false,
  featureName: 'Expenses',
  dataId: null
})

const calculatedTotalHargaBahan = computed(() => {
  if (!isRecipeBased.value) return 0
  
  return formData.value.recipe_items.reduce((total, item) => {
    const cookedItem = cookedItems.value.find(c => c.id === item.cooked_items_id)
    const unitPrice = cookedItem?.harga_pokok_per_unit || 0
    return total + (item.quantity * unitPrice)
  }, 0)
})

const marginKeuntungan = computed(() => {
  const hargaPokok = isRecipeBased.value ? calculatedTotalHargaBahan.value : formData.value.harga_pokok
  if (hargaPokok === 0) return 0
  return ((formData.value.harga_jual - hargaPokok) / formData.value.harga_jual * 100)
})

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
             item.cooked_items_id && item.quantity > 0  // Perbaiki dari raw_material_id ke cooked_items_id dan jumlah_dibutuhkan ke quantity
           )
  }
})

// Methods
function addRecipeItem() {
  formData.value.recipe_items.push({
    cooked_items_id: '',
    quantity: 0,
    unit: ''
  })
}

function onCookedItemChange(index) {
  const item = formData.value.recipe_items[index]
  const cookedItem = cookedItems.value.find(c => c.id === item.cooked_items_id)
  if (cookedItem) {
    item.unit = cookedItem.unit || 'pcs'
    // Force reactivity update
    formData.value.recipe_items[index] = { ...item }
  }
}

function getCookedItemName(cookedItemId) {
  // Jika cookedItemId sudah berupa objek
  if (typeof cookedItemId === 'object' && cookedItemId?.name) {
    return cookedItemId.name
  }
  
  // Jika cookedItemId masih berupa ID
  const item = cookedItems.value.find(c => c.id === cookedItemId)
  return item ? item.name : 'Bahan tidak ditemukan'
}

function getCookedItemUnit(cookedItemId) {
  // Jika cookedItemId sudah berupa objek
  if (typeof cookedItemId === 'object' && cookedItemId?.unit) {
    return cookedItemId.unit || 'pcs'
  }
  
  // Jika cookedItemId masih berupa ID
  const item = cookedItems.value.find(c => c.id === cookedItemId)
  return item ? (item.unit || 'pcs') : 'pcs'
}

// Tambahkan fungsi yang hilang setelah fungsi onCookedItemChange
function removeRecipeItem(index) {
  formData.value.recipe_items.splice(index, 1)
}

function onTipeProductChange() {
  if (formData.value.tipe_produk === 'basic') {
    formData.value.recipe_items = []
    formData.value.total_harga_bahan = 0
  } else {
    formData.value.harga_pokok = 0
  }
}

// Tambahkan fungsi handleSubmit yang hilang
async function handleSubmit() {
  if (!isFormValid.value) {
    return
  }

  let image = formData.value.image
    
  // Upload new file if selected
  if (files.value.length > 0) {
    const uploadedIds = await uploadFiles(props.product.id)
    image = uploadedIds[0] || image
  }
  
  // Siapkan data untuk dikirim - buat plain object untuk menghindari DataCloneError
  const submitData = {
    id: formData.value.id,
    nama_produk: formData.value.nama_produk,
    kategori: formData.value.kategori || null, // Konversi string kosong ke null
    harga_jual: formData.value.harga_jual,
    deskripsi: formData.value.deskripsi,
    tipe_produk: formData.value.tipe_produk,
    harga_pokok: isRecipeBased.value ? calculatedTotalHargaBahan.value : formData.value.harga_pokok,
    total_harga_bahan: isRecipeBased.value ? calculatedTotalHargaBahan.value : 0,
    konsinyasi: formData.value.konsinyasi,
    supplier_konsinyasi: formData.value.supplier_konsinyasi || null, // Konversi string kosong ke null
    // Buat plain array untuk recipe_items
    recipe_items: formData.value.recipe_items.map(item => ({
      cooked_items_id: item.cooked_items_id,
      quantity: item.quantity,
      unit: typeof item.unit === 'object' ? item.unit.id : item.unit
    })),
    image
  }
  
  // Emit save event dengan data produk
  emit('save', submitData)
}

// Load data on mount
onMounted(async () => {
  try {
    await Promise.all([
      loadCategoriesData(),
      loadSuppliersData(),
      loadCookedItemsData()
    ])
    console.log('Cooked items loaded:', cookedItems.value)
  } catch (error) {
    console.error('Error loading data:', error)
  }
})
</script>

<template>
  <Modal 
    :isOpen="true" 
    :title="product ? `Edit Produk - ${product.nama_produk}` : 'Edit Produk'" 
    size="3xl"
    @close="$emit('close')"
  >
    <PermissionBasedAccess collection="products" action="update">
      <div v-if="product && formData">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Basic Product Information -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Dasar Produk</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="nama_produk" class="block text-sm font-medium text-gray-700 mb-2">
                  Nama Produk *
                </label>
                <input
                  id="nama_produk"
                  v-model="formData.nama_produk"
                  type="text"
                  placeholder="Contoh: Nasi Goreng Spesial"
                  class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label for="kategori" class="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <Select
                  v-model="formData.kategori"
                  :options="categoryOptions"
                  placeholder="Pilih Kategori"
                  required
                />
              </div>
              
              <div>
                <label for="tipe_produk" class="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Produk *
                </label>
                <select
                  id="tipe_produk"
                  v-model="formData.tipe_produk"
                  @change="onTipeProductChange"
                  class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="basic">Basic Product</option>
                  <option value="recipe">Recipe-based Product</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  {{ isRecipeBased ? 'Produk dengan resep bahan baku' : 'Produk dengan harga pokok tetap' }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Gambar Produk</label>
                <div class="flex items-start gap-4 flex-col">
                  <button
                    type="button"
                    @click="$refs.fileInput.click()"
                    :disabled="formData.image || previews.length"
                    class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ambil Foto
                  </button>
                  <input
                    ref="fileInput"
                    type="file"
                    :accept="getAllowedFileTypes()"
                    @change="handleImageChange"
                    class="hidden"
                  />
                  <!-- Show new uploaded image preview -->
                  <img
                    v-if="previews && previews[0]"
                    :src="previews[0].preview"
                    alt="Payment proof preview"
                    class="w-40 h-40 object-cover rounded border"
                  />
                  <!-- Show existing image if no new upload -->
                  <img
                    v-else-if="formData.image && !previews.length"
                    :src="getFileUrl(formData.image)"
                    alt="Payment proof preview"
                    class="w-40 h-40 object-cover rounded border"
                  />
                  <button
                    v-if="(previews && previews[0]) || formData.image"
                    type="button"
                    @click="removeImage"
                    class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              
              <div>
                <label for="harga_jual" class="block text-sm font-medium text-gray-700 mb-2">
                  Harga Jual *
                </label>
                <input
                  id="harga_jual"
                  :value="formatNumber(formData.harga_jual)"
                  type="text"
                  inputmode="numeric"
                  class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  @input="handleNumericInput($event, (val) => formData.harga_jual = val)"
                  min="0"
                  required
                  placeholder="25000"
                />
              </div>
            </div>
          </div>

          <!-- Cost Information -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ isRecipeBased ? 'Resep Produk' : 'Informasi Harga Pokok' }}
            </h3>
            
            <!-- Basic Product Cost -->
            <div v-if="!isRecipeBased">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="harga_pokok" class="block text-sm font-medium text-gray-700 mb-2">
                    Harga Pokok Produksi *
                  </label>
                  <input
                    id="harga_pokok"
                    :value="formatNumber(formData.harga_pokok)"
                    type="text"
                    inputmode="numeric"
                    class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    @input="handleNumericInput($event, (val) => formData.harga_pokok = val)"
                    min="0"
                    required
                    placeholder="15000"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Margin Keuntungan
                  </label>
                  <div class="px-3 py-3 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    {{ marginKeuntungan.toFixed(1) }}%
                  </div>
                </div>
              </div>
              <!-- Consignment Information -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Informasi Konsinyasi</h3>
                
                <div class="space-y-4">
                  <div class="flex items-center">
                    <input
                      id="konsinyasi"
                      v-model="formData.konsinyasi"
                      type="checkbox"
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
                      placeholder="Pilih Supplier Konsinyasi"
                      :required="formData.konsinyasi"
                    />
                  </div>
                </div>
              </div>              
            </div>
            
            <!-- Recipe-based Product -->
            <div v-else>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <h4 class="text-md font-medium text-gray-800"></h4>
                  <button
                    type="button"
                    @click="addRecipeItem"
                    class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    + Tambah Bahan
                  </button>
                </div>
                
                <div v-if="formData.recipe_items.length === 0" class="text-center py-8 text-gray-500">
                  <p>Belum ada bahan setengah jadi yang ditambahkan</p>
                  <button
                    type="button"
                    @click="addRecipeItem"
                    class="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Tambah bahan setengah jadi pertama
                  </button>
                </div>
                
                <div v-else class="space-y-3">
                  <!-- Header Kolom -->
                  <div class="grid grid-cols-12 gap-3 px-3 py-2 bg-gray-100 border border-gray-200 rounded-md">
                    <div class="col-span-5">
                      <span class="text-sm font-medium text-gray-700">Bahan Setengah Jadi</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-sm font-medium text-gray-700">Jumlah</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-sm font-medium text-gray-700">Unit</span>
                    </div>
                    <div class="col-span-2">
                      <span class="text-sm font-medium text-gray-700">Subtotal</span>
                    </div>
                    <div class="col-span-1">
                      <span class="text-sm font-medium text-gray-700">Aksi</span>
                    </div>
                  </div>
                  
                  <!-- Data Rows -->
                  <div 
                    v-for="(item, index) in formData.recipe_items" 
                    :key="index"
                    class="grid grid-cols-12 gap-3 items-center p-3 bg-white border border-gray-200 rounded-md"
                  >
                    <div class="col-span-5">
                      <Select
                        v-model="item.cooked_items_id"
                        :options="cookedItemOptions"
                        placeholder="Pilih Bahan Setengah Jadi"
                        @update:modelValue="onCookedItemChange(index)"
                        required
                      />
                    </div>
                    
                    <div class="col-span-2">
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="1"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div class="col-span-2">
                      <div class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm text-center">
                        {{ item.unit.abbreviation || '-' }}
                      </div>
                    </div>
                    
                    <div class="col-span-2">
                      <div class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm text-right">
                        {{ formatCurrency((cookedItems.find(c => c.id === item.cooked_items_id)?.harga_pokok_per_unit || 0) * item.quantity) }}
                      </div>
                    </div>
                    
                    <div class="col-span-1 flex justify-center">
                      <button
                        type="button"
                        @click="removeRecipeItem(index)"
                        class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Hapus bahan"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Field Deskripsi -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              v-model="formData.deskripsi"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan deskripsi produk..."
            ></textarea>
          </div>
          <!-- Recipe Summary -->
          <div v-if="formData.recipe_items.length > 0" class="bg-blue-50 p-4 rounded-md">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-700">Total Harga Bahan:</span>
                <div class="text-lg font-semibold text-blue-600">
                  {{ formatCurrency(calculatedTotalHargaBahan) }}
                </div>
              </div>
              <div>
                <span class="font-medium text-gray-700">Harga Jual:</span>
                <div class="text-lg font-semibold text-green-600">
                  {{ formatCurrency(formData.harga_jual) }}
                </div>
              </div>
              <div>
                <span class="font-medium text-gray-700">Margin Keuntungan:</span>
                <div class="text-lg font-semibold" :class="marginKeuntungan >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ marginKeuntungan.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="!isFormValid || isLoading"
              class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Memproses...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </PermissionBasedAccess>
  </Modal>
</template>
