<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Kelola Item Stock Opname #{{ stockOpname?.id }}</h2>
          <p class="text-sm text-gray-600 mt-1">
            {{ formatDateTimeIndonesian(stockOpname?.tanggal_opname, false) || '-' }} - Status: {{ stockOpname?.status }}
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
        <!-- Add Item Form -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Tambah Item Baru</h3>
          <form @submit.prevent="addItem" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Raw Material Selection -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Bahan Baku <span class="text-red-500">*</span>
              </label>
              <Select
                v-model="newItem.nama_bahan"
                :options="rawMaterialOptions"
                placeholder="Pilih bahan baku..."
                class="w-full"
                @update:modelValue="onRawMaterialChange"
              />
            </div>
            
            <!-- Stok Sistem (readonly) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Stok Sistem
              </label>
              <input
                :value="formatNumber(newItem.stok_sistem)"
                type="text"
                inputmode="numeric"
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none"
                @input="handleNumericInput($event, (val) => newItem.stok_sistem = val)"
                min="0"
                required
                placeholder="Auto"
              />
            </div>
            
            <!-- Stok Fisik -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Stok Fisik <span class="text-red-500">*</span>
              </label>
              <input
                :value="formatNumber(newItem.stok_fisik)"
                type="text"
                inputmode="numeric"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @input="handleNumericInput($event, (val) => newItem.stok_fisik = val);calculateSelisih($event)"
                min="0"
                required
                placeholder="0.00"
              />
            </div>
            
            <!-- Catatan Item -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Catatan Item
              </label>
              <input
                v-model="newItem.catatan_item"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Catatan opsional..."
              />
            </div>
            
            <!-- Selisih (readonly) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Selisih
              </label>
              <input
                :value="formatNumber(newItem.selisih)"
                type="text"
                inputmode="numeric"
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none"
                @input="handleNumericInput($event, (val) => newItem.selisih = val)"
                min="0"
                required
                :class="[
                  'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none font-medium',
                  newItem.selisih > 0 ? 'text-green-600' : newItem.selisih < 0 ? 'text-red-600' : 'text-gray-600'
                ]"
                placeholder="0.00"
                readonly
              />
            </div>
            
            <!-- Bukti Opname -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Bukti Opname
              </label>
              <div class="flex items-center gap-4">
                <button
                  type="button"
                  @click="fileInput?.click()"
                  class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  :disabled="isUploading"
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
                <img
                  v-if="previews && previews[0]"
                  :src="previews[0].preview || previews[0]"
                  alt="Bukti opname preview"
                  class="w-20 h-20 object-cover rounded border"
                />
                <button
                  v-if="previews && previews[0]"
                  type="button"
                  @click="removeImage"
                  class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
              
              <!-- Error -->
              <div v-if="fileErrors.length > 0" class="mt-1 text-sm text-red-600">
                {{ fileErrors[0] }}
              </div>
              
              <!-- Add Button -->
              <div class="mt-4">
                <button
                  type="submit"
                  :disabled="!isNewItemValid || isLoading"
                  class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <PlusIcon class="w-4 h-4" />
                  Tambah
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Items List -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Daftar Item ({{ formatNumber(items.length) }})</h3>
            <div class="text-sm text-gray-600">
              Total Selisih: 
              <span :class="totalSelisih > 0 ? 'text-green-600 font-medium' : totalSelisih < 0 ? 'text-red-600 font-medium' : 'text-gray-600'">
                {{ totalSelisih > 0 ? '+' : '' }}{{ formatNumber(totalSelisih.toFixed(2)) }}
              </span>
            </div>
          </div>
          
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
                    <div class="text-sm font-medium text-gray-900">{{ item.nama_bahan.nama_item }}</div>
                    <div class="text-xs text-gray-500">ID: {{ item.nama_bahan.id }}</div>
                  </td>
                  <td class="px-4 py-3 text-center text-sm text-gray-900">{{ formatNumber(item.stok_sistem || 0) }}</td>
                  <td class="px-4 py-3 text-center">
                    <input
                      v-if="editingItem?.id === item.id"
                      :value="formatNumber(editingItem.stok_fisik)"
                      type="text"
                      inputmode="numeric"
                      class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      @input="handleNumericInput($event, (val) => editingItem.stok_fisik = val);calculateEditSelisih($event)"
                      min="0"
                      required
                      placeholder="Auto"
                    />
                    <span v-else class="text-sm text-gray-900">{{ formatNumber(item.stok_fisik || 0) }}</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="[
                      'text-sm font-medium',
                      (editingItem?.id === item.id ? editingItem.selisih : item.selisih) > 0 ? 'text-green-600' : 
                      (editingItem?.id === item.id ? editingItem.selisih : item.selisih) < 0 ? 'text-red-600' : 'text-gray-600'
                    ]">
                      {{ (editingItem?.id === item.id ? editingItem.selisih : item.selisih) > 0 ? '+' : '' }}{{ formatNumber(editingItem?.id === item.id ? editingItem.selisih : item.selisih) || 0 }}
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
      
      <!-- Footer -->
      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Tutup
        </button>
        <button
          @click="$emit('refresh')"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
        >
          <ArrowPathIcon class="w-4 h-4" />
          Selesai
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  PhotoIcon
} from '@heroicons/vue/24/outline'
import Select from '@/components/ui/Select.vue'
import db from '@/services/db.js'
import { syncService } from '@/services/sync.js'
import { useToast } from '@/composables/useToast.js'
import { useFileUpload } from '@/composables/useFileUpload.js'
import { getAllowedFileTypes } from '@/utils/fileUtils.js'
import { formatDateTimeIndonesian, formatNumber, handleNumericInput } from '@/utils/helpers'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  stockOpname: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'refresh'])

