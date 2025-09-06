<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useFileUpload } from '@/composables/useFileUpload'
import { useStockOpnames } from '@/composables/useStockOpnames'
import { CheckIcon, XMarkIcon, PencilIcon, TrashIcon, ClipboardDocumentListIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import { formatDate, formatCurrency } from '@/utils/helpers'
import Select from '@/components/ui/Select.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  stockOpname: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const toast = useToast()
const { 
  loadRawMaterials, 
  rawMaterials, 
  addStockOpname, 
  updateStockOpname, 
  addStockOpnameItem, 
  updateStockOpnameItem, 
  deleteStockOpnameItem, 
  fetchOpnameDetail, 
  getRawMaterialName, 
  getRawMaterialUnit, 
  getCurrentStock 
} = useStockOpnames()

// File upload composable
const { fileInput, previews, isUploading, uploadFile, getFileUrl } = useFileUpload({
  featureName: 'StockOpname',
  dataId: computed(() => editingItem.value?.id || 'temp')
})

// Form data
const form = ref({
  tanggal_opname: new Date().toISOString().split('T')[0],
  status: 'draft',
  catatan_keseluruhan: '',
  items_opname: []
})

// Item management
const editingItem = ref(null)
const newItem = ref({
  raw_material_id: '',
  stok_sistem: 0,
  stok_fisik: 0,
  selisih: 0,
  catatan_item: '',
  bukti_opname: null
})

// Computed properties
const rawMaterialOptions = computed(() => {
  return rawMaterials.value.map(material => ({
    value: material.id,
    label: material.nama_item
  }))
})

const statusOptions = computed(() => [
  { value: 'draft', label: 'draft' },
  { value: 'selesai', label: 'selesai' }
])

const isNewItemValid = computed(() => {
  return (
    newItem.value.raw_material_id &&
    newItem.value.stok_fisik !== null &&
    newItem.value.stok_fisik !== undefined
  )
})

const items = computed(() => {
  return form.value.items_opname || []
})

const totalSelisih = computed(() => {
  if (!items.value.length) return 0
  return items.value.reduce((total, item) => total + (item.selisih || 0), 0)
})

const isFormValid = computed(() => {
  return form.value.tanggal_opname && form.value.status && items.value.length > 0
})

const isEditing = computed(() => {
  return !!editingItem.value
})

// Methods
function resetNewItem() {
  newItem.value = {
    raw_material_id: '',
    stok_sistem: 0,
    stok_fisik: 0,
    selisih: 0,
    catatan_item: '',
    bukti_opname: null
  }
}

function handleImageChange(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // Check file type
  const allowedTypes = getAllowedFileTypes()
  if (!allowedTypes.includes(file.type)) {
    toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP')
    return
  }
  
  // Check file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file terlalu besar. Maksimal 2MB')
    return
  }
  
  if (editingItem.value) {
    editingItem.value.bukti_opname = file
  } else {
    newItem.value.bukti_opname = file
  }
}

function removeImage() {
  if (editingItem.value) {
    editingItem.value.bukti_opname = null
  } else {
    newItem.value.bukti_opname = null
  }
}

function openFullImage(imagePath) {
  // Open image in new tab or modal
  window.open(getFileUrl(imagePath), '_blank')
}

function handleImageError(event) {
  event.target.src = '/placeholder-image.png'
}

function calculateSelisih() {
  const stokFisik = parseFloat(newItem.value.stok_fisik) || 0
  const stokSistem = parseFloat(newItem.value.stok_sistem) || 0
  newItem.value.selisih = stokFisik - stokSistem
}

function calculateEditSelisih() {
  if (!editingItem.value) {
    console.log('calculateEditSelisih called but editingItem is null')
    return
  }
  
  const stokFisik = parseFloat(editingItem.value.stok_fisik) || 0
  const stokSistem = parseFloat(editingItem.value.stok_sistem) || 0
  editingItem.value.selisih = stokFisik - stokSistem
  console.log('calculateEditSelisih: stokFisik =', stokFisik, 'stokSistem =', stokSistem, 'selisih =', editingItem.value.selisih)
}

function getAllowedFileTypes() {
  return ['image/jpeg', 'image/png', 'image/webp']
}

function onRawMaterialChange() {
  if (newItem.value.raw_material_id) {
    newItem.value.stok_sistem = getCurrentStock(newItem.value.raw_material_id) || 0
    calculateSelisih()
  }
}

function onEditRawMaterialChange() {
  if (editingItem.value && editingItem.value.raw_material_id) {
    editingItem.value.stok_sistem = getCurrentStock(editingItem.value.raw_material_id) || 0
    calculateEditSelisih()
  }
}

