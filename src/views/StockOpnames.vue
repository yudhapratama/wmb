<template>
  <AppLayout>
    <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Stock Opnames</h1>
            <p class="mt-1 text-sm text-gray-600">
              Kelola stock opname untuk mencocokkan stok sistem dengan stok fisik
            </p>
          </div>
          
          <!-- Add Button -->
          <PermissionBasedAccess collection="stock_opnames" action="create">
            <button
              @click="openAddModal"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon class="w-5 h-5 mr-2" />
              Tambah Stock Opname
            </button>
          </PermissionBasedAccess>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <div class="mb-6">
        <StockOpnameFilters
          :filters="filters"
          @update:filters="updateFilters"
          @clear="clearFilters"
        />
      </div>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <ClipboardDocumentListIcon class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Stock Opnames</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <DocumentTextIcon class="h-8 w-8 text-yellow-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Draft</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.draft || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Selesai</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.completed || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <CalendarIcon class="h-8 w-8 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Bulan Ini</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.thisMonth || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
      

      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Memuat data...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Terjadi Kesalahan</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
            <button
              @click="loadStockOpnames"
              class="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </div>
      
      <!-- Stock Opnames List -->
      <div v-else-if="stockOpnames.length > 0" class="space-y-6">
        <!-- Stock Opnames Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <StockOpnameCard
            v-for="opname in stockOpnames"
            :key="opname.id"
            :opname="opname"
            @detail="openDetailModal"
            @edit="openEditModal"
            @complete="handleComplete"
            @delete="handleDelete"
            @manage-items="handleManageItems"
          />
        </div>
        
        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div class="flex flex-1 justify-between sm:hidden">
            <button
              @click="updatePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              @click="updatePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
          <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Menampilkan
                <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span>
                sampai
                <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, totalItems) }}</span>
                dari
                <span class="font-medium">{{ totalItems }}</span>
                hasil
              </p>
            </div>
            <div>
              <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <!-- Previous button -->
                <button
                  @click="updatePage(currentPage - 1)"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <!-- Page numbers -->
                 <template v-for="page in Math.min(totalPages, 7)">
                   <button
                     v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
                     :key="`page-${page}`"
                     @click="updatePage(page)"
                     :class="[
                       'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
                       page === currentPage
                         ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                         : 'text-gray-900'
                     ]"
                   >
                     {{ page }}
                   </button>
                   <span 
                     v-else-if="page === currentPage - 3 || page === currentPage + 3" 
                     :key="`ellipsis-${page}`"
                     class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                   >
                     ...
                   </span>
                 </template>
                
                <!-- Next button -->
                <button
                  @click="updatePage(currentPage + 1)"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <ClipboardDocumentListIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada stock opname</h3>
        <p class="mt-1 text-sm text-gray-500">
          Mulai dengan membuat stock opname pertama Anda.
        </p>
        <PermissionBasedAccess collection="stock_opnames" action="create">
          <div class="mt-6">
            <button
              @click="openAddModal"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon class="w-5 h-5 mr-2" />
              Tambah Stock Opname
            </button>
          </div>
        </PermissionBasedAccess>
      </div>
    </div>
    
    <!-- Modals -->
    <AddStockOpnameModal
      :is-open="showAddModal"
      :is-loading="isSubmitting"
      @close="showAddModal = false"
      @submit="handleAdd"
    />
    
    <EditStockOpnameModal
      :is-open="showEditModal"
      :is-loading="isSubmitting"
      :stock-opname="selectedStockOpname"
      @close="showEditModal = false"
      @submit="handleEdit"
    />
    
    <DetailStockOpnameModal
      :is-open="showDetailModal"
      :stock-opname="selectedStockOpname"
      @close="showDetailModal = false"
      @edit="openEditModal"
      @complete="handleComplete"
      @manage-items="handleManageItems"
    />
    
    <!-- Confirmation Modal -->
    <ConfirmationModal
      :is-open="showDeleteDialog"
      :title="'Hapus Stock Opname'"
      :message="`Apakah Anda yakin ingin menghapus stock opname #${selectedStockOpname?.id}? Tindakan ini tidak dapat dibatalkan.`"
      :confirm-text="'Hapus'"
      :cancel-text="'Batal'"
      :is-loading="isSubmitting"
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />
    
    <ConfirmationModal
      :is-open="showCompleteDialog"
      :title="'Selesaikan Stock Opname'"
      :message="`Apakah Anda yakin ingin menyelesaikan stock opname #${selectedStockOpname?.id}? Setelah diselesaikan, data tidak dapat diubah lagi dan koreksi stok akan diproses otomatis.`"
      :confirm-text="'Selesaikan'"
      :cancel-text="'Batal'"
      :is-loading="isSubmitting"
      @confirm="confirmComplete"
      @cancel="showCompleteDialog = false"
    />
    
    <ManageStockOpnameItemsModal
      :is-open="showManageItemsModal"
      :stock-opname="selectedStockOpname"
      @close="showManageItemsModal = false"
      @refresh="handleItemsRefresh"
    />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Components