// Composables
const { showToast } = useToast()
const { 
  files, 
  previews, 
  errors: fileErrors, 
  isUploading, 
  uploadFiles, 
  handleFileSelect, 
  removeFile,
  clearFiles,
  getFileUrl
} = useFileUpload({
  multiple: false,
  autoUpload: false,
  featureName: 'StockOpname',
  dataId: computed(() => props.stockOpname?.id || null)
})

// Reactive data
const isLoading = ref(false)
const items = ref([])
const rawMaterials = ref([])
const editingItem = ref(null)
const fileInput = ref(null)

// New item form
const newItem = ref({
  nama_bahan: '',
  nama_bahan_name: '',
  stok_sistem: 0,
  stok_fisik: 0,
  selisih: 0,
  catatan_item: '',
  bukti_opname: null
})

// Computed
const rawMaterialOptions = computed(() => {
  return rawMaterials.value
    .filter(material => !items.value.some(item => item.nama_bahan === material.id))
    .map(material => ({
      value: material.id,
      label: material.nama_item
    }))
})

const isNewItemValid = computed(() => {
  return newItem.value.nama_bahan && newItem.value.stok_fisik !== ''
})

const totalSelisih = computed(() => {
  return items.value.reduce((total, item) => total + (parseFloat(item.selisih) || 0), 0)
})

// Methods
function resetNewItem() {
  newItem.value = {
    nama_bahan: '',
    nama_bahan_name: '',
    stok_sistem: 0,
    stok_fisik: 0,
    selisih: 0,
    catatan_item: '',
    bukti_opname: null
  }
  clearFiles()
}

function handleImageChange(event) {
  handleFileSelect(event)
}

function removeImage() {
  removeFile(0)
  newItem.value.bukti_opname = null
}

// Fungsi untuk menampilkan gambar dalam ukuran penuh
function openFullImage(fileId) {
  if (!fileId) return
  
  const imageUrl = getFileUrl(fileId)
  window.open(imageUrl, '_blank')
}

// Fungsi untuk menangani error pada gambar
function handleImageError(event) {
  event.target.src = '/placeholder.svg'
  event.target.classList.add('bg-gray-100')
}

function calculateSelisih() {
  const stokSistem = parseFloat(newItem.value.stok_sistem) || 0
  const stokFisik = parseFloat(newItem.value.stok_fisik) || 0
  newItem.value.selisih = stokFisik - stokSistem
}

