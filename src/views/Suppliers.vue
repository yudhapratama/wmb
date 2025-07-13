<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import Modal from '../components/ui/Modal.vue'
import SupplierForm from '../components/features/suppliers/SupplierForm.vue'
import { useSuppliers } from '../composables/useSuppliers'
import { useOfflineStatus } from '../composables/useOfflineStatus'

// Get offline status
const { isOffline } = useOfflineStatus()

// Use suppliers composable
const {
  isLoading,
  suppliers,
  searchQuery,
  filteredSuppliers,
  loadData,
  addSupplier,
  updateSupplier,
  deleteSupplier
} = useSuppliers()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const currentSupplier = ref(null)

// Form data
const newSupplier = ref({
  nama_pt_toko: '',
  no_telp_pic: '',
  kategori_supplier: '',
  alamat_pt_toko: '',
  status: 'active'
})

// Edit supplier
function editSupplier(supplier) {
  currentSupplier.value = { ...supplier, 
    nama_pt_toko: supplier.nama_pt_toko || '',
    no_telp_pic: supplier.no_telp_pic || '',
    kategori_supplier: supplier.kategori_supplier || '',
    alamat_pt_toko: supplier.alamat_pt_toko || ''
  }
  showEditModal.value = true
}

// Handle add supplier
async function handleAddSupplier() {
  // Konversi ke objek JavaScript biasa terlebih dahulu
  const plainSupplier = JSON.parse(JSON.stringify(newSupplier.value))
  
  const result = await addSupplier(plainSupplier)
  if (result.success) {
    // Reset form and close modal
    newSupplier.value = {
      nama_pt_toko: '',
      no_telp_pic: '',
      kategori_supplier: '',
      alamat_pt_toko: '',
      status: 'active'
    }
    showAddModal.value = false
    showSuccessNotification('Supplier added successfully')
  } else {
    showErrorNotification(`Failed to add supplier: ${result.error || 'Unknown error'}`)
  }
}

// Handle update supplier
async function handleUpdateSupplier() {
  const result = await updateSupplier(currentSupplier.value)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Supplier updated successfully')
  } else {
    showErrorNotification(`Failed to update supplier: ${result.error || 'Unknown error'}`)
  }
}

// Handle delete supplier
async function handleDeleteSupplier(id) {
  if (confirm('Are you sure you want to delete this supplier?')) {
    const result = await deleteSupplier(id)
    if (result.success) {
      showSuccessNotification('Supplier deleted successfully')
    } else {
      showErrorNotification(`Failed to delete supplier: ${result.error || 'Unknown error'}`)
    }
  }
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
    newSupplier.value.nama_pt_toko && 
    newSupplier.value.no_telp_pic
  )
})

const isEditFormValid = computed(() => {
  return (
    currentSupplier.value && 
    currentSupplier.value.nama_pt_toko && 
    currentSupplier.value.no_telp_pic
  )
})

// Initialize
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <AppLayout>
    <!-- Main content -->
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <p class="text-gray-600">Kelola data supplier dan vendor</p>
        </div>
        <button 
          @click="showAddModal = true" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center"
        >
          <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Supplier
        </button>
      </div>
      
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
              You are currently offline. Changes will be synchronized when you're back online.
            </p>
          </div>
        </div>
      </div>

      <!-- Notification -->
      <div 
        v-if="showNotification" 
        :class="[notificationType === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700']"
        class="border-l-4 p-4 mb-6 transition-opacity duration-300"
      >
        <p>{{ notificationMessage }}</p>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search suppliers..."
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500">🔍</span>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center items-center h-48">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Suppliers list -->
      <div v-else-if="filteredSuppliers.length > 0" class="bg-white shadow rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="supplier in filteredSuppliers" :key="supplier.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ supplier.nama_pt_toko }}</div>
                <div class="text-sm text-gray-500 truncate max-w-xs">{{ supplier.alamat_pt_toko }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ supplier.no_telp_pic }}</td>
              <!-- In the table data cells -->
              <td class="px-4 py-2 text-sm">{{ supplier.kategori_supplier }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                >
                  {{ supplier.status === 'active' ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  @click="editSupplier(supplier)" 
                  class="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button 
                  @click="handleDeleteSupplier(supplier.id)" 
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-else class="bg-white rounded-lg shadow p-6 text-center">
        <p class="text-gray-500 mb-4">No suppliers found</p>
        <button 
          @click="showAddModal = true" 
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add your first supplier
        </button>
      </div>

      <!-- Add Supplier Modal -->
      <Modal 
        :isOpen="showAddModal" 
        title="Add New Supplier"
        @close="showAddModal = false"
      >
        <SupplierForm v-model:supplier="newSupplier" :is-loading="isLoading" />
        
        <template #footer>
          <button
            @click="showAddModal = false"
            class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            @click="handleAddSupplier"
            class="px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
            :disabled="isLoading || !isFormValid"
          >
            {{ isLoading ? 'Saving...' : 'Save Supplier' }}
          </button>
        </template>
      </Modal>

      <!-- Edit Supplier Modal -->
      <Modal 
        :isOpen="showEditModal" 
        title="Edit Supplier"
        @close="showEditModal = false"
      >
        <SupplierForm v-if="currentSupplier" v-model:supplier="currentSupplier" :is-loading="isLoading" />
        
        <template #footer>
          <button
            @click="showEditModal = false"
            class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            @click="handleUpdateSupplier"
            class="px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
            :disabled="isLoading || !isEditFormValid"
          >
            {{ isLoading ? 'Saving...' : 'Update Supplier' }}
          </button>
        </template>
      </Modal>
    </div>
  </AppLayout>
</template>