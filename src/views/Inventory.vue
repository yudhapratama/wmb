<script setup>
import { ref, onMounted, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import InventoryCard from '../components/features/inventory/InventoryCard.vue'
import InventoryFilters from '../components/features/inventory/InventoryFilters.vue'
import ShrinkageModal from '../components/features/inventory/modals/ShrinkageModal.vue'
import AddItemModal from '../components/features/inventory/modals/AddItemModal.vue'
import EditItemModal from '../components/features/inventory/modals/EditItemModal.vue'
import DetailModal from '../components/features/inventory/modals/DetailModal.vue'
import { useInventory } from '../composables/useInventory'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import { handleImageUpload } from '../utils/imageUtils'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'

/**
 * ! unused function
 * Add this function to handle shrinkage image upload
async function handleShrinkageImageUpload(event) {
  const imageData = await handleImageUpload(event)
  if (imageData) {
    shrinkageForm.value.image = imageData
  }
}
*/

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
  paginatedMaterials,
  loadData,
  getCategoryName,
  getSupplierName,
  getUnitName,
  addItem,
  updateItem,
  deleteItem,
  getStockStatus,
  // Pagination
  currentPage,
  itemsPerPage,
  itemsPerPageOptions,
  totalPages,
  paginationInfo,
  changePage,
  changeItemsPerPage,
  resetPagination,
  // Date filter
  dateFilter,
  updateDateFilter
} = useInventory()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showShrinkageModal = ref(false)
const currentItem = ref(null)
const activeTab = ref('details')

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

// Watch for filter changes to reset pagination
watch([searchQuery, selectedCategory, dateFilter], () => {
  resetPagination()
}, { deep: true })

// Load data on mount
onMounted(async () => {
  await loadData()
})

// View item details
function viewItemDetails(item) {
  currentItem.value = { ...item }
  activeTab.value = 'details'
  showDetailModal.value = true
}

// Edit item
function editItem(item) {
  currentItem.value = { ...item }
  showEditModal.value = true
}

// Record shrinkage
function recordShrinkage(item) {
  currentItem.value = { ...item }
  showShrinkageModal.value = true
}

// Handle add item
async function handleAddItem(newItem) {
  const result = await addItem(newItem)
  if (result.success) {
    showAddModal.value = false
    showSuccessNotification('Item added successfully')
  } else {
    showErrorNotification(`Failed to add item: ${result.error || 'Unknown error'}`)
  }
}

// Handle update item
async function handleUpdateItem(updatedItem) {
  const result = await updateItem(updatedItem)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Item updated successfully')
  } else {
    showErrorNotification(`Failed to update item: ${result.error || 'Unknown error'}`)
  }
}

// Handle shrinkage record
async function handleShrinkageSubmit(shrinkageData) {
  if (currentItem.value) {
    // Update the stock quantity
    const updatedItem = {
      ...currentItem.value,
      stock_quantity: Math.max(0, currentItem.value.stock_quantity - shrinkageData.quantity)
    }
    
    const result = await updateItem(updatedItem)
    if (result.success) {
      showShrinkageModal.value = false
      showSuccessNotification('Shrinkage recorded successfully')
    } else {
      showErrorNotification(`Failed to record shrinkage: ${result.error || 'Unknown error'}`)
    }
  }
}

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
</script>

<template>
  <AppLayout title="Inventory Management">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Inventory Management</h1>
      <PermissionBasedAccess collection="raw_materials" action="create">
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Item
        </button>
      </PermissionBasedAccess>
    </div>
    
    <!-- Filters -->
    <InventoryFilters
      :categories="categories"
      :selectedCategory="selectedCategory"
      @update:selectedCategory="selectedCategory = $event"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
      :dateFilter="dateFilter"
      @update:dateFilter="updateDateFilter($event)"
    />
    
    <!-- Pagination Info -->
    <div class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        Menampilkan {{ paginationInfo.start }} - {{ paginationInfo.end }} dari {{ paginationInfo.total }} item
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">Tampilkan:</label>
        <select
          :value="itemsPerPage"
          @change="changeItemsPerPage(Number($event.target.value))"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px]"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <span class="text-sm text-gray-700">per halaman</span>
      </div>
    </div>
    
    <!-- Inventory Cards -->
    <div class="mt-4 grid grid-cols-1 gap-6">
      <div v-if="isLoading" class="col-span-full text-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Loading inventory items...</p>
      </div>
      
      <div v-else-if="paginatedMaterials.length === 0" class="col-span-full text-center py-12">
        <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="mt-2 text-gray-600">No inventory items found.</p>
        <PermissionBasedAccess collection="raw_materials" action="create">
          <button
            @click="showAddModal = true"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Item
          </button>
        </PermissionBasedAccess>
      </div>
      
      <InventoryCard
        v-for="item in paginatedMaterials"
        :key="item.id"
        :item="item"
        :getCategoryName="getCategoryName"
        :getUnitName="getUnitName"
        :getSupplierName="getSupplierName"
        @view="viewItemDetails"
        @edit="editItem"
        @shrinkage="recordShrinkage"
      />
    </div>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <nav class="flex items-center gap-2">
        <!-- Previous button -->
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>
        
        <!-- Page numbers -->
        <template v-for="page in Math.min(totalPages, 7)" :key="page">
          <button
            v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
            @click="changePage(page)"
            :class="[
              'px-3 py-2 text-sm font-medium border rounded-md',
              page === currentPage
                ? 'text-blue-600 bg-blue-50 border-blue-500'
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <span v-else-if="page === currentPage - 3 || page === currentPage + 3" class="px-2 py-2 text-gray-500">
            ...
          </span>
        </template>
        
        <!-- Next button -->
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Selanjutnya
        </button>
      </nav>
    </div>
    
    <!-- Modals -->
    <AddItemModal
      :isOpen="showAddModal"
      :categories="categories"
      :suppliers="suppliers"
      :unitOptions="unitOptions"
      :isLoading="isLoading"
      @close="showAddModal = false"
      @submit="handleAddItem"
    />
    
    <EditItemModal
      :isOpen="showEditModal"
      :item="currentItem"
      :categories="categories"
      :suppliers="suppliers"
      :unitOptions="unitOptions"
      :isLoading="isLoading"
      @close="showEditModal = false"
      @submit="handleUpdateItem"
    />
    
    <DetailModal
      :isOpen="showDetailModal"
      :item="currentItem"
      :getCategoryName="getCategoryName"
      :getUnitName="getUnitName"
      :getSupplierName="getSupplierName"
      v-model:activeTab="activeTab"
      @close="showDetailModal = false"
      @edit="editItem"
      @shrinkage="recordShrinkage"
    />
    
    <ShrinkageModal
      :isOpen="showShrinkageModal"
      :item="currentItem"
      :getUnitName="getUnitName"
      :isLoading="isLoading"
      @close="showShrinkageModal = false"
      @submit="handleShrinkageSubmit"
    />
    
    <!-- Notification -->
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