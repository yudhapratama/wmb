import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'

export function useProducts() {
  // State
  const isLoading = ref(true)
  const products = ref([])
  const categories = ref([])
  const searchQuery = ref('')
  const selectedCategory = ref('all')
  const error = ref(null)
  
  // Filtered products
  const filteredProducts = computed(() => {
    let filtered = [...products.value]
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(product => 
        product.nama_produk.toLowerCase().includes(query)
      )
    }
    
    // Filter by category
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(product => 
        product.kategori?.id === selectedCategory.value
      )
    }
    
    return filtered
  })
  
  // Add new product
  async function addProduct(product) {
    isLoading.value = true
    error.value = null
    
    try {
      // Add to local database first
      const id = await db.products.add(product)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('products', id, 'create', product)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('products', id, 'create', product)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, id }
    } catch (err) {
      console.error('Error adding product:', err)
      error.value = `Failed to add product: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update existing product
  async function updateProduct(product) {
    isLoading.value = true
    error.value = null
    
    try {
      // Update in local database first
      await db.products.update(product.id, product)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('products', product.id, 'update', product)
        const syncResult = await syncService.processSyncQueue()
        if (!syncResult.success) {
          throw new Error(`Sync failed: ${syncResult.message}`)
        }
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('products', product.id, 'update', product)
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating product:', err)
      error.value = `Failed to update product: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete product
  async function deleteProduct(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Delete from local database first
      await db.products.delete(id)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('products', id, 'delete', { id })
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('products', id, 'delete', { id })
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting product:', err)
      error.value = 'Failed to delete product'
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
        await syncService.pullData('products')
        await syncService.pullData('product_categories')
      }
      
      // Load from local database
      products.value = await db.products.toArray()
      categories.value = await db.product_categories.toArray()
    } catch (err) {
      console.error('Error loading product data:', err)
      error.value = 'Failed to load product data'
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    // State
    isLoading,
    products,
    categories,
    searchQuery,
    selectedCategory,
    filteredProducts,
    error,
    
    // Methods
    loadData,
    addProduct,
    updateProduct,
    deleteProduct
  }
}