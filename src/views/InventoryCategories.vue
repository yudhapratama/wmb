<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import InventorySidebar from '../components/inventory/InventorySidebar.vue'
import db from '../services/db'
import syncService from '../services/sync'
import { useOfflineStatus } from '../composables/useOfflineStatus'

// Component state
const isLoading = ref(true)
const categories = ref([])
const searchQuery = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const currentCategory = ref(null)

// Form data
const newCategory = ref({
  name: '',
  description: '',
  status: 'active'
})

// Get offline status
const { isOffline } = useOfflineStatus()

// Filtered categories
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  
  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(query) ||
    (category.description && category.description.toLowerCase().includes(query))
  )
})

// Load data
async function loadData() {
  isLoading.value = true
  
  try {
    // Try to sync first if online
    if (syncService.isOnline()) {
      await syncService.pullData('item_categories')
    }
    
    // Load from local database
    categories.value = await db.item_categories.toArray()
  } catch (error) {
    console.error('Error loading categories:', error)
  } finally {
    isLoading.value = false
  }
}

// Add new category
async function addCategory() {
  try {
    // Generate temporary ID for offline mode
    const tempId = Date.now().toString()
    const categoryToAdd = {
      ...newCategory.value,
      id: tempId
    }
    
    // Add to local database
    await db.item_categories.add(categoryToAdd)
    
    // Add to sync queue if offline
    if (!syncService.isOnline()) {
      await db.addToSyncQueue('item_categories', tempId, 'create', categoryToAdd)
    } else {
      // Try to sync immediately if online
      await syncService.processSyncQueue()
    }
    
    // Reset form and close modal
    newCategory.value = {
      name: '',
      description: '',
      status: 'active'
    }
    showAddModal.value = false
    
    // Reload data
    await loadData()
  } catch (error) {
    console.error('Error adding category:', error)
  }
}

// Edit category
function editCategory(category) {
  currentCategory.value = { ...category }
  showEditModal.value = true
}

// Update category
async function updateCategory() {
  try {
    // Update in local database
    await db.item_categories.update(currentCategory.value.id, currentCategory.value)
    
    // Add to sync queue if offline
    if (!syncService.isOnline()) {
      await db.addToSyncQueue('item_categories', currentCategory.value.id, 'update', currentCategory.value)
    } else {
      // Try to sync immediately if online
      await syncService.processSyncQueue()
    }
    
    // Close modal and reload data
    showEditModal.value = false
    await loadData()
  } catch (error) {
    console.error('Error updating category:', error)
  }
}

// Delete category
async function deleteCategory(id) {
  if (!confirm('Are you sure you want to delete this category?')) return
  
  try {
    // Check if category is in use
    const materialsUsingCategory = await db.raw_materials.where('category_id').equals(id).count()
    
    if (materialsUsingCategory > 0) {
      alert(`Cannot delete: This category is used by ${materialsUsingCategory} inventory items.`)
      return
    }
    
    // Mark as deleted in local database
    await db.item_categories.update(id, { status: 'deleted' })
    
    // Add to sync queue if offline
    if (!syncService.isOnline()) {
      await db.addToSyncQueue('item_categories', id, 'delete', {})
    } else {
      // Try to sync immediately if online
      await syncService.processSyncQueue()
    }
    
    // Reload data
    await loadData()
  } catch (error) {
    console.error('Error deleting category:', error)
  }
}

// Initialize
onMounted(() => {
  loadData()
})
</script>

<template>
  <AppLayout>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <InventorySidebar />
      </div>
      
      <!-- Main content -->
      <div class="lg:col-span-3">
        <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 class="text-2xl font-semibold text-gray-900">Inventory Categories</h1>
          
          <div class="mt-4 md:mt-0 flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search categories..."
                class="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div class="absolute left-3 top-2.5 text-gray-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <button
              @click="showAddModal = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Category
            </button>
          </div>
        </div>
        
        <!-- Offline warning -->
        <div v-if="isOffline" class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                You are currently offline. Changes will be synchronized when you reconnect.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Loading state -->
        <div v-if="isLoading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        
        <!-- Categories table -->
        <div v-else class="bg-white shadow rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="filteredCategories.length === 0">
                  <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    No categories found
                  </td>
                </tr>
                <tr v-for="category in filteredCategories" :key="category.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ category.name }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {{ category.description || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800': category.status === 'active',
                        'bg-red-100 text-red-800': category.status === 'inactive',
                        'bg-gray-100 text-gray-800': category.status === 'deleted'
                      }"
                    >
                      {{ category.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="editCategory(category)"
                      class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteCategory(category.id)"
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    
    <!-- Add Modal -->
<div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg shadow-lg w-full max-w-md">
    <div class="p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold">Add New Category</h2>
    </div>
    
    <div class="p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input 
          v-model="newCategory.name" 
          type="text" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter category name"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          v-model="newCategory.description" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows="3"
          placeholder="Enter category description"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select 
          v-model="newCategory.status" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
    
    <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
      <button 
        @click="showAddModal = false" 
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button 
        @click="addCategory" 
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </div>
</div>

<!-- Edit Modal -->
<div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg shadow-lg w-full max-w-md">
    <div class="p-6 border-b border-gray-200">
      <h2 class="text-xl font-bold">Edit Category</h2>
    </div>
    
    <div class="p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input 
          v-model="currentCategory.name" 
          type="text" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter category name"
        >
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          v-model="currentCategory.description" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows="3"
          placeholder="Enter category description"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select 
          v-model="currentCategory.status" 
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
    
    <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
      <button 
        @click="showEditModal = false" 
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button 
        @click="updateCategory" 
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Saving...' : 'Update' }}
      </button>
    </div>
  </div>
</div>
      </div>
    </div>
  </AppLayout>
</template>