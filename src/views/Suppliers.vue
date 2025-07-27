<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import SupplierCard from '../components/features/suppliers/SupplierCard.vue'
import SupplierDetailModal from '../components/features/suppliers/modals/SupplierDetailModal.vue'
import AddSupplierModal from '../components/features/suppliers/modals/AddSupplierModal.vue'
import EditSupplierModal from '../components/features/suppliers/modals/EditSupplierModal.vue'
import SuppliersFilters from '../components/features/suppliers/SuppliersFilters.vue'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'
import { useSuppliers } from '../composables/useSuppliers'
import { useOfflineStatus } from '../composables/useOfflineStatus'

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
const currentSupplier = ref(null)

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

// Handle delete supplier
async function handleDeleteSupplier(supplier) {
  if (confirm(`Are you sure you want to delete supplier "${supplier.nama_pt_toko}"?`)) {
    const result = await deleteSupplier(supplier.id)
    if (result.success) {
      showSuccessNotification('Supplier deleted successfully')
    } else {
      showErrorNotification(`Failed to delete supplier: ${result.error || 'Unknown error'}`)
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
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Supplier Management</h1>
        <p class="text-gray-600">Kelola data supplier dan vendor</p>
      </div>
      <PermissionBasedAccess collection="suppliers" action="create">
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Supplier
        </button>
      </PermissionBasedAccess>
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
      <div v-if="isLoading" class="col-span-full text-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Loading suppliers...</p>
      </div>
      
      <div v-else-if="filteredSuppliers.length === 0" class="col-span-full text-center py-12">
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
      
      <SupplierCard
        v-for="supplier in filteredSuppliers"
        :key="supplier.id"
        :supplier="supplier"
        @view="viewSupplierDetails"
        @edit="editSupplier"
        @delete="handleDeleteSupplier"
      />
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