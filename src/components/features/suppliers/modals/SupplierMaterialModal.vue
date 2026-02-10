<template>
  <Modal :isOpen="isOpen" @close="$emit('close')" title="Assign Raw Materials" size="xl">
    <div class="space-y-6">
      <!-- Supplier Info -->
      <div v-if="supplier" class="bg-gray-50 p-4 rounded-lg">
        <h3 class="font-medium text-gray-900">{{ supplier.nama_pt_toko }}</h3>
        <p class="text-sm text-gray-600">{{ supplier.kategori_supplier || 'No category' }}</p>
      </div>

      <!-- Search Raw Materials -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Search Raw Materials
        </label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search materials..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Materials Side by Side -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Available Materials -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Available Materials
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {{ filteredAvailableMaterials.length }}
            </span>
          </h4>
          <div class="max-h-80 overflow-y-auto border border-gray-200 rounded-md bg-white">
            <div v-if="filteredAvailableMaterials.length === 0" class="p-6 text-center text-gray-500">
              <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p class="text-sm">No materials available</p>
            </div>
            <div v-else>
              <div
                v-for="material in filteredAvailableMaterials"
                :key="material.id"
                class="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-blue-50 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{{ material.nama_item }}</p>
                  <p class="text-sm text-gray-600 truncate">{{ material.kategori || 'No category' }}</p>
                </div>
                <button
                  @click="assignMaterial(material)"
                  class="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                  title="Assign to supplier"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Assigned Materials -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Assigned Materials
            <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {{ assignedMaterials.length }}
            </span>
          </h4>
          <div class="max-h-80 overflow-y-auto border border-gray-200 rounded-md bg-white">
            <div v-if="assignedMaterials.length === 0" class="p-6 text-center text-gray-500">
              <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p class="text-sm">No materials assigned</p>
            </div>
            <div v-else>
              <div
                v-for="material in assignedMaterials"
                :key="material.id"
                class="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-red-50 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{{ material.nama_item }}</p>
                  <p class="text-sm text-gray-600 truncate">{{ material.kategori || 'No category' }}</p>
                </div>
                <button
                  @click="removeMaterial(material)"
                  class="ml-3 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                  title="Remove from supplier"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="saveAssignments"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </Modal>

  <!-- Notification -->
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Modal from '../../../ui/Modal.vue'
import { useInventory } from '../../../../composables/useInventory'
import { useSuppliers } from '../../../../composables/useSuppliers'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

// Use inventory composable to get raw materials
const { rawMaterials, loadData } = useInventory()
// Use suppliers composable for updating supplier data
const { updateSupplier } = useSuppliers()

// Local state
const searchQuery = ref('')
const assignedMaterials = ref([])
const isLoading = ref(false)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// Parse assigned materials from supplier data
function parseAssignedMaterials() {
  if (!props.supplier?.assignee_raw_materials) {
    assignedMaterials.value = []
    return
  }

  try {
    let assignedIds = []
    
    // Handle different data formats
    if (typeof props.supplier.assignee_raw_materials === 'string') {
      assignedIds = JSON.parse(props.supplier.assignee_raw_materials)
    } else if (Array.isArray(props.supplier.assignee_raw_materials)) {
      assignedIds = props.supplier.assignee_raw_materials
    }

    // Filter raw materials to get assigned ones
    assignedMaterials.value = rawMaterials.value.filter(material => 
      assignedIds.includes(material.id)
    )
  } catch (error) {
    console.error('Error parsing assigned materials:', error)
    assignedMaterials.value = []
  }
}

// Computed properties
const filteredAvailableMaterials = computed(() => {
  const assignedIds = assignedMaterials.value.map(m => m.id)
  let available = rawMaterials.value.filter(material => !assignedIds.includes(material.id))
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    available = available.filter(material =>
      (material.nama_item && typeof material.nama_item === 'string' && material.nama_item.toLowerCase().includes(query)) ||
      (material.kategori && typeof material.kategori === 'string' && material.kategori.toLowerCase().includes(query))
    )
  }
  
  return available
})

// Methods
function assignMaterial(material) {
  if (!assignedMaterials.value.find(m => m.id === material.id)) {
    assignedMaterials.value.push(material)
  }
}

function removeMaterial(material) {
  const index = assignedMaterials.value.findIndex(m => m.id === material.id)
  if (index > -1) {
    assignedMaterials.value.splice(index, 1)
  }
}

async function saveAssignments() {
  isLoading.value = true
  
  try {
    const assignedIds = assignedMaterials.value.map(m => m.id)
    
    const updatedSupplier = {
      ...props.supplier,
      assignee_raw_materials: JSON.stringify(assignedIds)
    }
    
    // Save to database using the suppliers composable
    const result = await updateSupplier(updatedSupplier)
    
    if (result.success) {
      showSuccessNotification('Material assignments updated successfully')
      // Emit saved event to parent to refresh data
      emit('saved', updatedSupplier)
      // Close modal after successful save
      setTimeout(() => {
        emit('close')
      }, 1500)
    } else {
      showErrorNotification(`Failed to update assignments: ${result.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error saving assignments:', error)
    showErrorNotification('Failed to save material assignments')
  } finally {
    isLoading.value = false
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

// Watch for supplier changes
watch(() => props.supplier, () => {
  if (props.supplier) {
    parseAssignedMaterials()
  }
}, { immediate: true })

// Watch for modal open/close
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    if (rawMaterials.value.length === 0) {
      loadData()
    }
    parseAssignedMaterials()
  }
})

// Load data on mount
onMounted(() => {
  loadData()
})
</script>