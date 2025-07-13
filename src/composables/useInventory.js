import { ref, computed } from 'vue'
import db from '../services/db'
import api from '../services/api'
import syncService from '../services/sync'
// Remove this import
// import { unitOptions } from '../constants/units'

export function useInventory() {
  // State
  const isLoading = ref(true)
  const rawMaterials = ref([])
  const categories = ref([])
  const searchQuery = ref('')
  const selectedCategory = ref('all')
  const error = ref(null)
  
  // Filtered materials
  const filteredMaterials = computed(() => {
    let filtered = [...rawMaterials.value]
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.nama_item.toLowerCase().includes(query)
      )
    }
    
    // Filter by category
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(item => 
        item.kategori === selectedCategory.value
      )
    }
    
    return filtered
  })
  
  // Get category name by ID
  function getCategoryName(categoryId) {
    const category = categories.value.find(c => c.id === categoryId)
    return category ? category.name : 'Uncategorized'
  }

  // Add suppliers to the state
  const suppliers = ref([])
  
  // Load suppliers
  async function loadSuppliers() {
    try {
      if (syncService.isOnline()) {
        await syncService.pullData('suppliers')
      }
      suppliers.value = await db.suppliers.toArray()
    } catch (err) {
      console.error('Error loading suppliers:', err)
    }
  }
  
  // Add new item
  async function addItem(item) {
    isLoading.value = true
    error.value = null
    
    try {
      const plainItem = JSON.parse(JSON.stringify(item))
      
      // No need to convert unit string to unit ID anymore
      // as it's already an ID
      
      if (syncService.isOnline()) {
        // Online: Directly add to server
        const response = await api.post('/items/raw_materials', plainItem)
        await loadData() // Refresh data from server
        return { success: true, id: response.data.data.id }
      } else {
        // Offline: Add to local DB and sync queue
        const id = await db.raw_materials.add(plainItem)
        await db.addToSyncQueue('raw_materials', id, 'create', plainItem)
        await loadData() // Refresh data from local DB
        return { success: true, id }
      }
    } catch (err) {
      console.error('Error adding item:', err)
      error.value = `Failed to add item: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update existing item
  async function updateItem(item) {
    isLoading.value = true
    error.value = null
    
    try {
      const plainItem = JSON.parse(JSON.stringify(item))
      
      // No need to convert unit string to unit ID anymore
      // as it's already an ID
      
      if (syncService.isOnline()) {
        // Online: Directly update on server
        await api.patch(`/items/raw_materials/${item.id}`, plainItem)
        await loadData() // Refresh data from server
      } else {
        // Offline: Update in local DB and add to sync queue
        await db.raw_materials.update(item.id, plainItem)
        await db.addToSyncQueue('raw_materials', item.id, 'update', plainItem)
        await loadData() // Refresh data from local DB
      }
      return { success: true }
    } catch (err) {
      console.error('Error updating item:', err)
      error.value = `Failed to update item: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete item
  async function deleteItem(id) {
    isLoading.value = true
    error.value = null
    
    try {
      if (syncService.isOnline()) {
        // Online: Directly delete from server
        await api.delete(`/items/raw_materials/${id}`)
        await loadData() // Refresh data from server
      } else {
        // Offline: Delete from local DB and add to sync queue
        await db.raw_materials.delete(id)
        await db.addToSyncQueue('raw_materials', id, 'delete', { id })
        await loadData() // Refresh data from local DB
      }
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting item:', err)
      error.value = 'Failed to delete item'
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Get stock status based on quantity and minimum level
  function getStockStatus(item) {
    if (!item) return { status: 'unknown', label: 'Unknown', color: 'text-gray-500' }
    
    const { total_stock, minimum_stock_level } = item
    
    if (total_stock <= 0) {
      return { status: 'out', label: 'Out of Stock', color: 'text-red-600' }
    } else if (total_stock <= minimum_stock_level) {
      return { status: 'low', label: 'Low Stock', color: 'text-orange-500' }
    } else {
      return { status: 'in', label: 'In Stock', color: 'text-green-600' }
    }
  }

  async function updateCache(tableName, data) {
    const plainData = JSON.parse(JSON.stringify(data)).map(item => ({ ...item, cached_at: new Date() }))
    await db[tableName].clear()
    await db[tableName].bulkAdd(plainData)
  }

  // Include suppliers in the loadData function
  async function loadData() {
    isLoading.value = true
    error.value = null
    
    try {
      if (syncService.isOnline()) {
        // Online: Fetch from API and update cache
        const [materialsRes, categoriesRes, suppliersRes] = await Promise.all([
          api.get('/items/raw_materials?deep[supplier_id][_limit]=-1'),
          api.get('/items/item_categories?limit=-1'),
          api.get('/items/suppliers?limit=-1')
        ])

        rawMaterials.value = materialsRes.data.data
        categories.value = categoriesRes.data.data
        suppliers.value = suppliersRes.data.data

        // Asynchronously update cache
        updateCache('raw_materials', rawMaterials.value)
        updateCache('item_categories', categories.value)
        updateCache('suppliers', suppliers.value)
      } else {
        // Offline: Load from local database
        rawMaterials.value = await db.raw_materials.toArray()
        categories.value = await db.item_categories.toArray()
        suppliers.value = await db.suppliers.toArray()
      }
      
      // Load units
      await loadUnits()
    } catch (err) {
      console.error('Error loading inventory data:', err)
      error.value = 'Failed to load inventory data. Please check your connection or try again later.'
      // Fallback to local data if API fails
      rawMaterials.value = await db.raw_materials.toArray()
      categories.value = await db.item_categories.toArray()
      suppliers.value = await db.suppliers.toArray()
    } finally {
      isLoading.value = false
    }
  }
  
  // Return suppliers in the composable
  // Add this to the existing useInventory.js file
  
  // Unit mapping for display
  const unitOptions = ref([])
  
  // Add a function to load units
  async function loadUnits() {
    try {
      if (syncService.isOnline()) {
        await syncService.pullData('units')
      }
      const dbUnits = await db.units.toArray()
      
      // Map the units from the database to the format expected by the application
      unitOptions.value = dbUnits.map(unit => ({
        id: unit.id,
        text: unit.name,
        value: unit.value
      }))
      
      // If no units were loaded from the database, fall back to default units
      if (unitOptions.value.length === 0) {
        unitOptions.value = [
          { id: 1, text: "Kilogram", value: "kg" },
          { id: 2, text: "Gram", value: "g" },
          { id: 3, text: "Liter", value: "L" },
          { id: 4, text: "Milliliter", value: "ml" },
          { id: 5, text: "Pieces", value: "pcs" },
          { id: 6, text: "Box", value: "box" },
          { id: 7, text: "Pack", value: "pack" }
        ]
      }
    } catch (err) {
      console.error('Error loading units:', err)
    }
  }
  
  // Modify the getUnitName function to use the ref
  function getUnitName(unitValue) {
    const unit = unitOptions.value.find(u => u.id === Number(unitValue))
    return unit ? unit.text : 'Unknown'
  }
  
  // Get supplier name by ID
  function getSupplierName(supplierId) {
    const supplier = suppliers.value.find(s => s.id === supplierId)
    return supplier ? supplier.nama_pt_toko : 'Unknown'
  }
  
  return {
    // State
    isLoading,
    rawMaterials,
    categories,
    suppliers,
    unitOptions, // Export unitOptions as a ref now
    searchQuery,
    selectedCategory,
    filteredMaterials,
    error,
    
    // Methods
    loadData,
    getCategoryName,
    getSupplierName,
    getUnitName,
    addItem,
    updateItem,
    deleteItem,
    getStockStatus
  }
}