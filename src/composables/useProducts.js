import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'
// Tambahkan import useRecipeItems untuk cascade delete
import { useRecipeItems } from './useRecipeItems'

export function useProducts() {
  // State
  const isLoading = ref(true)
  const products = ref([])
  const categories = ref([])
  const searchQuery = ref('')
  const selectedCategory = ref('all')
  // Tambahkan filter yang hilang
  const selectedType = ref('all')
  const selectedConsignment = ref('all')
  const error = ref(null)
  
  // Initialize useRecipeItems for cascade delete
  const { deleteRecipeItemsByProduct } = useRecipeItems(false)
  
  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [10, 25, 50, 100]
  
  // Date filter state
  const dateFilter = ref({
    startDate: '',
    endDate: '',
    dateField: 'date_created' // 'date_created' or 'date_updated'
  })
  
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
      filtered = filtered.filter(product => {
        // Convert selectedCategory to number for comparison
        const categoryId = parseInt(selectedCategory.value)
        return product.kategori?.id === categoryId
      })
    }
    
    // Filter by product type
    if (selectedType.value !== 'all') {
      const typeMap = {
        'basic': 'Basic Product',
        'recipe': 'Recipe-based Product'
      }
      filtered = filtered.filter(product => 
        product.tipe_produk === typeMap[selectedType.value]
      )
    }
    
    // Filter by consignment status
    if (selectedConsignment.value !== 'all') {
      const isConsignment = selectedConsignment.value === 'true'
      filtered = filtered.filter(product => 
        Boolean(product.konsinyasi) === isConsignment
      )
    }
    
    // Filter by date range
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      filtered = filtered.filter(product => {
        const productDate = new Date(product[dateFilter.value.dateField])
        const startDate = dateFilter.value.startDate ? new Date(dateFilter.value.startDate) : null
        const endDate = dateFilter.value.endDate ? new Date(dateFilter.value.endDate) : null
        
        if (startDate && endDate) {
          return productDate >= startDate && productDate <= endDate
        } else if (startDate) {
          return productDate >= startDate
        } else if (endDate) {
          return productDate <= endDate
        }
        return true
      })
    }
    
    return filtered
  })
  
  // Paginated products
  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredProducts.value.slice(start, end)
  })
  
  // Total pages
  const totalPages = computed(() => {
    return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
  })
  
  // Pagination info
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(start + itemsPerPage.value - 1, filteredProducts.value.length)
    const total = filteredProducts.value.length
    
    return {
      start,
      end,
      total,
      currentPage: currentPage.value,
      totalPages: totalPages.value
    }
  })
  
  // Reset pagination when filters change
  function resetPagination() {
    currentPage.value = 1
  }
  
  // Change page
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  // Change items per page
  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage.value = newItemsPerPage
    resetPagination()
  }
  
  // Update date filter
  function updateDateFilter(newDateFilter) {
    dateFilter.value = { ...dateFilter.value, ...newDateFilter }
    resetPagination()
  }
  
  // Get category name by ID
  function getCategoryName(categoryId) {
    const category = categories.value.find(c => c.id === categoryId)
    return category ? category.name : 'Uncategorized'
  }
  
  // Add new product
  async function addProduct(product) {
    isLoading.value = true
    error.value = null
    
    try {
      // Create a plain object to avoid DataCloneError
      const plainProduct = JSON.parse(JSON.stringify(product))
      console.log(plainProduct)
      // Add to local database first
      const id = await db.products.add(plainProduct)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('products', id, 'create', plainProduct)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('products', id, 'create', plainProduct)
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
    console.log(product, 'updateProduct')
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
  
  // Delete product with cascade delete
  async function deleteProduct(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // 1. First, delete related recipe_items (cascade delete)
      const recipeDeleteResult = await deleteRecipeItemsByProduct(id)
      if (!recipeDeleteResult.success) {
        console.warn('Failed to delete recipe items:', recipeDeleteResult.error)
        // Continue with product deletion even if recipe items deletion fails
      }
      
      // 2. Delete the product from local database
      await db.products.delete(id)
      
      // 3. If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('products', id, 'delete', { id })
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('products', id, 'delete', { id })
      }
      
      // 4. Reload data
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
    selectedType,
    selectedConsignment,
    filteredProducts,
    paginatedProducts,
    error,
    
    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    paginationInfo,
    changePage,
    changeItemsPerPage,
    resetPagination,
    
    // Date filter
    dateFilter,
    updateDateFilter,
    
    // Methods
    loadData,
    getCategoryName,
    addProduct,
    updateProduct,
    deleteProduct
  }
}