function calculateEditSelisih() {
  if (editingItem.value) {
    const stokSistem = parseFloat(editingItem.value.stok_sistem) || 0
    const stokFisik = parseFloat(editingItem.value.stok_fisik) || 0
    editingItem.value.selisih = stokFisik - stokSistem
  }
}

async function onRawMaterialChange(materialId) {
  const material = rawMaterials.value.find(m => m.id === materialId)
  if (material) {
    newItem.value.nama_bahan_name = material.nama_item
    newItem.value.stok_sistem = material.total_stock || 0
    calculateSelisih()
  }
}

async function addItem() {
  if (!isNewItemValid.value) return
  
  try {
    isLoading.value = true
    
    let bukti_opname = null
    
    // Upload file first if selected
    if (files.value.length > 0) {
      // Use stock opname ID for folder structure
      const recordId = props.stockOpname.id || Date.now().toString()
      console.log('Uploading file with recordId:', recordId)
      const uploadedIds = await uploadFiles(recordId)
      bukti_opname = uploadedIds[0] || null
      console.log('Uploaded file ID:', bukti_opname)
    }
    
    const itemData = {
      stock_opname_id: props.stockOpname.id,
      nama_bahan: newItem.value.nama_bahan,
      nama_bahan_name: newItem.value.nama_bahan_name,
      stok_sistem: parseFloat(newItem.value.stok_sistem) || 0,
      stok_fisik: parseFloat(newItem.value.stok_fisik) || 0,
      selisih: parseFloat(newItem.value.selisih) || 0,
      catatan_item: newItem.value.catatan_item || null,
      bukti_opname: bukti_opname,
      sync_status: 'pending',
      cached_at: new Date().toISOString()
    }
    
    console.log('Adding new item to database:', itemData)
    
    // Save to local database first
    const newItemId = await db.stock_opname_items.add(itemData)
    console.log('New item added with ID:', newItemId)
    
    // Retrieve the newly added item with its ID
    const newItemWithId = await db.stock_opname_items.get(newItemId)
    
    // Add the new item to the items array directly
    if (newItemWithId) {
      console.log('Adding new item to items array:', newItemWithId)
      items.value.push(newItemWithId)
    }
    
    // Sync to server
    await syncService.createStockOpnameItem(itemData)
    console.log('Item synced to server')
    
    // Tidak perlu reload semua item karena kita sudah menambahkan item baru ke array items
    // await loadItems()
    resetNewItem()
    
    showToast({
      message: 'Item berhasil ditambahkan',
      type: 'success'
    })
  } catch (error) {
    console.error('Error adding item:', error)
    showToast({
      message: 'Gagal menambahkan item: ' + (error.message || 'Terjadi kesalahan'),
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

function startEdit(item) {
  editingItem.value = { ...item }
  // Reset file upload state untuk mode edit
  clearFiles()
  // Jika ada bukti opname, tambahkan preview
  if (item.bukti_opname) {
    const previewUrl = getFileUrl(item.bukti_opname)
    if (previewUrl) {
      previews.value = [{ preview: previewUrl }]
    }
  }
}

function cancelEdit() {
  editingItem.value = null
  clearFiles()
}

async function saveEdit() {
  if (!editingItem.value) return
  
  try {
    isLoading.value = true
    
    let bukti_opname = editingItem.value.bukti_opname
    
    // Upload file first if selected
    if (files.value.length > 0) {
      // We need a temporary ID for folder structure, use timestamp
      const tempId = Date.now().toString()
      const uploadedIds = await uploadFiles(tempId)
      bukti_opname = uploadedIds[0] || bukti_opname
    }
    
    const updateData = {
      stok_fisik: parseFloat(editingItem.value.stok_fisik) || 0,
      selisih: parseFloat(editingItem.value.selisih) || 0,
      catatan_item: editingItem.value.catatan_item || null,
      bukti_opname: bukti_opname,
      sync_status: 'pending'
    }
    
    // Update local database first
    await db.stock_opname_items.update(editingItem.value.id, updateData)
    
    // Update item in the items array directly
    const index = items.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updateData }
    }
    
    // Sync to server
    await syncService.updateStockOpnameItem(editingItem.value.id, updateData)
    
    // Reload items to ensure consistency with server data
    await loadItems()
    editingItem.value = null
    clearFiles()
    
    showToast({
      message: 'Item berhasil diperbarui',
      type: 'success'
    })
  } catch (error) {
    console.error('Error updating item:', error)
    showToast({
      message: 'Gagal memperbarui item: ' + (error.message || 'Terjadi kesalahan'),
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function deleteItem(item) {
  if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return
  
  try {
    isLoading.value = true
    
    // Delete from local database and sync to server
    await syncService.deleteStockOpnameItem(item.id)
    
    // Remove item from the items array directly
    items.value = items.value.filter(i => i.id !== item.id)
    
    // Reload items to ensure consistency with server data
    await loadItems()
    
    showToast({
      message: 'Item berhasil dihapus',
      type: 'success'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    showToast({
      message: 'Gagal menghapus item: ' + (error.message || 'Terjadi kesalahan'),
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function loadItems() {
  if (!props.stockOpname?.id) return
  
  try {
    isLoading.value = true
    console.log('Loading items for stock opname ID:', props.stockOpname.id)
    
    // Jika items_opname adalah array objek, gunakan langsung
    if (props.stockOpname.items_opname && Array.isArray(props.stockOpname.items_opname) && 
        typeof props.stockOpname.items_opname[0] === 'object') {
      console.log('Using items_opname directly as objects')
      items.value = props.stockOpname.items_opname
      return
    }
    
    // Jika items_opname adalah array ID, ambil data lengkap dari database lokal
    if (props.stockOpname.items_opname && Array.isArray(props.stockOpname.items_opname)) {
      console.log('Loading items from IDs:', props.stockOpname.items_opname)
      const itemIds = props.stockOpname.items_opname
      const loadedItems = []
      
      for (const itemId of itemIds) {
        const item = await db.stock_opname_items.get(itemId)
        if (item) loadedItems.push(item)
      }
      
      if (loadedItems.length > 0) {
        console.log('Loaded items from IDs:', loadedItems.length)
        items.value = loadedItems
        return
      }
    }
    
    // Jika tidak ada items_opname atau gagal mengambil dari ID, ambil berdasarkan stock_opname_id
    console.log('Loading items by stock_opname_id:', props.stockOpname.id)
    const dbItems = await db.stock_opname_items
      .where('stock_opname_id')
      .equals(props.stockOpname.id)
      .toArray()
    
    console.log('Loaded items from database:', dbItems.length)
    items.value = dbItems
  } catch (error) {
    console.error('Error loading items:', error)
    showToast({
      message: 'Gagal memuat daftar item: ' + (error.message || 'Terjadi kesalahan'),
      type: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

async function loadRawMaterials() {
  try {
    rawMaterials.value = await db.raw_materials.toArray()
  } catch (error) {
    console.error('Error loading raw materials:', error)
    showToast('Gagal memuat daftar bahan baku', 'error')
  }
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    console.log('Modal opened, loading data...')
    // Ensure we load data immediately when modal opens
    loadItems()
    loadRawMaterials()
    resetNewItem()
    editingItem.value = null
  }
})

// Watch for changes in stockOpname or its ID
watch(() => props.stockOpname?.id, (newId, oldId) => {
  if (newId && props.isOpen && newId !== oldId) {
    console.log('Stock opname ID changed, reloading items...')
    loadItems()
  }
})

// Watch for changes in stockOpname.items_opname
watch(() => props.stockOpname?.items_opname, (newItems) => {
  if (newItems && props.isOpen) {
    console.log('items_opname changed, reloading items...')
    loadItems()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  if (props.isOpen && props.stockOpname?.id) {
    console.log('Component mounted with open modal, loading data...')
    loadItems()
    loadRawMaterials()
  }
})
</script>