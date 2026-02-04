<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import SupplierDetailModal from '../components/features/suppliers/modals/SupplierDetailModal.vue'
import AddSupplierModal from '../components/features/suppliers/modals/AddSupplierModal.vue'
import EditSupplierModal from '../components/features/suppliers/modals/EditSupplierModal.vue'
import SupplierMaterialModal from '../components/features/suppliers/modals/SupplierMaterialModal.vue'
import SuppliersFilters from '../components/features/suppliers/SuppliersFilters.vue'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import { useSuppliers } from '../composables/useSuppliers'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import DatatablesVue from './Datatables.vue'
// Get offline status
const { isOffline } = useOfflineStatus()

// Use suppliers composable
const {
  isLoading,
  suppliers,
  searchQuery,
  filteredSuppliers: baseFilteredSuppliers,
  loadData,
  addSupplier,
  updateSupplier,
  deleteSupplier
} = useSuppliers()

// Add filter state
const selectedCategory = ref('all')

// Update filtered suppliers to include category filter
const filteredSuppliers = computed(() => {
  let filtered = baseFilteredSuppliers.value
  
  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(supplier => 
      supplier.kategori_supplier === selectedCategory.value
    )
  }
  
  return filtered
})

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showMaterialModal = ref(false)
const isConfirmDeleteOpen = ref(false)
const currentSupplier = ref(null)
const supplierToDelete = ref(null)

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// Load data on mount
onMounted(async () => {
  await loadData()
})

// View supplier details
function viewSupplierDetails(supplier) {
  currentSupplier.value = { ...supplier }
  showDetailModal.value = true
}

// Edit supplier
function editSupplier(supplier) {
  currentSupplier.value = { ...supplier }
  showDetailModal.value = false
  showEditModal.value = true
}

// Assign materials to supplier
function assignMaterials(supplier) {
  currentSupplier.value = { ...supplier }
  showDetailModal.value = false
  showMaterialModal.value = true
}

// Confirm delete supplier
function handleDeleteSupplier(supplier) {
  supplierToDelete.value = supplier
  isConfirmDeleteOpen.value = true
}

// Delete supplier
async function confirmDeleteSupplier() {
  if (supplierToDelete.value) {
    const result = await deleteSupplier(supplierToDelete.value.id)
    if (result.success) {
      isConfirmDeleteOpen.value = false
      supplierToDelete.value = null
      showSuccessNotification('Supplier berhasil dihapus')
    } else {
      showErrorNotification(`Gagal menghapus supplier: ${result.error || 'Unknown error'}`)
    }
  }
}

// Handle add supplier
async function handleAddSupplier(newSupplier) {
  const result = await addSupplier(newSupplier)
  if (result.success) {
    showAddModal.value = false
    showSuccessNotification('Supplier added successfully')
  } else {
    showErrorNotification(`Failed to add supplier: ${result.error || 'Unknown error'}`)
  }
}

// Handle update supplier
async function handleUpdateSupplier(updatedSupplier) {
  const result = await updateSupplier(updatedSupplier)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Supplier updated successfully')
  } else {
    showErrorNotification(`Failed to update supplier: ${result.error || 'Unknown error'}`)
  }
}