function addItem() {
  if (!isNewItemValid.value) return
  
  const newItemData = {
    id: Date.now().toString(), // Temporary ID for frontend
    raw_material_id: newItem.value.raw_material_id,
    nama_bahan: getRawMaterialName(newItem.value.raw_material_id),
    stok_sistem: parseFloat(newItem.value.stok_sistem),
    stok_fisik: parseFloat(newItem.value.stok_fisik),
    selisih: parseFloat(newItem.value.selisih),
    catatan_item: newItem.value.catatan_item,
    bukti_opname: newItem.value.bukti_opname
  }
  
  form.value.items_opname.push(newItemData)
  resetNewItem()
  toast.success('Item berhasil ditambahkan')
}

function startEdit(item) {
  // Buat salinan mendalam dari item untuk menghindari referensi langsung
  editingItem.value = JSON.parse(JSON.stringify(item))
  console.log('startEdit called, editingItem:', editingItem.value)
  // Pastikan stok sistem diperbarui berdasarkan raw_material_id saat ini
  if (editingItem.value && editingItem.value.raw_material_id) {
    editingItem.value.stok_sistem = getCurrentStock(editingItem.value.raw_material_id) || 0
    calculateEditSelisih()
  }
}

function cancelEdit() {
  editingItem.value = null
  removeImage()
}

function saveEdit() {
  if (!editingItem.value) return
  
  console.log('saveEdit called, editingItem:', editingItem.value)
  const index = form.value.items_opname.findIndex(item => item.id === editingItem.value.id)
  if (index !== -1) {
    // Pastikan semua properti disalin dengan benar
    form.value.items_opname[index] = { ...editingItem.value }
    toast.success('Item berhasil diperbarui')
  } else {
    console.error('Item tidak ditemukan dengan ID:', editingItem.value.id)
  }
  
  // Reset editingItem setelah disimpan
  editingItem.value = null
}

function deleteItem(item) {
  const index = form.value.items_opname.findIndex(i => i.id === item.id)
  if (index !== -1) {
    form.value.items_opname.splice(index, 1)
    toast.success('Item berhasil dihapus')
  }
}

async function loadItems() {
  if (props.stockOpname?.id) {
    try {
      const result = await fetchOpnameDetail(props.stockOpname.id)
      if (result.success && result.data.items_opname) {
        form.value.items_opname = result.data.items_opname
      }
    } catch (error) {
      console.error('Error loading items:', error)
      toast.error('Gagal memuat item stock opname')
    }
  }
}

// loadRawMaterials sudah diimpor dari composable useStockOpnames

async function handleSubmit() {
  if (!isFormValid.value) {
    toast.error('Mohon lengkapi semua field yang diperlukan')
    return
  }
  
  try {
    const stockOpnameData = {
      ...form.value,
      items_opname: form.value.items_opname.map(item => ({
        ...item,
        stok_sistem: parseFloat(item.stok_sistem),
        stok_fisik: parseFloat(item.stok_fisik),
        selisih: parseFloat(item.selisih)
      }))
    }
    
    let result;
    if (props.stockOpname?.id) {
      stockOpnameData.id = props.stockOpname.id
      result = await updateStockOpname(stockOpnameData)
      if (result.success) {
        toast.success('Stock opname berhasil diperbarui')
      } else {
        throw new Error(result.error || 'Gagal memperbarui stock opname')
      }
    } else {
      result = await addStockOpname(stockOpnameData)
      if (result.success) {
        toast.success('Stock opname berhasil dibuat')
      } else {
        throw new Error(result.error || 'Gagal membuat stock opname')
      }
    }
    
    emit('submit')
    emit('close')
  } catch (error) {
    console.error('Error submitting stock opname:', error)
    toast.error('Gagal menyimpan stock opname')
  }
}

function initFormData() {
  if (props.stockOpname) {
    form.value = {
      tanggal_opname: props.stockOpname.tanggal_opname || new Date().toISOString().split('T')[0],
      status: props.stockOpname.status || 'draft',
      catatan_keseluruhan: props.stockOpname.catatan_keseluruhan || '',
      items_opname: props.stockOpname.items_opname ? [...props.stockOpname.items_opname] : []
    }
  } else {
    form.value = {
      tanggal_opname: new Date().toISOString().split('T')[0],
      status: 'draft',
      catatan_keseluruhan: '',
      items_opname: []
    }
  }
}

// Watchers
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initFormData()
    loadRawMaterials()
    if (props.stockOpname?.id) {
      loadItems()
    }
  }
})

watch(() => props.stockOpname?.items_opname, (newVal) => {
  if (newVal) {
    form.value.items_opname = [...newVal]
  }
})

watch(() => newItem.value.stok_fisik, calculateSelisih)
watch(() => newItem.value.stok_sistem, calculateSelisih)
watch(() => editingItem.value?.stok_fisik, calculateEditSelisih)
watch(() => editingItem.value?.stok_sistem, calculateEditSelisih)

