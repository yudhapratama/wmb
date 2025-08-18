<script setup>
import { ref, onMounted, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import CookedItemCard from '../components/features/cookedItems/CookedItemCard.vue'
import CookedItemFilters from '../components/features/cookedItems/CookedItemFilters.vue'
import AddCookedItemModal from '../components/features/cookedItems/modals/AddCookedItemModal.vue'
import EditCookedItemModal from '../components/features/cookedItems/modals/EditCookedItemModal.vue'
import DetailCookedItemModal from '../components/features/cookedItems/modals/DetailCookedItemModal.vue'
import { useCookedItems } from '../composables/useCookedItems'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'

// Get offline status
const { isOffline } = useOfflineStatus()

// Use cooked items composable
const {
  isLoading,
  cookedItems,
  rawMaterials,
  units,
  searchQuery,
  selectedCategory,
  filteredItems,
  paginatedItems,
  loadData,
  getUnitName,
  getRawMaterialName,
  addItem,
  updateItem,
  deleteItem,
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
} = useCookedItems()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const currentItem = ref(null)
// ✅ Tambahkan state untuk modal konfirmasi hapus
const isConfirmDeleteOpen = ref(false)
const itemToDelete = ref(null)

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

// Handle add item
async function handleAddItem(newItem) {
  const result = await addItem(newItem)
  if (result.success) {
    showAddModal.value = false
    showSuccessNotification('Bahan siap masak berhasil ditambahkan')
  } else {
    showErrorNotification(`Gagal menambahkan bahan siap masak: ${result.error || 'Unknown error'}`)
  }
}

// Handle update item
async function handleUpdateItem(updatedItem) {
  const result = await updateItem(updatedItem)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Bahan siap masak berhasil diperbarui')
  } else {
    showErrorNotification(`Gagal memperbarui bahan siap masak: ${result.error || 'Unknown error'}`)
  }
}

// Handle delete item
// ✅ Ubah fungsi handleDeleteItem menjadi confirmDelete
function confirmDelete(itemId) {
  itemToDelete.value = itemId
  isConfirmDeleteOpen.value = true
}

// ✅ Ubah nama fungsi dari deleteItem menjadi handleDeleteConfirm untuk menghindari konflik
async function handleDeleteConfirm() {
  if (itemToDelete.value) {
    try {
      const result = await deleteItem(itemToDelete.value) // Gunakan deleteItem dari composable
      if (result.success) {
        showSuccessNotification('Bahan siap masak berhasil dihapus')
      } else {
        showErrorNotification(`Gagal menghapus bahan siap masak: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      showErrorNotification('Gagal menghapus bahan siap masak')
    } finally {
      isConfirmDeleteOpen.value = false
      itemToDelete.value = null
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
  <AppLayout title="Bahan Siap Masak">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Bahan Siap Masak</h1>
      <PermissionBasedAccess collection="cooked_items" action="create">
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Bahan Siap Masak
        </button>
      </PermissionBasedAccess>
    </div>
    
    <!-- Filters -->
    <CookedItemFilters
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
      :dateFilter="dateFilter"
      @update:dateFilter="updateDateFilter"
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
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Items Grid -->
    <div v-else-if="paginatedItems.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      <CookedItemCard
        v-for="item in paginatedItems"
        :key="item.id"
        :item="item"
        :getUnitName="getUnitName"
        :getRawMaterialName="getRawMaterialName"
        :rawMaterials="rawMaterials"
        @view="viewItemDetails"
        @edit="editItem"
        @delete="confirmDelete"
      />
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada bahan siap masak</h3>
      <p class="mt-1 text-sm text-gray-500">Mulai dengan menambahkan bahan siap masak pertama Anda.</p>
    </div>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <nav class="flex items-center space-x-2">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          v-for="page in Math.min(totalPages, 5)"
          :key="page"
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
        
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </nav>
    </div>
    
    <!-- Modals -->
    <AddCookedItemModal
      v-if="showAddModal"
      :rawMaterials="rawMaterials"
      :units="units"
      @save="handleAddItem"
      @close="showAddModal = false"
    />
    
    <EditCookedItemModal
      v-if="showEditModal"
      :item="currentItem"
      :rawMaterials="rawMaterials"
      :units="units"
      @save="handleUpdateItem"
      @close="showEditModal = false"
    />
    
    <DetailCookedItemModal
      v-if="showDetailModal"
      :item="currentItem"
      :rawMaterials="rawMaterials"
      :units="units"
      :getUnitName="getUnitName"
      :getRawMaterialName="getRawMaterialName"
      @close="showDetailModal = false"
      @edit="editItem"
    />
    
    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-if="isConfirmDeleteOpen"
      title="Konfirmasi Hapus"
      message="Apakah Anda yakin ingin menghapus bahan siap masak ini? Tindakan ini tidak dapat dibatalkan."
      @confirm="handleDeleteConfirm"
      @cancel="isConfirmDeleteOpen = false"
    />
    
    <!-- Notification -->
    <div
      v-if="showNotification"
      :class="[
        'fixed top-4 right-4 p-4 rounded-md shadow-lg z-50',
        notificationType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      ]"
    >
      {{ notificationMessage }}
    </div>
    
    <!-- Offline Indicator -->
    <div v-if="isOffline" class="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg">
      Mode Offline - Perubahan akan disinkronkan saat online
    </div>
  </AppLayout>
</template>