// Handle material assignment update
async function handleMaterialAssignmentSaved(updatedSupplier) {
  // Refresh the suppliers data to show updated assignments
  await loadData()
  showSuccessNotification('Material assignments updated successfully')
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

const getStatusConfig = (status) => {
  if (status === 'active') {
    return {
      color: 'text-green-600',
      bg: 'bg-green-100',
      badgeColor: 'bg-green-100 text-green-600'
    }
  }

  return {
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    badgeColor: 'bg-gray-100 text-gray-600'
  }
}
const defaultItemsPerPage = ref(10)
const currentPage = ref(1);
function onPageChange(page) {
  currentPage.value = page;
}

function onItemsPerPageChange(limit) {
  defaultItemsPerPage.value = limit;
  currentPage.value = 1;
}
</script>

<template>
  <AppLayout title="Supplier Management">
    <!-- Offline Warning -->
    <div v-if="isOffline" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div class="flex">
        <svg class="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77 .833.192 2.5 1.732 2.5z" />
        </svg>
        <div class="ml-3">
          <p class="text-sm text-yellow-800">
            You are currently offline. Changes will be synced when connection is restored.
          </p>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Supplier Management</h1>
        <p class="text-gray-600">Kelola data supplier dan vendor</p>
      </div>
      <div class="w-full sm:w-auto flex justify-center sm:justify-end">
        <PermissionBasedAccess collection="suppliers" action="create">
          <button
            @click="showAddModal = true"
            class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Supplier
          </button>
        </PermissionBasedAccess>
      </div>
    </div>
    
    <!-- Filters -->
    <SuppliersFilters
      :suppliers="suppliers"
      :selectedCategory="selectedCategory"
      @update:selectedCategory="selectedCategory = $event"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
    />
    
    <!-- Supplier Cards -->
    <div class="mt-6 grid grid-cols-1 gap-6">
      <DatatablesVue
        :data="filteredSuppliers"
        :loading="isLoading"
        :defaultItemsPerPage="defaultItemsPerPage"
        @page-change="onPageChange"
        @items-per-page-change="onItemsPerPageChange"
      >
        <template #thead>
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama Toko</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">No Telepon</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Kategori</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Alamat</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
          </tr>
        </template>

        <template #tbody="{ data }">
          <tr v-for="(supplier, idx) in data" :key="supplier.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ ((currentPage - 1) * defaultItemsPerPage) + idx + 1 }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <div class="flex gap-2 items-center">
                <div :class="getStatusConfig(supplier.status).bg" class="p-2 rounded-lg">
                  <svg class="w-5 h-5" :class="getStatusConfig(supplier.status).color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                {{ supplier.nama_pt_toko }}
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <span :class="getStatusConfig(supplier.status).badgeColor" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ supplier.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <div class="flex items-center gap-1 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ supplier.no_telp_pic || 'No contact' }}
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ supplier.kategori_supplier || 'Tidak ada kategori' }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <div class="flex items-center gap-1 mt-1 text-sm text-gray-500" v-if="supplier.alamat_pt_toko">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="truncate max-w-xs">{{ supplier.alamat_pt_toko }}</span>
              </div>
            </td>
            <td>
              <div class="flex gap-2">
                <button 
                  @click="viewSupplierDetails(supplier)"
                  class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
                  title="View Details"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <PermissionBasedAccess collection="suppliers" action="update">
                  <button 
                    @click="assignMaterials(supplier)"
                    class="p-2.5 border border-gray-300 rounded-md text-purple-600 hover:bg-purple-50"
                    title="Assign Raw Materials"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </button>
                </PermissionBasedAccess>
                <PermissionBasedAccess collection="suppliers" action="update">
                  <button 
                    @click="editSupplier(supplier)"
                    class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
                    title="Edit Supplier"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </PermissionBasedAccess>
                <PermissionBasedAccess collection="suppliers" action="delete">
                  <button 
                    @click="handleDeleteSupplier(supplier)"
                    class="p-2.5 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
                    title="Delete Supplier"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </PermissionBasedAccess>
              </div>
            </td>
          </tr>
        </template>

        <template #empty>
          <div class="col-span-full text-center py-12">
            <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p class="mt-2 text-gray-600">No suppliers found.</p>
            <PermissionBasedAccess collection="suppliers" action="create">
              <button
                @click="showAddModal = true"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Supplier
              </button>
            </PermissionBasedAccess>
          </div>
        </template>
      </DatatablesVue>
    </div>
    
    <!-- Modals -->
    <AddSupplierModal
      :isOpen="showAddModal"
      :isLoading="isLoading"
      @close="showAddModal = false"
      @submit="handleAddSupplier"
    />
    
    <EditSupplierModal
      :isOpen="showEditModal"
      :supplier="currentSupplier"
      :isLoading="isLoading"
      @close="showEditModal = false"
      @submit="handleUpdateSupplier"
    />
    
    <SupplierDetailModal
      :isOpen="showDetailModal"
      :supplier="currentSupplier"
      @close="showDetailModal = false"
      @edit="editSupplier"
      @assignMaterials="assignMaterials"
    />
    
    <SupplierMaterialModal
      :isOpen="showMaterialModal"
      :supplier="currentSupplier"
      @close="showMaterialModal = false"
      @saved="handleMaterialAssignmentSaved"
    />
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="isConfirmDeleteOpen"
      title="Hapus Supplier"
      message="Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan."
      @confirm="confirmDeleteSupplier"
      @cancel="isConfirmDeleteOpen = false"
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
