<template>
<AppLayout title="Stock Opnames">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div class="">
        <h1 class="text-2xl font-bold text-gray-900">Stock Opnames</h1>
        <p class="mt-1 text-sm text-gray-600">
          Kelola stock opname untuk mencocokkan stok sistem dengan stok fisik
        </p>
      </div>
      <!-- Add Button -->
      <div class="w-full sm:w-auto flex justify-center sm:justify-end">
        <PermissionBasedAccess collection="stock_opnames" action="create">
          <button
            @click="openAddModal"
            class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PlusIcon class="w-5 h-5 mr-2" />
            Tambah Stock Opname
          </button>
        </PermissionBasedAccess>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1">
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
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats.total || 0) }}</p>
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
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats.draft || 0) }}</p>
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
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats.completed || 0) }}</p>
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
              <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stats.thisMonth || 0) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6">
      <DatatablesVue
        :data="stockOpnames"
        :loading="isLoading"
        :defaultItemsPerPage="defaultItemsPerPage"
        @page-change="onPageChange"
        @items-per-page-change="onItemsPerPageChange"
      >
        <template #thead>
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Pencatat</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Jumlah Item</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Catatan</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Tanggal Opname</th>
            <!-- <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Terakhir diperbarui</th> -->
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
          </tr>
        </template>

        <template #tbody="{ data }">
          <tr v-for="(opname, idx) in data" :key="opname.id" class="hover:bg-gray-50" :class="getStatusBadgeClass(opname.status)">
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ ((currentPage - 1) * defaultItemsPerPage) + idx + 1 }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <span :class="getStatusBadgeClass(opname.status)">
                {{ opname.status || 'Draft' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ opname.dicatat_oleh_name || opname.dicatat_oleh?.first_name || 'Admin' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ formatNumber(opname.items_opname?.length || 0) }} item
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 leading-relaxed">
              {{ opname.catatan_keseluruhan }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ formatDateTimeIndonesian(opname.tanggal_opname, false) || '-' }}
            </td>
            <!-- <td class="px-4 py-3 text-sm text-gray-700">
              <div v-if="opname.date_updated && opname.date_updated !== opname.date_created" class="flex items-center text-sm">
                <ClockIcon class="w-4 h-4 text-gray-400 mr-2" />
                <span class="ml-1 text-gray-900">
                  {{ formatDateTime(opname.date_updated) }}
                </span>
              </div>
            </td> -->
            <td>
              <div class="flex justify-between items-center border-t border-gray-100">
                <!-- View Details Button -->
                <button @click="openDetailModal(opname)" class="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm">
                  <EyeIcon class="w-4 h-4" />
                  Detail
                </button>
                
                <!-- Action Buttons (right side) -->
                <div class="flex space-x-2">
                  <!-- Manage Items (only for Draft status) -->
                  <PermissionBasedAccess collection="stock_opnames" action="update">
                    <button
                      v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
                      @click="handleManageItems(opname)"
                      class="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                      title="Kelola Item"
                    >
                      <ClipboardDocumentListIcon class="w-4 h-4" />
                    </button>
                  </PermissionBasedAccess>
                  
                  <!-- Edit (only for Draft status) -->
                  <PermissionBasedAccess collection="stock_opnames" action="update">
                    <button v-if="!opname.status || opname.status.toLowerCase() === 'draft'" @click="openEditModal(opname)" class="p-2 text-green-600 hover:bg-green-50 rounded-md" title="Edit">
                      <PencilIcon class="w-4 h-4" />
                    </button>
                  </PermissionBasedAccess>
                  
                  <!-- Complete (only for Draft status) -->
                  <PermissionBasedAccess collection="stock_opnames" action="update">
                    <button
                      v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
                      @click="handleComplete(opname)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Selesaikan"
                    >
                      <CheckIcon class="w-4 h-4" />
                    </button>
                  </PermissionBasedAccess>
                  
                  <!-- Delete (only for Draft status) -->
                  <PermissionBasedAccess collection="stock_opnames" action="delete">
                    <button
                      v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
                      @click="handleDelete(opname)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Hapus"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </PermissionBasedAccess>
                </div>
              </div>
            </td>
          </tr>
        </template>

        <template #empty>
          <div class="text-center py-12">
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
        </template>
      </DatatablesVue>
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
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon
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
import { formatDateTimeIndonesian, formatDateTime, formatNumber } from '../utils/helpers'
// Composables
import { useStockOpnames } from '@/composables/useStockOpnames'
import { useNotification } from '@/composables/useNotification'
import DatatablesVue from './Datatables.vue'
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
function getStatusBadgeClass(status) {
  const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium'
  
  // Default to Draft if no status
  const currentStatus = status || 'Draft'
  
  switch (currentStatus.toLowerCase()) {
    case 'draft':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'selesai':
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'dibatalkan':
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}
const defaultItemsPerPage = ref(10)
function onPageChange(page) {
  currentPage.value = page;
}

function onItemsPerPageChange(limit) {
  defaultItemsPerPage.value = limit;
  currentPage.value = 1;
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
