import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'

export function useRecipeItems(autoLoad = true) {
  // State
  const isLoading = ref(true)
  const recipeItems = ref([])
  const rawMaterials = ref([])
  const products = ref([])
  const error = ref(null)
  
  // Get recipe items for a specific product
  const getRecipeItemsByProduct = computed(() => {
    return (productId) => {
      return recipeItems.value.filter(item => item.product_id === productId)
    }
  })
  
  // Get recipe items with raw material details
  const getRecipeItemsWithDetails = computed(() => {
    return (productId) => {
      return recipeItems.value
        .filter(item => item.product_id === productId)
        .map(item => {
          const rawMaterial = rawMaterials.value.find(rm => rm.id === item.raw_material_id)
          return {
            ...item,
            raw_material: rawMaterial || { id: item.raw_material_id, nama_item: 'Unknown' }
          }
        })
    }
  })
  
  // Calculate total cost for a product recipe
  const calculateRecipeCost = computed(() => {
    return (productId) => {
      const items = recipeItems.value.filter(item => item.product_id === productId)
      return items.reduce((total, item) => {
        const rawMaterial = rawMaterials.value.find(rm => rm.id === item.raw_material_id)
        const materialCost = rawMaterial?.harga_rata_rata || 0
        return total + (materialCost * item.jumlah_dibutuhkan)
      }, 0)
    }
  })
  
  // Add recipe items for a product
  async function addRecipeItems(productId, recipeItemsData) {
    isLoading.value = true
    error.value = null
    
    try {
      const itemsToAdd = recipeItemsData.map(item => ({
        product_id: productId,
        raw_material_id: item.raw_material_id,
        jumlah_dibutuhkan: item.jumlah_dibutuhkan,
        date_created: new Date().toISOString(),
        sync_status: 'pending'
      }))
      
      // Add to local database first
      const ids = await db.recipe_items.bulkAdd(itemsToAdd)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        for (let i = 0; i < itemsToAdd.length; i++) {
          await db.addToSyncQueue('recipe_items', ids[i], 'create', itemsToAdd[i])
        }
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        for (let i = 0; i < itemsToAdd.length; i++) {
          await db.addToSyncQueue('recipe_items', ids[i], 'create', itemsToAdd[i])
        }
      }
      
      // Reload data
      await loadData()
      
      return { success: true, ids }
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
        .where('product_id')
        .equals(productId)
        .toArray()
      
      // Delete from local database
      await db.recipe_items
        .where('product_id')
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
    isLoading.value = true
    error.value = null
    
    try {
      // Try to sync first if online
      if (syncService.isOnline()) {
        await syncService.pullData('recipe_items')
        await syncService.pullData('raw_materials')
        await syncService.pullData('products')
      }
      
      // Load from local database
      recipeItems.value = await db.recipe_items.toArray()
      rawMaterials.value = await db.raw_materials.toArray()
      products.value = await db.products.toArray()
    } catch (err) {
      console.error('Error loading recipe items data:', err)
      error.value = 'Failed to load recipe items data'
    } finally {
      isLoading.value = false
    }
  }
  
  // Get raw material name by ID
  function getRawMaterialName(rawMaterialId) {
    const material = rawMaterials.value.find(rm => rm.id === rawMaterialId)
    return material ? material.nama_item : 'Unknown'
  }
  
  // Get raw material unit by ID
  function getRawMaterialUnit(rawMaterialId) {
    const material = rawMaterials.value.find(rm => rm.id === rawMaterialId)
    return material?.unit || 'Unknown'
  }
  
  // Get raw material cost by ID
  function getRawMaterialCost(rawMaterialId) {
    const material = rawMaterials.value.find(rm => rm.id === rawMaterialId)
    return material?.harga_rata_rata || 0
  }
  
  // Validate recipe items data
  function validateRecipeItems(recipeItemsData) {
    const errors = []
    
    if (!Array.isArray(recipeItemsData) || recipeItemsData.length === 0) {
      errors.push('Recipe items data must be a non-empty array')
      return { isValid: false, errors }
    }
    
    recipeItemsData.forEach((item, index) => {
      if (!item.raw_material_id) {
        errors.push(`Item ${index + 1}: Raw material ID is required`)
      }
      
      if (!item.jumlah_dibutuhkan || item.jumlah_dibutuhkan <= 0) {
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
    
    // Methods
    loadData,
    addRecipeItems,
    updateRecipeItems,
    deleteRecipeItemsByProduct,
    deleteRecipeItem,
    getRawMaterialName,
    getRawMaterialUnit,
    getRawMaterialCost,
    validateRecipeItems
  }
}