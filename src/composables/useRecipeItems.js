import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'
import { useCookedItems } from './useCookedItems'
import api from '../services/api' // ✅ Tambahkan import api yang hilang

export function useRecipeItems(autoLoad = true) {
  // Get cooked items data
  const { cookedItems } = useCookedItems(false)
  
  // State
  const isLoading = ref(true)
  const recipeItems = ref([])
  const rawMaterials = ref([])
  const products = ref([])
  const error = ref(null)
  
  // Get recipe items for a specific product
  const getRecipeItemsByProduct = computed(() => {
    return (productId) => {
      return recipeItems.value.filter(item => item.products_id === productId) // ✅ Ubah dari product_id ke products_id
    }
  })
  
  // Get recipe items with cooked items details
  const getRecipeItemsWithDetails = computed(() => {
    return (productId) => {
      return recipeItems.value
        .filter(item => item.products_id === productId) // ✅ Ubah dari product_id ke products_id
        .map(item => {
          const cookedItem = cookedItems.value.find(ci => ci.id === item.cooked_items_id) // ✅ Ubah ke cooked_items
          return {
            ...item,
            cooked_item: cookedItem || { id: item.cooked_items_id, name: 'Unknown' }
          }
        })
    }
  })
  
  // Calculate total cost for a product recipe
  const calculateRecipeCost = computed(() => {
    return (productId) => {
      const items = recipeItems.value.filter(item => item.products_id === productId) // ✅ Ubah dari product_id ke products_id
      return items.reduce((total, item) => {
        const cookedItem = cookedItems.value.find(ci => ci.id === item.cooked_items_id) // ✅ Ubah ke cooked_items
        const itemCost = cookedItem?.harga_pokok_per_unit || 0
        return total + (itemCost * item.quantity) // ✅ Ubah dari jumlah_dibutuhkan ke quantity sesuai schema
      }, 0)
    }
  })
  
  // ✅ Tambahkan computed totalCost
  const totalCost = computed(() => {
    if (recipeItems.value.length === 0) return 0
    
    return recipeItems.value.reduce((total, item) => {
      const cookedItem = cookedItems.value.find(ci => ci.id === item.cooked_items_id)
      const itemCost = cookedItem?.harga_pokok_per_unit || 0
      return total + (itemCost * item.quantity)
    }, 0)
  })
  
  // Add recipe items for a product
  async function addRecipeItems(productId, recipeItemsData) {
    isLoading.value = true
    error.value = null
    
    try {
      const itemsToAdd = recipeItemsData.map(item => ({
        products_id: productId, // ✅ Ubah dari product_id ke products_id
        cooked_items_id: item.cooked_items_id,
        quantity: item.jumlah_dibutuhkan, // ✅ Ubah dari item.quantity ke item.jumlah_dibutuhkan
        date_created: new Date().toISOString(),
        sync_status: 'pending'
      }))
      
      // Add to local database first
      await db.recipe_items.bulkAdd(itemsToAdd)
      
      // Get the added items to get their IDs
      const addedItems = await db.recipe_items
        .where('products_id') // ✅ Ubah dari product_id ke products_id
        .equals(productId)
        .and(item => item.sync_status === 'pending')
        .toArray()
      
      // If online, sync to server
      if (syncService.isOnline()) {
        for (const item of addedItems) {
          await db.addToSyncQueue('recipe_items', item.id, 'create', {
            products_id: item.products_id, // ✅ Ubah dari product_id ke products_id
            cooked_items_id: item.cooked_items_id,
            quantity: item.quantity // ✅ Ubah dari jumlah_dibutuhkan ke quantity
          })
        }
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        for (const item of addedItems) {
          await db.addToSyncQueue('recipe_items', item.id, 'create', {
            products_id: item.products_id, // ✅ Ubah dari product_id ke products_id
            cooked_items_id: item.cooked_items_id,
            quantity: item.quantity // ✅ Ubah dari jumlah_dibutuhkan ke quantity
          })
        }
      }
      
      // Reload data
      await loadData()
      
      return { success: true, items: addedItems }
    } catch (err) {
      console.error('Error adding recipe items:', err)
      error.value = `Failed to add recipe items: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update recipe items for a product (replace all)
  async function updateRecipeItems(productId, recipeItemsData) {
    isLoading.value = true
    error.value = null
    
    try {
      // First, delete existing recipe items for this product
      await deleteRecipeItemsByProduct(productId)
      
      // Then add new recipe items
      const result = await addRecipeItems(productId, recipeItemsData)
      
      return result
    } catch (err) {
      console.error('Error updating recipe items:', err)
      error.value = `Failed to update recipe items: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete all recipe items for a product
  async function deleteRecipeItemsByProduct(productId) {
    isLoading.value = true
    error.value = null
    
    try {
      // Get existing recipe items for this product
      const existingItems = await db.recipe_items
        .where('products_id') // ✅ Ubah dari product_id ke products_id
        .equals(productId)
        .toArray()
      
      // Delete from local database
      await db.recipe_items
        .where('products_id') // ✅ Ubah dari product_id ke products_id
        .equals(productId)
        .delete()
      
      // If online, sync deletions to server
      if (syncService.isOnline()) {
        for (const item of existingItems) {
          await db.addToSyncQueue('recipe_items', item.id, 'delete', { id: item.id })
        }
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        for (const item of existingItems) {
          await db.addToSyncQueue('recipe_items', item.id, 'delete', { id: item.id })
        }
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting recipe items:', err)
      error.value = `Failed to delete recipe items: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete a specific recipe item
  async function deleteRecipeItem(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Delete from local database
      await db.recipe_items.delete(id)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('recipe_items', id, 'delete', { id })
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('recipe_items', id, 'delete', { id })
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting recipe item:', err)
      error.value = `Failed to delete recipe item: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Load data
  async function loadData() {
    try {
      isLoading.value = true
      
      if (navigator.onLine) {
        // ✅ Load dari API dengan cooked_items relation
        const response = await api.get('/items/recipe_items?fields=*,cooked_items_id.*')
        const apiData = response.data?.data || []
        
        // Cache to local storage
        await db.recipe_items.clear()
        await db.recipe_items.bulkAdd(apiData.map(item => ({
          id: item.id,
          products_id: item.products_id, // ✅ Ubah dari product_id ke products_id
          cooked_items_id: typeof item.cooked_items_id === 'object' ? item.cooked_items_id?.id : item.cooked_items_id,
          quantity: item.quantity, // ✅ Ubah dari jumlah_dibutuhkan ke quantity
          date_created: item.date_created,
          cached_at: new Date().getTime()
        })))
        
        recipeItems.value = apiData
      } else {
        // Load from local storage
        const localData = await db.recipe_items.toArray()
        recipeItems.value = localData
      }
    } catch (error) {
      console.error('Error loading recipe items:', error)
      // Fallback to local storage
      const localData = await db.recipe_items.toArray()
      recipeItems.value = localData
    } finally {
      isLoading.value = false
    }
  }
  
  // Validate recipe items data
  function validateRecipeItems(recipeItemsData) {
    const errors = []
    
    if (!Array.isArray(recipeItemsData) || recipeItemsData.length === 0) {
      errors.push('Recipe items data must be a non-empty array')
      return { isValid: false, errors }
    }
    
    recipeItemsData.forEach((item, index) => {
      if (!item.cooked_items_id) {
        errors.push(`Item ${index + 1}: Cooked item ID is required`)
      }
      
      if (!item.quantity || item.quantity <= 0) { // ✅ Ubah dari jumlah_dibutuhkan ke quantity
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // Auto-load data when composable is used
  if (autoLoad) {
    loadData()
  }
  
  return {
    // State
    isLoading,
    recipeItems,
    rawMaterials,
    products,
    error,
    
    // Computed
    getRecipeItemsByProduct,
    getRecipeItemsWithDetails,
    calculateRecipeCost,
    totalCost, // ✅ Tambahkan ini
    
    // Methods
    loadData,
    addRecipeItems,
    updateRecipeItems,
    deleteRecipeItemsByProduct,
    deleteRecipeItem,
    // getRawMaterialName,
    // getRawMaterialUnit,
    // getRawMaterialCost,
    validateRecipeItems
  }
}
