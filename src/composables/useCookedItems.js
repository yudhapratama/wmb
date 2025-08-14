import { ref, computed } from 'vue'
import db from '../services/db'
import api from '../services/api'
import syncService from '../services/sync'

export function useCookedItems() {
  // State
  const isLoading = ref(false)
  const cookedItems = ref([])
  const rawMaterials = ref([])
  const units = ref([])
  const searchQuery = ref('')
  const selectedCategory = ref('')
  
  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [5, 10, 25, 50]
  
  // Date filter
  const dateFilter = ref({
    startDate: '',
    endDate: ''
  })
  
  // Computed properties
  const filteredItems = computed(() => {
    let filtered = cookedItems.value
    
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  })
  
  const totalPages = computed(() => 
    Math.ceil(filteredItems.value.length / itemsPerPage.value)
  )
  
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredItems.value.slice(start, end)
  })
  
  const paginationInfo = computed(() => {
    const total = filteredItems.value.length
    const start = total === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(currentPage.value * itemsPerPage.value, total)
    return { start, end, total }
  })
  
  // Pagination functions
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage.value = newItemsPerPage
    currentPage.value = 1
  }
  
  function resetPagination() {
    currentPage.value = 1
  }
  
  // Date filter function
  function updateDateFilter(filter) {
    dateFilter.value = { ...filter }
    resetPagination()
  }
  
  // Get unit name by ID
  function getUnitName(unitId) {
    const unit = units.value.find(u => u.id === unitId)
    return unit ? unit.name : 'Unknown'
  }
  
  // Get raw material name by ID
  function getRawMaterialName(rawMaterialId) {
    const rawMaterial = rawMaterials.value.find(rm => rm.id === rawMaterialId)
    return rawMaterial ? rawMaterial.nama_item : 'Unknown'
  }
  
  // CRUD Operations
  async function addItem(itemData) {
    try {
      isLoading.value = true
      
      // Prepare data for API
      const cookedItemData = {
        name: itemData.name,
        total_stock: itemData.total_stock || 0,
        unit: itemData.unit,
        raw_material: itemData.raw_materials?.map(rm => ({
          raw_materials_id: rm.raw_materials_id,
          jumlah_dibutuhkan: rm.jumlah_dibutuhkan
        })) || []
      }
      
      if (navigator.onLine) {
        const response = await api.post('/items/cooked_items', cookedItemData)
        if (response.data) {
          await loadData() // Reload data
          return { success: true, data: response.data }
        }
      } else {
        // Store offline
        await syncService.addPendingOperation({
          type: 'CREATE',
          collection: 'cooked_items',
          data: cookedItemData
        })
        
        // Add to local storage (flatten data)
        const localId = Date.now()
        const flatItem = {
          id: localId,
          name: itemData.name,
          total_stock: itemData.total_stock || 0,
          unit: itemData.unit,
          _isLocal: true,
          cached_at: new Date().getTime()
        }
        
        await db.cooked_items.add(flatItem)
        
        // Add recipe items
        if (itemData.raw_materials) {
          const recipeItems = itemData.raw_materials.map(rm => ({
            cooked_items_id: localId,
            raw_materials_id: rm.raw_materials_id,
            jumlah_dibutuhkan: rm.jumlah_dibutuhkan,
            cached_at: new Date().getTime()
          }))
          await db.cooked_items_raw_materials.bulkAdd(recipeItems)
        }
        
        // Update local state
        const newItem = {
          ...flatItem,
          unit: units.value.find(u => u.id === itemData.unit) || { id: itemData.unit },
          raw_material: itemData.raw_materials || []
        }
        cookedItems.value.push(newItem)
        
        return { success: true, data: newItem }
      }
    } catch (error) {
      console.error('Error adding cooked item:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function updateItem(itemData) {
    try {
      isLoading.value = true
      
      const cookedItemData = {
        name: itemData.name,
        total_stock: itemData.total_stock,
        unit: itemData.unit,
        raw_material: itemData.raw_materials?.map(rm => ({
          raw_materials_id: rm.raw_materials_id,
          jumlah_dibutuhkan: rm.jumlah_dibutuhkan
        })) || []
      }
      
      if (navigator.onLine && !itemData._isLocal) {
        const response = await api.patch(`/items/cooked_items/${itemData.id}`, cookedItemData)
        if (response.data) {
          await loadData() // Reload data
          return { success: true, data: response.data }
        }
      } else {
        // Store offline
        await syncService.addPendingOperation({
          type: 'UPDATE',
          collection: 'cooked_items',
          id: itemData.id,
          data: cookedItemData
        })
        
        // Update local storage
        await db.cooked_items.update(itemData.id, cookedItemData)
        
        // Update local state
        const index = cookedItems.value.findIndex(item => item.id === itemData.id)
        if (index !== -1) {
          cookedItems.value[index] = { ...cookedItems.value[index], ...cookedItemData }
        }
        
        return { success: true, data: { ...itemData, ...cookedItemData } }
      }
    } catch (error) {
      console.error('Error updating cooked item:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function deleteItem(itemId) {
    try {
      isLoading.value = true
      
      const item = cookedItems.value.find(item => item.id === itemId)
      
      if (navigator.onLine && !item?._isLocal) {
        await api.delete(`/items/cooked_items/${itemId}`)
      } else {
        // Store offline
        await syncService.addPendingOperation({
          type: 'DELETE',
          collection: 'cooked_items',
          id: itemId
        })
      }
      
      // Remove from local storage
      await db.cooked_items.delete(itemId)
      
      // Remove from local state
      cookedItems.value = cookedItems.value.filter(item => item.id !== itemId)
      
      return { success: true }
    } catch (error) {
      console.error('Error deleting cooked item:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Load data function
  async function loadData() {
    try {
      isLoading.value = true
      
      if (navigator.onLine) {
        // Load from API
        const [cookedItemsResponse, rawMaterialsResponse, unitsResponse] = await Promise.all([
          api.get('/items/cooked_items?fields=*,raw_material.raw_materials_id.*,raw_material.jumlah_dibutuhkan,unit.*'),
          api.get('/items/raw_materials?fields=id,nama_item,unit.*'), // Tambahkan unit.*
          api.get('/items/units?fields=id,name')
        ])
        
        const apiCookedItems = cookedItemsResponse.data?.data || []
        rawMaterials.value = rawMaterialsResponse.data?.data || []
        units.value = unitsResponse.data?.data || []
        
        // Transform and flatten data for IndexedDB
        const flattenedCookedItems = []
        const recipeItems = []
        
        for (const item of apiCookedItems) {
          // Flatten main item (remove nested objects)
          const flatItem = {
            id: item.id,
            name: item.name,
            total_stock: item.total_stock,
            harga_pokok_rata_rata: item.harga_pokok_rata_rata,
            unit: typeof item.unit === 'object' ? item.unit?.id : item.unit,
            date_created: item.date_created,
            date_updated: item.date_updated,
            cached_at: new Date().getTime()
          }
          flattenedCookedItems.push(flatItem)
          
          // Extract recipe items
          if (item.raw_material && Array.isArray(item.raw_material)) {
            for (const recipe of item.raw_material) {
              recipeItems.push({
                cooked_items_id: item.id,
                raw_materials_id: typeof recipe.raw_materials_id === 'object' ? recipe.raw_materials_id?.id : recipe.raw_materials_id,
                jumlah_dibutuhkan: recipe.jumlah_dibutuhkan,
                cached_at: new Date().getTime()
              })
            }
          }
        }
        
        // Cache to local storage
        await db.cooked_items.clear()
        await db.cooked_items_raw_materials.clear()
        await db.cooked_items.bulkAdd(flattenedCookedItems)
        await db.cooked_items_raw_materials.bulkAdd(recipeItems)
        
        // Set state with original nested structure for UI
        cookedItems.value = apiCookedItems
      } else {
        // Load from local storage and reconstruct nested structure
        const localCookedItems = await db.cooked_items.toArray()
        const localRecipes = await db.cooked_items_raw_materials.toArray()
        rawMaterials.value = await db.raw_materials.toArray()
        units.value = await db.units.toArray()
        
        // Reconstruct nested structure
        cookedItems.value = localCookedItems.map(item => ({
          ...item,
          unit: units.value.find(u => u.id === item.unit) || { id: item.unit },
          raw_material: localRecipes
            .filter(recipe => recipe.cooked_items_id === item.id)
            .map(recipe => ({
              raw_materials_id: rawMaterials.value.find(rm => rm.id === recipe.raw_materials_id) || { id: recipe.raw_materials_id },
              jumlah_dibutuhkan: recipe.jumlah_dibutuhkan
            }))
        }))
      }
    } catch (error) {
      console.error('Error loading cooked items data:', error)
      // Fallback to local storage with reconstruction
      const localCookedItems = await db.cooked_items.toArray()
      const localRecipes = await db.cooked_items_raw_materials.toArray()
      rawMaterials.value = await db.raw_materials.toArray()
      units.value = await db.units.toArray()
      
      cookedItems.value = localCookedItems.map(item => ({
        ...item,
        unit: units.value.find(u => u.id === item.unit) || { id: item.unit },
        raw_material: localRecipes
          .filter(recipe => recipe.cooked_items_id === item.id)
          .map(recipe => ({
            raw_materials_id: rawMaterials.value.find(rm => rm.id === recipe.raw_materials_id) || { id: recipe.raw_materials_id },
            jumlah_dibutuhkan: recipe.jumlah_dibutuhkan
          }))
      }))
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    // State
    isLoading,
    cookedItems,
    rawMaterials,
    units,
    searchQuery,
    selectedCategory,
    
    // Computed
    filteredItems,
    paginatedItems,
    
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
    
    // Utility functions
    getUnitName,
    getRawMaterialName,
    
    // CRUD operations
    loadData,
    addItem,
    updateItem,
    deleteItem
  }
}