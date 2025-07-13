<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import Modal from '../components/ui/Modal.vue'
import InventoryCard from '../components/features/inventory/InventoryCard.vue'
import InventoryFilters from '../components/features/inventory/InventoryFilters.vue'
import InventoryForm from '../components/features/inventory/InventoryForm.vue'
import InventoryDetailView from '../components/features/inventory/InventoryDetailView.vue'
import { useInventory } from '../composables/useInventory'
import { useOfflineStatus } from '../composables/useOfflineStatus'

// Get offline status
const { isOffline } = useOfflineStatus()

// Use inventory composable
const {
  isLoading,
  rawMaterials,
  categories,
  suppliers,
  unitOptions,
  searchQuery,
  selectedCategory,
  filteredMaterials,
  loadData,
  getCategoryName,
  getSupplierName,
  getUnitName,
  addItem,
  updateItem,
  deleteItem,
  getStockStatus
} = useInventory()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showShrinkageModal = ref(false)
const currentItem = ref(null)
const activeTab = ref('details')

// Form data
const newItem = ref({
  nama_item: '',
  kategori: '',
  total_stock: 0,
  unit: 1, // Changed from empty string to default unit ID (1 for kg)
  minimum_stock_level: 0,
  harga_rata_rata: 0,
  supplier_utama: '',
  status: 'active'
})

// Shrinkage form data
const shrinkageForm = ref({
  quantity: 0,
  reason: '',
  notes: '',
  image: ''
})

// View item details
function viewItemDetails(item) {
  currentItem.value = { ...item }
  activeTab.value = 'details'
  showDetailModal.value = true
}

// Edit item
function editItem(item) {
  // Create a complete copy of the item
  const itemCopy = { ...item };
  
  // No need to convert unit ID to string value anymore
  // Just ensure it has a default value if not set
  if (!itemCopy.unit) {
    itemCopy.unit = 1; // Default to first unit ID if not set
  }
  
  currentItem.value = {
    ...itemCopy,
    price_per_unit: itemCopy.price_per_unit || 0
  };
  
  showEditModal.value = true;
}

// Record shrinkage
function recordShrinkage(item) {
  currentItem.value = { ...item }
  shrinkageForm.value = {
    quantity: 0,
    reason: '',
    notes: '',
    image: ''
  }
  showShrinkageModal.value = true
}

// Handle add item
async function handleAddItem() {
  const result = await addItem(newItem.value)
  if (result.success) {
    // Reset form and close modal
    newItem.value = {
      name: '',
      category_id: '',
      stock_quantity: 0,
      unit: '', // Changed from 'gram' to empty string
      min_stock_level: 0,
      price_per_unit: 0,
      supplier_id: '',
      status: 'active'
    }
    showAddModal.value = false
    showSuccessNotification('Item added successfully')
  } else {
    showErrorNotification(`Failed to add item: ${result.error || 'Unknown error'}`)
  }
}

// Handle update item
async function handleUpdateItem() {
  const result = await updateItem(currentItem.value)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Item updated successfully')
  } else {
    showErrorNotification(`Failed to update item: ${result.error || 'Unknown error'}`)
  }
}

