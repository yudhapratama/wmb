<template>
  <AppLayout>
    <div class="kitchen-page">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Kitchen</h1>
          <p class="text-gray-600">Catatan Produksi Dapur</p>
        </div>
        <PermissionBasedAccess collection="kitchen_prep" action="create">
          <button
            @click="showAddModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Buat Produksi Baru
          </button>
        </PermissionBasedAccess>
      </div>

      <!-- Offline Status -->
      <div v-if="isOffline" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span class="text-yellow-800">Mode Offline - Data mungkin tidak terbaru</span>
        </div>
      </div>

      <!-- Filters -->
      <KitchenFilters
        v-model:search="searchQuery"
        v-model:selected-cooked-item="selectedCookedItem"
        v-model:date-filter="dateFilter"
        :cooked-items="cookedItems"
        @clear-filters="clearFilters"
        @update-date-filter="updateDateFilter"
        class="mb-6"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Kitchen Preps List -->
      <div v-else-if="paginatedPreps.length > 0" class="space-y-4">
        <KitchenCard
          v-for="prep in paginatedPreps"
          :key="prep.id"
          :prep="prep"
          @view="viewPrepDetails"
          @edit="editPrep"
          @delete="confirmDelete"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada catatan produksi</h3>
        <p class="text-gray-600 mb-4">Mulai buat catatan produksi dapur pertama Anda</p>
        <PermissionBasedAccess collection="kitchen_prep" action="create">
          <button
            @click="showAddModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Buat Produksi Baru
          </button>
        </PermissionBasedAccess>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Menampilkan {{ paginationInfo.start }} - {{ paginationInfo.end }} dari {{ paginationInfo.total }} catatan
          </div>
          <div class="flex items-center space-x-2">
            <select
              v-model="itemsPerPage"
              @change="changeItemsPerPage(itemsPerPage)"
              class="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                {{ option }} per halaman
              </option>
            </select>
            <div class="flex space-x-1">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <button
                v-for="page in Math.min(totalPages, 5)"
                :key="page"
                @click="changePage(page)"
                :class="[
                  'px-3 py-1 border text-sm rounded',
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddKitchenPrepModal
      v-if="showAddModal"
      :cooked-items="cookedItems"
      :raw-materials="rawMaterials"
      :units="units"
      @close="showAddModal = false"
      @save="handleAddPrep"
    />

    <EditKitchenPrepModal
      v-if="showEditModal && currentPrep"
      :prep="currentPrep"
      :cooked-items="cookedItems"
      :raw-materials="rawMaterials"
      :units="units"
      @close="showEditModal = false"
      @save="handleEditPrep"
    />

    <DetailKitchenPrepModal
      v-if="showDetailModal && currentPrep"
      :prep="currentPrep"
      :cooked-items="cookedItems"
      :raw-materials="rawMaterials"
      :units="units"
      @close="showDetailModal = false"
    />

    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-if="isConfirmDeleteOpen"
      title="Konfirmasi Hapus"
      message="Apakah Anda yakin ingin menghapus catatan produksi ini? Tindakan ini tidak dapat dibatalkan."
      @confirm="deletePrep"
      @cancel="isConfirmDeleteOpen = false"
    />
    
    <!-- ✅ Tambahkan Notification -->
    <div 
      v-if="showNotification" 
      :class="[notificationType === 'success' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800']"
      class="fixed bottom-4 right-4 px-4 py-3 rounded-md border-l-4 shadow-md z-50"
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

<script setup>
import { ref, onMounted, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import KitchenCard from '../components/features/kitchen/KitchenCard.vue'
import KitchenFilters from '../components/features/kitchen/KitchenFilters.vue'
import AddKitchenPrepModal from '../components/features/kitchen/modals/AddKitchenPrepModal.vue'
import EditKitchenPrepModal from '../components/features/kitchen/modals/EditKitchenPrepModal.vue'
import DetailKitchenPrepModal from '../components/features/kitchen/modals/DetailKitchenPrepModal.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import { useKitchen } from '../composables/useKitchen'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'

// Get offline status
const { isOffline } = useOfflineStatus()

// Use kitchen composable
const {
  isLoading,
  kitchenPreps,
  cookedItems,
  rawMaterials,
  units,
  searchQuery,
  selectedCookedItem,
  dateFilter,
  filteredPreps,
  paginatedPreps,
  loadData,
  createKitchenPrep,
  updateKitchenPrep,
  deleteKitchenPrep,
  // Pagination
  currentPage,
  itemsPerPage,
  itemsPerPageOptions,
  totalPages,
  paginationInfo,
  changePage,
  changeItemsPerPage,
  resetPagination,
  // Filter functions
  updateDateFilter,
  clearFilters
} = useKitchen()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const currentPrep = ref(null)
const isConfirmDeleteOpen = ref(false)
const prepToDelete = ref(null)

// ✅ Tambahkan notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

// Watch for filter changes to reset pagination
watch([searchQuery, selectedCookedItem, dateFilter], () => {
  resetPagination()
}, { deep: true })

// Load data on mount
onMounted(async () => {
  await loadData()
})

// View prep details
function viewPrepDetails(prep) {
  currentPrep.value = { ...prep }
  showDetailModal.value = true
}

// Edit prep
function editPrep(prep) {
  currentPrep.value = { ...prep }
  showEditModal.value = true
}

// Confirm delete prep
function confirmDelete(prep) {
  prepToDelete.value = prep
  isConfirmDeleteOpen.value = true
}

// Delete prep
async function deletePrep() {
  if (prepToDelete.value) {
    try {
      await deleteKitchenPrep(prepToDelete.value.id)
      // ✅ Tampilkan notifikasi sukses
      showSuccessNotification('Catatan produksi berhasil dihapus')
    } catch (error) {
      console.error('Error deleting prep:', error)
      // ✅ Tampilkan notifikasi error
      showErrorNotification('Gagal menghapus catatan produksi')
    } finally {
      isConfirmDeleteOpen.value = false
      prepToDelete.value = null
    }
  }
}

// Handle add prep
async function handleAddPrep(prepData) {
  try {
    await createKitchenPrep(prepData)
    showAddModal.value = false
    // ✅ Tampilkan notifikasi sukses
    showSuccessNotification('Catatan produksi berhasil ditambahkan')
  } catch (error) {
    console.error('Error adding prep:', error)
    // ✅ Tampilkan notifikasi error
    showErrorNotification('Gagal menambahkan catatan produksi')
  }
}

// Handle edit prep
async function handleEditPrep(prepData) {
  try {
    await updateKitchenPrep(currentPrep.value.id, prepData)
    showEditModal.value = false
    currentPrep.value = null
    // ✅ Tampilkan notifikasi sukses
    showSuccessNotification('Catatan produksi berhasil diperbarui')
  } catch (error) {
    console.error('Error editing prep:', error)
    // ✅ Tampilkan notifikasi error
    showErrorNotification('Gagal memperbarui catatan produksi')
  }
}

// ✅ Tambahkan fungsi notifikasi
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
