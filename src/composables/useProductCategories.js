import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'

export function useProductCategories(autoLoad = true) {
  // State
  const isLoading = ref(true)
  const categories = ref([])
  const searchQuery = ref('')
  const error = ref(null)
  
  // Filtered categories
  const filteredCategories = computed(() => {
    let filtered = [...categories.value]
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(category => 
        category.nama_kategori.toLowerCase().includes(query) ||
        (category.deskripsi && category.deskripsi.toLowerCase().includes(query))
      )
    }
    
    return filtered
  })
  
  // Category options for dropdowns
  const categoryOptions = computed(() => {
    return categories.value.map(category => ({
      id: category.id,
      text: category.nama_kategori,
      value: category.id
    }))
  })
  
  // Add new category
  async function addCategory(categoryData) {
    isLoading.value = true
    error.value = null
    
    try {
      // Prepare category data
      const category = {
        nama_kategori: categoryData.nama_kategori,
        deskripsi: categoryData.deskripsi || '',
        date_created: new Date().toISOString(),
        sync_status: 'pending'
      }
      
      // Add to local database first
      const id = await db.product_categories.add(category)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('product_categories', id, 'create', category)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('product_categories', id, 'create', category)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, id }
    } catch (err) {
      console.error('Error adding product category:', err)
      error.value = `Failed to add category: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update existing category
  async function updateCategory(categoryData) {
    isLoading.value = true
    error.value = null
    
    try {
      // Prepare updated data
      const updatedCategory = {
        ...categoryData,
        date_updated: new Date().toISOString(),
        sync_status: 'pending'
      }
      
      // Update in local database first
      await db.product_categories.update(categoryData.id, updatedCategory)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('product_categories', categoryData.id, 'update', updatedCategory)
        const syncResult = await syncService.processSyncQueue()
        if (!syncResult.success) {
          throw new Error(`Sync failed: ${syncResult.message}`)
        }
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('product_categories', categoryData.id, 'update', updatedCategory)
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating product category:', err)
      error.value = `Failed to update category: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete category
  async function deleteCategory(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Check if category is being used by any products
      const productsUsingCategory = await db.products
        .where('kategori')
        .equals(id)
        .count()
      
      if (productsUsingCategory > 0) {
        throw new Error(`Cannot delete category. It is being used by ${productsUsingCategory} product(s).`)
      }
      
      // Delete from local database first
      await db.product_categories.delete(id)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('product_categories', id, 'delete', { id })
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('product_categories', id, 'delete', { id })
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting product category:', err)
      error.value = err.message || 'Failed to delete category'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Load data
  async function loadData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Try to sync first if online
      if (syncService.isOnline()) {
        await syncService.pullData('product_categories')
      }
      
      // Load from local database
      categories.value = await db.product_categories.toArray()
    } catch (err) {
      console.error('Error loading product categories:', err)
      error.value = 'Failed to load product categories'
    } finally {
      isLoading.value = false
    }
  }
  
  // Get category name by ID
  function getCategoryName(categoryId) {
    const category = categories.value.find(c => c.id === categoryId)
    return category ? category.nama_kategori : 'Uncategorized'
  }
  
  // Auto-load data when composable is used
  if (autoLoad) {
    loadData()
  }
  
  return {
    // State
    isLoading,
    categories,
    searchQuery,
    filteredCategories,
    categoryOptions,
    error,
    
    // Methods
    loadData,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryName
  }
}