// Handle shrinkage record
async function handleShrinkageSubmit() {
  if (currentItem.value && shrinkageForm.value.quantity > 0) {
    // In a real implementation, we would save the shrinkage record
    // For now, just update the stock quantity
    const updatedItem = {
      ...currentItem.value,
      stock_quantity: Math.max(0, currentItem.value.stock_quantity - shrinkageForm.value.quantity)
    }
    
    const result = await updateItem(updatedItem)
    if (result.success) {
      showShrinkageModal.value = false
    }
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Add these to the script section
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

function showSuccessNotification(message) {
  notificationMessage.value = message
  notificationType.value = 'success'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

function showErrorNotification(message) {
  notificationMessage.value = message
  notificationType.value = 'error'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

const isFormValid = computed(() => {
  return (
    newItem.value.nama_item && 
    newItem.value.kategori && 
    newItem.value.total_stock >= 0 && 
    newItem.value.unit && unitOptions.value.some(u => u.id === newItem.value.unit) && 
    newItem.value.minimum_stock_level >= 0
  )
})

const isEditFormValid = computed(() => {
  return (
    currentItem.value && 
    currentItem.value.nama_item && 
    currentItem.value.kategori && 
    currentItem.value.total_stock >= 0 && 
    currentItem.value.unit && unitOptions.value.some(u => u.id === currentItem.value.unit) && 
    currentItem.value.minimum_stock_level >= 0
  )
})

// Initialize
onMounted(() => {
  loadData()
})
</script>

<!-- In the template section, update the InventoryForm components -->
<template>
  <AppLayout>
    <!-- Main content -->
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p class="text-gray-600">Kelola stok bahan baku dan pantau shrinkage</p>
        </div>
        <!-- Replace the existing Tambah Item button with this -->
        <button
          @click="showAddModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-base font-medium flex items-center justify-center"
        >
          <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Item
        </button>
      </div>
      
      <!-- Filters -->
      <InventoryFilters
        v-model:searchQuery="searchQuery"
        v-model:selectedCategory="selectedCategory"
        :categories="categories"
      />
      
      <!-- Offline warning -->
      <div v-if="isOffline" class="mb-4 bg-yellow-50 border-l-3 border-yellow-400 p-2.5 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-2.5">
            <p class="text-xs text-yellow-700">
              You are currently offline. Changes will be synchronized when you reconnect.
            </p>
          </div>
        </div>
      </div>
  
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center h-48">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Inventory cards -->
      <div v-else class="space-y-4">
        <div v-if="filteredMaterials.length === 0" class="bg-white shadow rounded-lg overflow-hidden">
          <div class="text-center py-12">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" />
            </svg>
            <p class="text-gray-500">Tidak ada item inventory yang ditemukan</p>
          </div>
        </div>
        
        <div v-else>
          <div v-for="item in filteredMaterials" :key="item.id" class="mb-4">
            <InventoryCard 
              :item="item"
              :getCategoryName="getCategoryName"
              :getUnitName="getUnitName"
              :getSupplierName="getSupplierName"
              @view="viewItemDetails"
              @edit="editItem"
              @shrinkage="recordShrinkage"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Modal -->
    <Modal 
      :isOpen="showAddModal" 
      title="Tambah Item Inventory"
      @close="showAddModal = false"
    >
      <InventoryForm 
        :item="newItem" 
        :categories="categories"
        :suppliers="suppliers"
        :unitOptions="unitOptions"
        :isLoading="isLoading"
        @update:item="newItem = $event"
      />
      
      <template #footer>
        <button
          @click="showAddModal = false"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <!-- Only show Add Item button in Add Modal -->
        <button
          @click="handleAddItem"
          class="px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          :disabled="isLoading || !isFormValid"
        >
          {{ isLoading ? 'Saving...' : 'Add Item' }}
        </button>
      </template>
    </Modal>
    
    <!-- Edit Modal -->
    <Modal 
      :isOpen="showEditModal" 
      title="Edit Item Inventory"
      @close="showEditModal = false"
    >
      <InventoryForm 
        v-if="currentItem"
        :item="currentItem" 
        :categories="categories"
        :suppliers="suppliers"
        :unitOptions="unitOptions"
        :isLoading="isLoading"
        @update:item="currentItem = $event"
      />
      
      <template #footer>
        <button
          @click="showEditModal = false"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <!-- Only show Update button in Edit Modal -->
        <button
          @click="handleUpdateItem"
          class="px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          :disabled="isLoading || !isEditFormValid"
        >
          {{ isLoading ? 'Saving...' : 'Update' }}
        </button>
      </template>
    </Modal>
    
    <!-- Detail Modal -->
    <Modal 
      :isOpen="showDetailModal" 
      :title="currentItem ? `${currentItem.nama_item} - Detail Inventory` : 'Detail Inventory'" 
      size="xl"
      @close="showDetailModal = false"
    >
      <template #icon>
        <div v-if="currentItem" :class="getStockStatus(currentItem).color" class="p-1.5 rounded-md">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      </template>
      
      <InventoryDetailView 
        v-if="currentItem"
        :item="currentItem"
        :getCategoryName="getCategoryName"
        :getUnitName="getUnitName"
        :getSupplierName="getSupplierName"
        v-model:activeTab="activeTab"
        @edit="editItem"
        @shrinkage="recordShrinkage"
      />
    </Modal>
    
    <!-- Shrinkage Modal -->
    <Modal 
      :isOpen="showShrinkageModal" 
      :title="currentItem ? `Catat Shrinkage - ${currentItem.name}` : 'Catat Shrinkage'" 
      @close="showShrinkageModal = false"
    >
      <div v-if="currentItem" class="space-y-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-1">Stock yang dapat digunakan saat ini:</div>
          <div class="text-lg font-bold text-blue-600">
            {{ currentItem.total_stock }} {{ getUnitName(currentItem.unit) }}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Shrinkage *</label>
          <input
            type="number"
            v-model="shrinkageForm.quantity"
            :max="currentItem.stock_quantity"
            placeholder="Masukkan jumlah shrinkage"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Shrinkage *</label>
          <select
            v-model="shrinkageForm.reason"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Pilih alasan shrinkage</option>
            <option value="expired">Kadaluarsa</option>
            <option value="damaged">Rusak/Cacat</option>
            <option value="contaminated">Terkontaminasi</option>
            <option value="wrong-spec">Spesifikasi Salah</option>
            <option value="packaging-damaged">Kemasan Rusak</option>
            <option value="spillage">Tumpah/Tercecer</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            v-model="shrinkageForm.notes"
            placeholder="Catatan tambahan tentang shrinkage..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>
        
        <!-- Add Photo Upload Feature -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Foto Bukti</label>
          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="$refs.shrinkageFileInput.click()"
              class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ambil Foto
            </button>
            <input
              ref="shrinkageFileInput"
              type="file"
              accept="image/*"
              @change="handleShrinkageImageUpload"
              class="hidden"
            />
            <img
              v-if="shrinkageForm.image"
              :src="shrinkageForm.image"
              alt="Shrinkage evidence"
              class="w-20 h-20 object-cover rounded border"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-2 w-full">
          <button
            @click="showShrinkageModal = false"
            class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            @click="handleShrinkageSubmit"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-sm text-white rounded-md hover:bg-red-700"
            :disabled="isLoading || !shrinkageForm.quantity || !shrinkageForm.reason"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Catat Shrinkage
          </button>
        </div>
      </template>
    </Modal>
    <div 
      v-if="showNotification" 
      :class="[notificationType === 'success' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800']"
      class="fixed bottom-4 right-4 px-4 py-3 rounded-md border-l-4 shadow-md"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg v-if="notificationType === 'success'" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">{{ notificationMessage }}</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

// Add this import at the top of the <script setup> section
import { handleImageUpload } from '../utils/imageUtils'

// Add this function to handle shrinkage image upload
async function handleShrinkageImageUpload(event) {
  const imageData = await handleImageUpload(event)
  if (imageData) {
    shrinkageForm.value.image = imageData
  }
}