// Lifecycle hooks
onMounted(() => {
  if (fileInput.value) {
    fileInput.value.addEventListener('change', handleImageChange)
  }
  
  loadRawMaterials()
  
  if (props.isOpen) {
    initFormData()
  }
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ stockOpname?.id ? `Edit Stock Opname #${stockOpname.id}` : 'Tambah Stock Opname Baru' }}
          </h2>
          <p v-if="stockOpname?.id" class="text-sm text-gray-600 mt-1">
            {{ formatDate(stockOpname?.tanggal_opname) }} - Status: {{ stockOpname?.status }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <!-- Stock Opname Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Tanggal Opname -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Opname <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.tanggal_opname"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Status <span class="text-red-500">*</span>
              </label>
              <Select
                v-model="form.status"
                :options="statusOptions"
                placeholder="Pilih status..."
              />
              <p class="mt-1 text-sm text-gray-500">
                Pilih "Draft" untuk melanjutkan penambahan item, atau "Selesai" jika sudah final
              </p>
            </div>
          </div>
          
          <!-- Catatan Keseluruhan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catatan Keseluruhan
            </label>
            <textarea
              v-model="form.catatan_keseluruhan"
              rows="3"
              placeholder="Masukkan catatan umum untuk stock opname ini (opsional)..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">
              Contoh: "Stock opname akhir bulan Januari 2025"
            </p>
          </div>
        </form>
        
        <!-- Items Section -->
        <div class="mt-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Item Stock Opname</h3>
            <div class="text-sm text-gray-600" v-if="items.length > 0">
              Total Selisih: 
              <span :class="totalSelisih > 0 ? 'text-green-600 font-medium' : totalSelisih < 0 ? 'text-red-600 font-medium' : 'text-gray-600'">
                {{ totalSelisih > 0 ? '+' : '' }}{{ totalSelisih.toFixed(2) }}
              </span>
            </div>
          </div>
          
          <!-- Form Tambah Item -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h4 class="text-md font-medium text-gray-800 mb-4">Tambah Item Baru</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Bahan Baku -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Bahan Baku <span class="text-red-500">*</span>
                </label>
                <Select
                  v-model="newItem.raw_material_id"
                  :options="rawMaterialOptions"
                  placeholder="Pilih bahan baku..."
                  @update:modelValue="onRawMaterialChange"
                />
              </div>
              
              <!-- Stok Sistem -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Stok Sistem
                </label>
                <input
                  v-model="newItem.stok_sistem"
                  type="number"
                  step="0.01"
                  readonly
                  class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                />
              </div>
              
              <!-- Stok Fisik -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Stok Fisik <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.number="newItem.stok_fisik"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  @input="calculateSelisih(newItem)"
                />
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <!-- Catatan -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  v-model="newItem.catatan_item"
                  rows="2"
                  placeholder="Catatan untuk item ini (opsional)..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                ></textarea>
              </div>
              
              <!-- Bukti Opname -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Bukti Opname
                </label>
                <div class="flex items-center space-x-2">
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="fileInput.value.click()"
                    class="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <PhotoIcon class="w-5 h-5 inline-block mr-1" />
                    {{ newItem.bukti_opname ? 'Ganti Gambar' : 'Unggah Gambar' }}
                  </button>
                  <span v-if="newItem.bukti_opname" class="text-sm text-gray-600">
                    Gambar dipilih
                  </span>
                  <button
                    v-if="newItem.bukti_opname"
                    type="button"
                    @click="newItem.bukti_opname = null"
                    class="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </div>
                
                <!-- Preview Gambar -->
                <div v-if="newItem.bukti_opname" class="mt-2">
                  <img 
                    :src="typeof newItem.bukti_opname === 'string' ? newItem.bukti_opname : URL.createObjectURL(newItem.bukti_opname)"
                    alt="Bukti opname"
                    class="h-20 w-auto object-cover rounded border border-gray-300"
                  />
                </div>
              </div>
            </div>
            
            <!-- Selisih & Tombol Tambah -->
            <div class="flex justify-between items-center mt-4">
              <div>
                <span class="text-sm font-medium">Selisih: </span>
                <span :class="newItem.selisih > 0 ? 'text-green-600 font-medium' : newItem.selisih < 0 ? 'text-red-600 font-medium' : 'text-gray-600'">
                  {{ newItem.selisih > 0 ? '+' : '' }}{{ newItem.selisih.toFixed(2) }}
                </span>
              </div>
              <div class="flex space-x-2">
                <button
                  v-if="isEditing"
                  type="button"
                  @click="cancelEdit"
                  class="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  Batal
                </button>
                <button
                  type="button"
                  @click="isEditing ? saveEdit() : addItem()"
                  :disabled="!isNewItemValid"
                  :class="[
                    'px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isNewItemValid
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      : 'bg-blue-300 text-white cursor-not-allowed'
                  ]"
                >
                  {{ isEditing ? 'Simpan Perubahan' : 'Tambah Item' }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Items List -->
          <div>
            <!-- Items Table -->
            <div v-if="items.length > 0" class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bahan Baku</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Sistem</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Fisik</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Selisih</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bukti</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                      <template v-if="editingItem?.id === item.id">
                        <Select
                          v-model="editingItem.raw_material_id"
                          :options="rawMaterialOptions"
                          placeholder="Pilih bahan baku..."
                          @update:modelValue="onEditRawMaterialChange"
                        />
                      </template>
                      <template v-else>
                        <div class="text-sm font-medium text-gray-900">{{ getRawMaterialName(item.raw_material_id) }}</div>
                        <div class="text-xs text-gray-500">ID: {{ item.raw_material_id }}</div>
                      </template>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        v-if="editingItem?.id === item.id"
                        v-model="editingItem.stok_sistem"
                        type="number"
                        step="0.01"
                        readonly
                        class="w-20 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 focus:outline-none"
                      />
                      <span v-else class="text-sm text-gray-900">{{ item.stok_sistem || 0 }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input
                        v-if="editingItem?.id === item.id"
                        v-model="editingItem.stok_fisik"
                        type="number"
                        step="0.01"
                        class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        @input="calculateEditSelisih"
                      />
                      <span v-else class="text-sm text-gray-900">{{ item.stok_fisik || 0 }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span :class="[
                        'text-sm font-medium',
                        (editingItem?.id === item.id ? editingItem.selisih : item.selisih) > 0 ? 'text-green-600' : 
                        (editingItem?.id === item.id ? editingItem.selisih : item.selisih) < 0 ? 'text-red-600' : 'text-gray-600'
                      ]">
                        {{ (editingItem?.id === item.id ? editingItem.selisih : item.selisih) > 0 ? '+' : '' }}{{ (editingItem?.id === item.id ? editingItem.selisih : item.selisih) || 0 }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <input
                        v-if="editingItem?.id === item.id"
                        v-model="editingItem.catatan_item"
                        type="text"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Catatan..."
                      />
                      <span v-else class="text-sm text-gray-600">{{ item.catatan_item || '-' }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div v-if="item.bukti_opname" class="flex justify-center">
                        <div class="relative w-10 h-10 border rounded-md overflow-hidden cursor-pointer" @click="openFullImage(item.bukti_opname)">
                          <img 
                            :src="getFileUrl(item.bukti_opname)" 
                            class="w-full h-full object-cover" 
                            @error="handleImageError"
                            alt="Bukti Opname"
                          />
                        </div>
                      </div>
                      <span v-else class="text-xs text-gray-500">-</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <div class="flex justify-center space-x-2">
                        <template v-if="editingItem?.id === item.id">
                          <div class="flex flex-col items-center gap-2 mb-2">
                            <button
                              type="button"
                              @click="fileInput?.click()"
                              class="flex items-center gap-2 px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                              :disabled="isUploading"
                            >
                              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Foto</span>
                            </button>
                            
                            <div class="flex flex-col items-center gap-1">
                              <img
                                v-if="previews && previews[0]"
                                :src="previews[0].preview || previews[0]"
                                alt="Bukti opname preview"
                                class="w-16 h-16 object-cover rounded border"
                              />
                              <button
                                v-if="previews && previews[0]"
                                type="button"
                                @click="removeImage"
                                class="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                          
                          <div class="flex justify-center space-x-2">
                            <button
                              @click="saveEdit"
                              class="text-green-600 hover:text-green-700 p-1"
                              title="Simpan"
                            >
                              <CheckIcon class="w-4 h-4" />
                            </button>
                            <button
                              @click="cancelEdit"
                              class="text-gray-600 hover:text-gray-700 p-1"
                              title="Batal"
                            >
                              <XMarkIcon class="w-4 h-4" />
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <button
                            @click="startEdit(item)"
                            class="text-blue-600 hover:text-blue-700 p-1"
                            title="Edit"
                          >
                            <PencilIcon class="w-4 h-4" />
                          </button>
                          <button
                            @click="deleteItem(item)"
                            class="text-red-600 hover:text-red-700 p-1"
                            title="Hapus"
                          >
                            <TrashIcon class="w-4 h-4" />
                          </button>
                        </template>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Empty State -->
            <div v-else class="text-center py-12 border border-gray-200 rounded-lg">
              <ClipboardDocumentListIcon class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-500 mb-2">Belum ada item yang ditambahkan</p>
              <p class="text-sm text-gray-400">Gunakan form di atas untuk menambahkan item pertama</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="isLoading || !isFormValid"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Menyimpan...' : (stockOpname?.id ? 'Perbarui Stock Opname' : 'Simpan Stock Opname') }}
        </button>
      </div>
    </div>
  </div>
</template>