import AppLayout from '@/components/layout/AppLayout.vue'
import PermissionBasedAccess from '@/components/ui/PermissionBasedAccess.vue'
import ConfirmationModal from '@/components/ui/ConfirmationModal.vue'
import StockOpnameFilters from '@/components/features/stock-opnames/StockOpnameFilters.vue'
import StockOpnameCard from '@/components/features/stock-opnames/StockOpnameCard.vue'
import AddStockOpnameModal from '@/components/features/stock-opnames/modals/AddStockOpnameModal.vue'
import EditStockOpnameModal from '@/components/features/stock-opnames/modals/EditStockOpnameModal.vue'
import DetailStockOpnameModal from '@/components/features/stock-opnames/modals/DetailStockOpnameModal.vue'
import ManageStockOpnameItemsModal from '@/components/features/stock-opnames/modals/ManageStockOpnameItemsModal.vue'

// Composables
import { useStockOpnames } from '@/composables/useStockOpnames'
import { useNotification } from '@/composables/useNotification'

// Router
const router = useRouter()

// Composables
const { showSuccess, showError } = useNotification()
const {
  stockOpnames,
  isLoading,
  error,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  filters,
  stats,
  loadStockOpnames,
  addStockOpname,
  updateStockOpname,
  deleteStockOpname,
  completeStockOpname,
  updateFilters,
  clearFilters,
  updatePage,
  updateItemsPerPage,
  fetchOpnameDetail
} = useStockOpnames()

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showDeleteDialog = ref(false)
const showCompleteDialog = ref(false)
const showManageItemsModal = ref(false)
const selectedStockOpname = ref(null)
const isSubmitting = ref(false)

// Methods
function openAddModal() {
  showAddModal.value = true
}

async function openDetailModal(opname) {
  // Ambil detail stock opname terlebih dahulu untuk mendapatkan data lengkap termasuk items_opname
  const result = await fetchOpnameDetail(opname.id)
  if (result.success) {
    selectedStockOpname.value = result.data
    showDetailModal.value = true
  } else {
    showError(`Gagal mengambil detail stock opname: ${result.error || 'Unknown error'}`)
  }
}

async function openEditModal(opname) {
  // Pastikan kita memiliki data lengkap termasuk items_opname
  if (!opname.items_opname) {
    const result = await fetchOpnameDetail(opname.id)
    if (result.success) {
      selectedStockOpname.value = result.data
    } else {
      showError(`Gagal mengambil detail stock opname: ${result.error || 'Unknown error'}`)
      return
    }
  } else {
    selectedStockOpname.value = opname
  }
  
  showEditModal.value = true
  showDetailModal.value = false
}

