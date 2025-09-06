import { ref, computed, onMounted } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'
import { useAuthStore } from '../stores/auth'

export function useStockOpnames() {
  const authStore = useAuthStore()
  
  // State
  const isLoading = ref(true)
  const stockOpnames = ref([])
  const rawMaterials = ref([])
  const searchQuery = ref('')
  const selectedStatus = ref('all')
  const error = ref(null)
  
  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [5, 10, 25, 50, 100]
  
  // Date filter state
  const dateFilter = ref({
    startDate: '',
    endDate: '',
    dateField: 'tanggal_opname' // 'tanggal_opname' or 'date_created'
  })
  
  // Filters object for watcher compatibility
  const filters = computed(() => ({
    searchQuery: searchQuery.value,
    selectedStatus: selectedStatus.value,
    dateFilter: dateFilter.value
  }))
  
  // Stats computed
  const stats = computed(() => {
    // Get current month for thisMonth calculation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return {
      total: filteredOpnames.value.length,
      draft: filteredOpnames.value.filter(o => o.status === 'draft').length,
      completed: filteredOpnames.value.filter(o => o.status === 'selesai').length,
      cancelled: filteredOpnames.value.filter(o => o.status === 'dibatalkan').length,
      thisMonth: filteredOpnames.value.filter(o => {
        if (!o.tanggal_opname) return false;
        const date = new Date(o.tanggal_opname);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).length
    };
  })
  
  // Server-side pagination state
  const serverSidePagination = ref(false)
  const totalItems = ref(0)
  
  // Filtered stock opnames
  const filteredOpnames = computed(() => {
    if (serverSidePagination.value) {
      return stockOpnames.value
    }
    
    let filtered = [...stockOpnames.value]
    
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(opname => {
        const opnameId = opname.id?.toString() || ''
        const createdBy = opname.dicatat_oleh_name || opname.dicatat_oleh?.first_name || ''
        const notes = opname.catatan_keseluruhan || ''
        
        return opnameId.toLowerCase().includes(query) ||
               createdBy.toLowerCase().includes(query) ||
               notes.toLowerCase().includes(query)
      })
    }
    
    // Status filter
    if (selectedStatus.value !== 'all') {
      filtered = filtered.filter(opname => opname.status === selectedStatus.value)
    }
    
    // Date filter
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      filtered = filtered.filter(opname => {
        const dateField = dateFilter.value.dateField
        const opnameDate = opname[dateField]
        
        if (!opnameDate) return false
        
        const date = new Date(opnameDate).toISOString().split('T')[0]
        const startDate = dateFilter.value.startDate
        const endDate = dateFilter.value.endDate
        
        if (startDate && endDate) {
          return date >= startDate && date <= endDate
        } else if (startDate) {
          return date >= startDate
        } else if (endDate) {
          return date <= endDate
        }
        
        return true
      })
    }
    
    return filtered
  })
  
  // Pagination computed properties
  const totalPages = computed(() => {
    if (serverSidePagination.value) {
      return Math.ceil(totalItems.value / itemsPerPage.value)
    }
    return Math.ceil(filteredOpnames.value.length / itemsPerPage.value)
  })
  
  const paginatedOpnames = computed(() => {
    if (serverSidePagination.value) {
      return stockOpnames.value
    }
    
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredOpnames.value.slice(start, end)
  })
  
  const paginationInfo = computed(() => {
    const total = serverSidePagination.value ? totalItems.value : filteredOpnames.value.length
    const start = total === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(currentPage.value * itemsPerPage.value, total)
    
    return { start, end, total }
  })
  
  // Pagination methods
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      if (serverSidePagination.value) {
        loadStockOpnamesPaginated()
      }
    }
  }
  
  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage.value = newItemsPerPage
    currentPage.value = 1
    if (serverSidePagination.value) {
      loadStockOpnamesPaginated()
    }
  }
  
  // Alias methods for compatibility
  function updatePage(page) {
    changePage(page)
  }
  
  function updateItemsPerPage(newItemsPerPage) {
    changeItemsPerPage(newItemsPerPage)
  }
  
  // Main load function
  function loadStockOpnames() {
    if (serverSidePagination.value) {
      loadStockOpnamesPaginated()
    } else {
      loadData()
    }
  }
  
  function resetPagination() {
    currentPage.value = 1
  }
  
  // Date filter methods
  function updateDateFilter(newDateFilter) {
    dateFilter.value = { ...newDateFilter }
    resetPagination()
    if (serverSidePagination.value) {
      loadStockOpnamesPaginated()
    }
  }
  
  // Filter methods
  function updateFilters(newFilters) {
    if (newFilters.searchQuery !== undefined) {
      searchQuery.value = newFilters.searchQuery
    }
    if (newFilters.selectedStatus !== undefined) {
      selectedStatus.value = newFilters.selectedStatus
    }
    if (newFilters.dateFilter !== undefined) {
      dateFilter.value = { ...newFilters.dateFilter }
    }
    resetPagination()
    if (serverSidePagination.value) {
      loadStockOpnamesPaginated()
    }
  }
  
  function clearFilters() {
    searchQuery.value = ''
    selectedStatus.value = 'all'
    dateFilter.value = {
      startDate: '',
      endDate: '',
      dateField: 'tanggal_opname'
    }
    resetPagination()
    if (serverSidePagination.value) {
      loadStockOpnamesPaginated()
    }
  }
  
  // Build server filters
  function buildServerFilters() {
    const filters = {}
    
    if (searchQuery.value) {
      filters.search = searchQuery.value
    }
    
    if (selectedStatus.value !== 'all') {
      filters.status = { _eq: selectedStatus.value }
    }
    
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      const dateField = dateFilter.value.dateField
      if (dateFilter.value.startDate && dateFilter.value.endDate) {
        filters[dateField] = {
          _between: [dateFilter.value.startDate, dateFilter.value.endDate]
        }
      } else if (dateFilter.value.startDate) {
        filters[dateField] = { _gte: dateFilter.value.startDate }
      } else if (dateFilter.value.endDate) {
        filters[dateField] = { _lte: dateFilter.value.endDate }
      }
    }
    
    return filters
  }
  
  // Load stock opnames with pagination
  async function loadStockOpnamesPaginated(customFilters = null) {
    if (!serverSidePagination.value) {
      return await loadData()
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const filters = customFilters || buildServerFilters()
      const result = await paginationService.loadPaginatedData(
        'stock_opnames',
        currentPage.value,
        itemsPerPage.value,
        filters
      )
      
      if (result.success) {
        stockOpnames.value = result.data
        totalItems.value = result.total
        return { success: true }
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error loading paginated stock opnames:', err)
      error.value = `Failed to load stock opnames: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Load stock opnames
  async function loadData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Try to fetch from API first if online
      if (syncService.isOnline()) {
        const result = await syncService.pullData('stock_opnames')
        if (!result.success) {
          console.warn('Failed to fetch from API, falling back to local data')
        }
      }
      
      // Load from local database with descending order by tanggal_opname
      const localOpnames = await db.stock_opnames
        .orderBy('tanggal_opname')
        .reverse()
        .toArray()
      
      stockOpnames.value = localOpnames
      
      return { success: true }
    } catch (err) {
      console.error('Error loading stock opnames:', err)
      error.value = `Failed to load stock opnames: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Load raw materials for stock opname items
  async function loadRawMaterials() {
    try {
      if (syncService.isOnline()) {
        await syncService.pullData('raw_materials')
      }
      rawMaterials.value = await db.raw_materials.toArray()
    } catch (err) {
      console.error('Error loading raw materials:', err)
    }
  }
  
  // Auto-load data when composable is used
  onMounted(() => {
    loadData()
    loadRawMaterials()
  })
  
  // Fetch a specific stock opname with details
  async function fetchOpnameDetail(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Try to fetch from API if online
      if (syncService.isOnline()) {
        const result = await syncService.pullStockOpnameWithItems(id)
        if (!result.success) {
          console.warn(`Failed to fetch opname ${id} from API, falling back to local data`)
        } else {
          // Save stock_opname_items from API response
          const opname = result.data
          if (opname.items_opname && Array.isArray(opname.items_opname)) {
            for (const item of opname.items_opname) {
              await db.stock_opname_items.put({
                ...item,
                stock_opname_id: id,
                cached_at: new Date().getTime()
              })
            }
          }
          return { success: true, data: result.data }
        }
      }
      
      // Fall back to local data
      const opname = await db.stock_opnames.get(id)
      if (!opname) {
        return { success: false, error: 'Stock opname not found' }
      }
      
      // Get related items
      const items = await db.stock_opname_items
        .where('stock_opname_id')
        .equals(id)
        .toArray()
      
      return {
        success: true,
        data: {
          ...opname,
          items_opname: items
        }
      }
    } catch (err) {
      console.error('Error fetching stock opname detail:', err)
      error.value = `Failed to fetch stock opname detail: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Add new stock opname
  async function addStockOpname(opname) {
    isLoading.value = true
    error.value = null
    
    try {
      const plainOpname = JSON.parse(JSON.stringify(opname))
      
      // Set default values
      plainOpname.dicatat_oleh = authStore.user?.id
      plainOpname.status = plainOpname.status || 'draft'
      plainOpname.tanggal_opname = plainOpname.tanggal_opname || new Date().toISOString()
      
      if (syncService.isOnline()) {
        // Online: Directly add to server
        const response = await syncService.createStockOpname(plainOpname)
        if (response.success) {
          await loadData() // Refresh data from server
          return { success: true, id: response.data.id }
        } else {
          throw new Error(response.error)
        }
      } else {
        // Offline: Add to local DB and sync queue
        const id = await db.stock_opnames.add(plainOpname)
      await db.addToSyncQueue('stock_opnames', id, 'create', plainOpname)
        await loadData() // Refresh data from local DB
        return { success: true, id }
      }
    } catch (err) {
      console.error('Error adding stock opname:', err)
      error.value = `Failed to add stock opname: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update existing stock opname
  async function updateStockOpname(opname) {
    isLoading.value = true
    error.value = null
    
    try {
      const plainOpname = JSON.parse(JSON.stringify(opname))
      
      if (syncService.isOnline()) {
        // Online: Directly update on server
        const response = await syncService.updateStockOpname(opname.id, plainOpname)
        if (response.success) {
          await loadData() // Refresh data from server
          return { success: true }
        } else {
          throw new Error(response.error)
        }
      } else {
        // Offline: Update in local DB and add to sync queue
        await db.stock_opnames.update(opname.id, plainOpname)
        await db.addToSyncQueue('stock_opnames', opname.id, 'update', plainOpname)
        await loadData() // Refresh data from local DB
        return { success: true }
      }
    } catch (err) {
      console.error('Error updating stock opname:', err)
      error.value = `Failed to update stock opname: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete stock opname
  async function deleteStockOpname(id) {
    isLoading.value = true
    error.value = null
    
    try {
      if (syncService.isOnline()) {
        // Online: Directly delete from server
        const response = await syncService.deleteStockOpname(id)
        if (response.success) {
          await loadData() // Refresh data from server
          return { success: true }
        } else {
          throw new Error(response.error)
        }
      } else {
        // Offline: Mark as deleted in local DB and add to sync queue
        await db.stock_opnames.delete(id)
        await db.addToSyncQueue('stock_opnames', id, 'delete')
        await loadData() // Refresh data from local DB
        return { success: true }
      }
    } catch (err) {
      console.error('Error deleting stock opname:', err)
      error.value = `Failed to delete stock opname: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Complete stock opname
  async function completeStockOpname(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const updateData = {
        status: 'selesai',
        tanggal_selesai: new Date().toISOString()
      }
      
      if (syncService.isOnline()) {
        // Online: Directly update on server
        const response = await syncService.updateStockOpname(id, updateData)
        if (response.success) {
          await loadData() // Refresh data from server
          return { success: true }
        } else {
          throw new Error(response.error)
        }
      } else {
        // Offline: Update in local DB and add to sync queue
        await db.stock_opnames.update(id, updateData)
        await db.addToSyncQueue('stock_opnames', id, 'update', updateData)
        await loadData() // Refresh data from local DB
        return { success: true }
      }
    } catch (err) {
      console.error('Error completing stock opname:', err)
      error.value = `Failed to complete stock opname: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Add item to stock opname
  async function addStockOpnameItem(stockOpnameId, item) {
    isLoading.value = true
    error.value = null
    
    try {
      const plainItem = JSON.parse(JSON.stringify(item))
      plainItem.stock_opname_id = stockOpnameId
      
      // Calculate selisih automatically
      plainItem.selisih = (plainItem.stok_fisik || 0) - (plainItem.stok_sistem || 0)
      
      if (syncService.isOnline()) {
        const response = await syncService.createStockOpnameItem(plainItem)
        if (response.success) {
          return { success: true, id: response.data.id }
        } else {
          throw new Error(response.error)
        }
      } else {
        const id = await db.stock_opname_items.add(plainItem)
        await db.addToSyncQueue('stock_opname_items', id, 'create', plainItem)
        return { success: true, id }
      }
    } catch (err) {
      console.error('Error adding stock opname item:', err)
      error.value = `Failed to add stock opname item: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update stock opname item
  async function updateStockOpnameItem(item) {
    isLoading.value = true
    error.value = null
    
    try {
      const plainItem = JSON.parse(JSON.stringify(item))
      
      // Calculate selisih automatically
      plainItem.selisih = (plainItem.stok_fisik || 0) - (plainItem.stok_sistem || 0)
      
      if (syncService.isOnline()) {
        const response = await syncService.updateStockOpnameItem(item.id, plainItem)
        if (response.success) {
          return { success: true }
        } else {
          throw new Error(response.error)
        }
      } else {
        await db.stock_opname_items.update(item.id, plainItem)
        await db.addToSyncQueue('stock_opname_items', item.id, 'update', plainItem)
        return { success: true }
      }
    } catch (err) {
      console.error('Error updating stock opname item:', err)
      error.value = `Failed to update stock opname item: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete stock opname item
  async function deleteStockOpnameItem(id) {
    isLoading.value = true
    error.value = null
    
    try {
      if (syncService.isOnline()) {
        const response = await syncService.deleteStockOpnameItem(id)
        if (response.success) {
          return { success: true }
        } else {
          throw new Error(response.error)
        }
      } else {
        await db.stock_opname_items.delete(id)
        await db.addToSyncQueue('stock_opname_items', id, 'delete')
        return { success: true }
      }
    } catch (err) {
      console.error('Error deleting stock opname item:', err)
      error.value = `Failed to delete stock opname item: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Get raw material name by ID
  function getRawMaterialName(materialId) {
    const material = rawMaterials.value.find(m => m.id === materialId)
    return material ? material.nama_item : 'Unknown Material'
  }
  
  // Get raw material unit by ID
  function getRawMaterialUnit(materialId) {
    const material = rawMaterials.value.find(m => m.id === materialId)
    return material?.unit?.abbreviation || 'pcs'
  }
  
  // Get current stock for a material
  function getCurrentStock(materialId) {
    const material = rawMaterials.value.find(m => m.id === materialId)
    return material ? material.stock_quantity || 0 : 0
  }
  
  return {
    // State
    isLoading,
    stockOpnames,
    rawMaterials,
    searchQuery,
    selectedStatus,
    error,
    
    // Computed
    filteredOpnames,
    paginatedOpnames,
    totalPages,
    paginationInfo,
    filters,
    stats,
    
    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    changePage,
    changeItemsPerPage,
    updatePage,
    updateItemsPerPage,
    resetPagination,
    
    // Server-side pagination
    serverSidePagination,
    totalItems,
    loadStockOpnamesPaginated,
    
    // Date filter
    dateFilter,
    updateDateFilter,
    updateFilters,
    clearFilters,
    
    // Methods
    loadStockOpnames,
    loadData,
    loadRawMaterials,
    fetchOpnameDetail,
    addStockOpname,
    updateStockOpname,
    deleteStockOpname,
    completeStockOpname,
    addStockOpnameItem,
    updateStockOpnameItem,
    deleteStockOpnameItem,
    
    // Helpers
    getRawMaterialName,
    getRawMaterialUnit,
    getCurrentStock
  }
}