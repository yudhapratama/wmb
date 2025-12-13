import { ref, computed } from 'vue'
import db from '../services/db'
import api from '../services/api'
import syncService from '../services/sync'
import { useAuthStore } from '../stores/auth'
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
  const authStore = useAuthStore()
  
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
    
    // Filter by date range
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item[dateFilter.value.dateField])
        const startDate = dateFilter.value.startDate ? new Date(dateFilter.value.startDate) : null
        const endDate = dateFilter.value.endDate ? new Date(dateFilter.value.endDate) : null
        
        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate
        } else if (startDate) {
          return itemDate >= startDate
        } else if (endDate) {
          return itemDate <= endDate
        }
        return true
      })
    }
    
    return filtered
  })
  
  // Paginated materials
  const paginatedMaterials = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredMaterials.value.slice(start, end)
  })
  
  // Total pages
  const totalPages = computed(() => {
    return Math.ceil(filteredMaterials.value.length / itemsPerPage.value)
  })
  
  // Pagination info
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(start + itemsPerPage.value - 1, filteredMaterials.value.length)
    const total = filteredMaterials.value.length
    
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
    const currentUserId = authStore.user?.id || receiptData.penerima_barang // Gunakan current user ID dengan fallback
    isLoading.value = true
    error.value = null
    
    try {
      const plainItem = JSON.parse(JSON.stringify(item))
      
      // No need to convert unit string to unit ID anymore
      // as it's already an ID
      let id = null;
      if (syncService.isOnline()) {
        // Online: Directly add to server
        const response = await api.post('/items/raw_materials', plainItem)
        id = response.data.data.id;

        const idMaterials = id;
        const logInventoryData = {
          item: idMaterials,
          tipe_transaksi: 'STOK_AWAL',
          perubahan_jumlah: 0,
          stok_sebelum: 0,
          stok_setelah: 0,
          harga_sebelum: 0,
          harga_setelah: 0,
          harga_per_unit_sebelum: 0,
          harga_per_unit_setelah: 0,
          dokumen_sumber: `inventory#${response.data.data.id}`,
          pengguna: currentUserId, // Gunakan current user ID
          waktu_log: new Date().toISOString(),
          sync_status: 'pending',
          cached_at: new Date().getTime()
        }
        const generatedId = await db.log_inventaris.add(logInventoryData)
        await db.addToSyncQueue('log_inventaris', generatedId, 'create', { ...logInventoryData, id: generatedId })
      } else {
        // Offline: Add to local DB and sync queue
        const idMaterials = await db.raw_materials.add(plainItem)
        const logInventoryData = {
          item: idMaterials,
          tipe_transaksi: 'STOK_AWAL',
          perubahan_jumlah: 0,
          stok_sebelum: 0,
          stok_setelah: 0,
          harga_sebelum: 0,
          harga_setelah: 0,
          harga_per_unit_sebelum: 0,
          harga_per_unit_setelah: 0,
          dokumen_sumber: `inventory#${response.data.data.id}`,
          pengguna: currentUserId, // Gunakan current user ID
          waktu_log: new Date().toISOString(),
          sync_status: 'pending',
          cached_at: new Date().getTime()
        }
        const generatedId = await db.log_inventaris.add(logInventoryData)
        id = generatedId
        await db.addToSyncQueue('log_inventaris', generatedId, 'create', { ...logInventoryData, id: generatedId })
      }
      if (syncService.isOnline()) {
        await syncService.processSyncQueue()
      }
      await loadData() // Refresh data from server / localDB
      return { success: true, id }
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
    unitOptions,
    searchQuery,
    selectedCategory,
    filteredMaterials,
    paginatedMaterials,
    error,
    
    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    paginationInfo,
    
    // Date filter
    dateFilter,
    
    // Methods
    loadData,
    getCategoryName,
    getSupplierName,
    getUnitName,
    addItem,
    updateItem,
    deleteItem,
    getStockStatus,
    resetPagination,
    changePage,
    changeItemsPerPage,
    updateDateFilter
  }
}