async function handleComplete(opname) {
  // Pastikan kita memiliki data lengkap termasuk items_opname
  if (!opname.items_opname) {
    const result = await fetchOpnameDetail(opname.id)
    if (result.success) {
      selectedStockOpname.value = result.data
    } else {
      showError(`Gagal mengambil detail stock opname: ${result.error || 'Unknown error'}`)
      return
    }
  } else {
    selectedStockOpname.value = opname
  }
  
  showCompleteDialog.value = true
  showDetailModal.value = false
}

async function handleDelete(opname) {
  // Pastikan kita memiliki data lengkap termasuk items_opname
  if (!opname.items_opname) {
    const result = await fetchOpnameDetail(opname.id)
    if (result.success) {
      selectedStockOpname.value = result.data
    } else {
      showError(`Gagal mengambil detail stock opname: ${result.error || 'Unknown error'}`)
      return
    }
  } else {
    selectedStockOpname.value = opname
  }
  
  showDeleteDialog.value = true
}

async function handleManageItems(opname) {
  // Pastikan kita memiliki data lengkap termasuk items_opname
  if (!opname.items_opname) {
    const result = await fetchOpnameDetail(opname.id)
    if (result.success) {
      selectedStockOpname.value = result.data
    } else {
      showError(`Gagal mengambil detail stock opname: ${result.error || 'Unknown error'}`)
      return
    }
  } else {
    selectedStockOpname.value = opname
  }
  
  showManageItemsModal.value = true
  showDetailModal.value = false
}

async function handleItemsRefresh() {
  try {
    // Refresh data stock opname setelah item diperbarui
    await loadStockOpnames()
    showSuccess('Stock opname berhasil diperbarui')
  } catch (error) {
    console.error('Error refreshing stock opname:', error)
    showError('Gagal memperbarui data stock opname')
  }
}

async function handleAdd(data) {
  try {
    isSubmitting.value = true
    // Format data untuk menyesuaikan dengan struktur yang diharapkan API
    const formattedData = {
      tanggal_opname: data.tanggal_opname,
      status: data.status, // Menggunakan field status baru dari Directus
      catatan_keseluruhan: data.catatan_keseluruhan,
      items_opname: []
    }
    await addStockOpname(formattedData)
    showAddModal.value = false
    showSuccess('Stock opname berhasil ditambahkan')
  } catch (error) {
    console.error('Error adding stock opname:', error)
    showError('Gagal menambahkan stock opname')
  } finally {
    isSubmitting.value = false
  }
}

async function handleEdit(data) {
  try {
    isSubmitting.value = true
    // Format data untuk menyesuaikan dengan struktur yang diharapkan API
    const formattedData = {
      tanggal_opname: data.tanggal_opname,
      status: data.status, // Menggunakan field status baru dari Directus
      catatan_keseluruhan: data.catatan_keseluruhan
    }
    await updateStockOpname(data.id, formattedData)
    showEditModal.value = false
    selectedStockOpname.value = null
    showSuccess('Stock opname berhasil diperbarui')
  } catch (error) {
    console.error('Error updating stock opname:', error)
    showError('Gagal memperbarui stock opname')
  } finally {
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  try {
    isSubmitting.value = true
    await deleteStockOpname(selectedStockOpname.value.id)
    showDeleteDialog.value = false
    selectedStockOpname.value = null
    showSuccess('Stock opname berhasil dihapus')
  } catch (error) {
    console.error('Error deleting stock opname:', error)
    showError('Gagal menghapus stock opname')
  } finally {
    isSubmitting.value = false
  }
}

async function confirmComplete() {
  try {
    isSubmitting.value = true
    await completeStockOpname(selectedStockOpname.value.id)
    showCompleteDialog.value = false
    selectedStockOpname.value = null
    showSuccess('Stock opname berhasil diselesaikan')
  } catch (error) {
    console.error('Error completing stock opname:', error)
    showError('Gagal menyelesaikan stock opname')
  } finally {
    isSubmitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadStockOpnames()
})

// Watch for filter changes
watch(
  () => [filters.value, currentPage.value, itemsPerPage.value],
  () => {
    loadStockOpnames()
  },
  { deep: true }
)
</script>