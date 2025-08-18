import { ref, computed, watch } from 'vue'
import api from '../services/api'  // Import api instance
import { useNotification } from './useNotification'

export function useKitchen() {
  // State management
  const isLoading = ref(false)
  const kitchenPreps = ref([])
  const cookedItems = ref([])
  const rawMaterials = ref([])
  const units = ref([])
  
  // Filters
  const searchQuery = ref('')
  const selectedCookedItem = ref(null)
  const dateFilter = ref({
    startDate: null,
    endDate: null
  })
  
  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [5, 10, 25, 50]
  
  // API composable
  // Remove the incorrect destructuring
  // const { get, post, put, del } = useApiData()
  const { showNotification } = useNotification()
  
  // Computed properties
  const filteredPreps = computed(() => {
    let filtered = kitchenPreps.value
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(prep => 
        prep.bahan_hasil_olahan?.name?.toLowerCase().includes(query) ||
        prep.dicatat_oleh?.first_name?.toLowerCase().includes(query) ||
        prep.dicatat_oleh?.last_name?.toLowerCase().includes(query)
      )
    }
    
    if (selectedCookedItem.value) {
      filtered = filtered.filter(prep => 
        prep.bahan_hasil_olahan?.id === selectedCookedItem.value
      )
    }
    
    if (dateFilter.value.startDate) {
      filtered = filtered.filter(prep => 
        new Date(prep.date_created) >= new Date(dateFilter.value.startDate)
      )
    }
    
    if (dateFilter.value.endDate) {
      filtered = filtered.filter(prep => 
        new Date(prep.date_created) <= new Date(dateFilter.value.endDate)
      )
    }
    
    return filtered.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
  })
  
  const paginatedPreps = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredPreps.value.slice(start, end)
  })
  
  const totalPages = computed(() => {
    return Math.ceil(filteredPreps.value.length / itemsPerPage.value)
  })
  
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(start + itemsPerPage.value - 1, filteredPreps.value.length)
    const total = filteredPreps.value.length
    return { start, end, total }
  })
  
  // Load all data
  async function loadData() {
    isLoading.value = true
    try {
      await Promise.all([
        loadKitchenPreps(),
        loadCookedItems(),
        loadRawMaterials(),
        loadUnits()
      ])
    } catch (error) {
      console.error('Error loading kitchen data:', error)
      showNotification('Gagal memuat data kitchen', 'error')
    } finally {
      isLoading.value = false
    }
  }
  
  // Load kitchen preparations
  async function loadKitchenPreps() {
    try {
      const response = await api.get('/items/kitchen_prep', {
        params: {
          // Hapus bahan_baku.harga_per_unit dari query karena field ini ada di kitchen_prep
          fields: '*,bahan_hasil_olahan.id,bahan_hasil_olahan.name,bahan_hasil_olahan.unit.name,bahan_hasil_olahan.unit.abbreviation,dicatat_oleh.first_name,dicatat_oleh.last_name,bahan_baku.raw_materials_id.id,bahan_baku.raw_materials_id.nama_item,bahan_baku.raw_materials_id.unit.name,bahan_baku.raw_materials_id.unit.abbreviation,bahan_baku.jumlah_diambil',
          sort: '-date_created'
        }
      })
      kitchenPreps.value = response.data?.data || []
    } catch (error) {
      console.error('Error loading kitchen preps:', error)
      kitchenPreps.value = []
    }
  }
  
  // Load cooked items for dropdown
  async function loadCookedItems() {
    try {
      const response = await api.get('/items/cooked_items', {
        params: {
          fields: 'id,name,unit.id,unit.name,unit.abbreviation,raw_material.raw_materials_id.id,raw_material.raw_materials_id.nama_item,raw_material.raw_materials_id.unit.id,raw_material.raw_materials_id.unit.name,raw_material.raw_materials_id.unit.abbreviation,raw_material.jumlah_dibutuhkan',
          sort: 'name'
        }
      })
      cookedItems.value = response.data?.data || []
    } catch (error) {
      console.error('Error loading cooked items:', error)
      cookedItems.value = []
    }
  }
  
  // Load raw materials
  async function loadRawMaterials() {
    try {
      const response = await api.get('/items/raw_materials', {
        params: {
          fields: 'id,nama_item,unit.id,unit.name,unit.abbreviation,harga_rata_rata,total_stock',
          sort: 'nama_item'
        }
      })
      rawMaterials.value = response.data?.data || []
    } catch (error) {
      console.error('Error loading raw materials:', error)
      rawMaterials.value = []
    }
  }
  
  // Load units
  async function loadUnits() {
    try {
      const response = await api.get('/items/units', {
        params: {
          fields: 'id,name,abbreviation',
          sort: 'name'
        }
      })
      units.value = response.data?.data || []
    } catch (error) {
      console.error('Error loading units:', error)
      units.value = []
    }
  }
  
  // Get cooked item recipe
  async function getCookedItemRecipe(cookedItemId) {
    try {
      const response = await api.get(`/items/cooked_items/${cookedItemId}`, {
        params: {
          fields: '*,raw_material.raw_materials_id.id,raw_material.raw_materials_id.nama_item,raw_material.raw_materials_id.unit.id,raw_material.raw_materials_id.unit.name,raw_material.raw_materials_id.unit.abbreviation,raw_material.jumlah_dibutuhkan'
        }
      })
      return response.data?.data
    } catch (error) {
      console.error('Error loading cooked item recipe:', error)
      throw error
    }
  }
  
  // Calculate required raw materials based on production quantity
  function calculateRequiredMaterials(recipe, productionQuantity) {
    if (!recipe?.raw_material || !Array.isArray(recipe.raw_material)) {
      return []
    }
    
    return recipe.raw_material.map(item => ({
      raw_materials_id: item.raw_materials_id.id,
      nama_item: item.raw_materials_id.nama_item,
      unit: item.raw_materials_id.unit,
      jumlah_dibutuhkan: item.jumlah_dibutuhkan,
      jumlah_diambil: (item.jumlah_dibutuhkan * productionQuantity).toFixed(2)
    }))
  }
  
  // Update cooked item stock and average cost
  async function updateCookedItemStock(cookedItemId, jumlahDihasilkan, hppPembuatan) {
    try {
      // Get current cooked item data
      const response = await api.get(`/items/cooked_items/${cookedItemId}`)
      const currentItem = response.data.data
      
      const currentTotalStock = parseFloat(currentItem.total_stock || 0)
      const currentAvgCost = parseFloat(currentItem.harga_pokok_rata_rata || 0)
      const newProductionAmount = parseFloat(jumlahDihasilkan)
      const newProductionCost = parseFloat(hppPembuatan)
      
      let newTotalStock, newAvgCost
      
      // 1. Cek terlebih dahulu apakah jumlah stok existing sama dengan 0
      if (currentTotalStock == 0) {
        // a. Jika "Ya" maka jumlah stok dan hpp pembuatan dari kitchen prep bisa langsung ditambahkan
        newTotalStock = currentTotalStock + newProductionAmount
        
        // Hitung weighted average cost
        const totalCurrentValue = currentTotalStock * currentAvgCost
        const totalNewValue = newProductionAmount * (newProductionCost / newProductionAmount) // HPP per unit
        
        console.log(totalCurrentValue, 'total current value') // 0 √
        console.log(totalNewValue, 'total new value') // 150000
        console.log(newTotalStock, 'new total stock') // 25 √
        console.log(newProductionAmount, 'new production amount') // 25 √
        console.log(newProductionCost, 'new production cost') // 150000

        newAvgCost = (totalCurrentValue + totalNewValue) // newTotalStock
        // (0+150000) / 25 = 6000
        
      } else {
        // b. Jika "Tidak" maka tetap lakukan dengan mekanisme yang sekarang
        newTotalStock = currentTotalStock + newProductionAmount
        newAvgCost = (newProductionCost + currentAvgCost) / 2
      }
      
      // Update cooked item
      const updatePayload = {
        total_stock: newTotalStock,
        harga_pokok_rata_rata: newAvgCost
      }
      console.log(updatePayload,'update payload')
      
      await api.patch(`/items/cooked_items/${cookedItemId}`, updatePayload)
      console.log(`Updated cooked item ${cookedItemId}: stock=${newTotalStock}, avg_cost=${newAvgCost}, had_previous_stock=${currentTotalStock > 0}`)
      
    } catch (error) {
      console.error('Error updating cooked item stock:', error)
      throw error
    }
  }
  
  // Update raw material stock and average price
  async function updateRawMaterialStock(rawMaterialId, jumlahDiambil) {
    try {
      // Get current raw material data
      const response = await api.get(`/items/raw_materials/${rawMaterialId}`)
      const currentMaterial = response.data.data
      
      const currentTotalStock = parseFloat(currentMaterial.total_stock || 0)
      const currentAvgPrice = parseFloat(currentMaterial.harga_rata_rata || 0)
      
      // Calculate price per unit before stock reduction
      const pricePerUnit = currentTotalStock > 0 ? currentAvgPrice / currentTotalStock : 0
      
      // Calculate new stock after usage
      const newTotalStock = currentTotalStock - parseFloat(jumlahDiambil)
      
      // Calculate new average price
      const newAvgPrice = newTotalStock > 0 ? pricePerUnit * newTotalStock : 0
      
      // Update raw material
      const updatePayload = {
        total_stock: Math.max(0, newTotalStock), // Ensure stock doesn't go negative
        harga_rata_rata: newAvgPrice
      }
      
      await api.patch(`/items/raw_materials/${rawMaterialId}`, updatePayload)
      console.log(`Updated raw material ${rawMaterialId}: stock=${newTotalStock}, avg_price=${newAvgPrice}`)
      
    } catch (error) {
      console.error('Error updating raw material stock:', error)
      throw error
    }
  }

  // Create new kitchen prep (modified)
  async function createKitchenPrep(prepData) {
    try {
      isLoading.value = true
      
      const payload = {
        bahan_hasil_olahan: prepData.bahan_hasil_olahan,
        jumlah_dihasilkan: prepData.jumlah_dihasilkan,
        hpp_pembuatan: prepData.hpp_pembuatan,
        harga_per_unit: prepData.harga_per_unit,
        bahan_baku: prepData.bahan_baku_digunakan.map(item => ({
          raw_materials_id: item.raw_materials_id,
          jumlah_diambil: parseFloat(item.jumlah_diambil),
          harga_per_unit: item.harga_per_unit || 0
        }))
      }
      
      const response = await api.post('/items/kitchen_prep', payload)
      console.log(response, 'response create kitchen prep')
      if (response.data) {
        // Update cooked item stock and average cost
        const responseCooked = await updateCookedItemStock(
          prepData.bahan_hasil_olahan,
          prepData.jumlah_dihasilkan,
          prepData.hpp_pembuatan
        )

        console.log(responseCooked, 'response cooked')
        
        // Update each raw material stock
        for (const bahanBaku of prepData.bahan_baku_digunakan) {
          await updateRawMaterialStock(
            bahanBaku.raw_materials_id,
            bahanBaku.jumlah_diambil
          )
        }
        
        await loadKitchenPreps()
        showNotification('Catatan produksi berhasil dibuat dan stok telah diperbarui', 'success')
        return response.data
      }
    } catch (error) {
      console.error('Error creating kitchen prep:', error)
      showNotification('Gagal membuat catatan produksi', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // Update kitchen prep
  async function updateKitchenPrep(id, prepData) {
    try {
      isLoading.value = true
      
      const payload = {
        bahan_hasil_olahan: prepData.bahan_hasil_olahan,
        jumlah_dihasilkan: prepData.jumlah_dihasilkan,
        hpp_pembuatan: prepData.hpp_pembuatan,
        harga_per_unit: prepData.harga_per_unit, // Tambahkan field ini
        bahan_baku: prepData.bahan_baku_digunakan.map(item => ({
          raw_materials_id: item.raw_materials_id,
          jumlah_diambil: parseFloat(item.jumlah_diambil),
          harga_per_unit: item.harga_per_unit || 0 // Tambahkan harga per unit untuk setiap bahan
        }))
      }
      
      const response = await api.patch(`/items/kitchen_prep/${id}`, payload)
      console.log(response)
      
      if (response.data) {
        await loadKitchenPreps()
        showNotification('Catatan produksi berhasil diperbarui', 'success')
        return response.data
      }
    } catch (error) {
      console.error('Error updating kitchen prep:', error)
      showNotification('Gagal memperbarui catatan produksi', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete kitchen prep
  async function deleteKitchenPrep(id) {
    try {
      isLoading.value = true
      await api.delete(`/items/kitchen_prep/${id}`)
      await loadKitchenPreps()
      showNotification('Catatan produksi berhasil dihapus', 'success')
    } catch (error) {
      console.error('Error deleting kitchen prep:', error)
      showNotification('Gagal menghapus catatan produksi', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // Utility functions
  function getCookedItemName(id) {
    const item = cookedItems.value.find(item => item.id === id)
    return item?.name || 'Unknown'
  }
  
  function getRawMaterialName(id) {
    const material = rawMaterials.value.find(material => material.id === id)
    return material?.nama_item || 'Unknown'
  }
  
  function getUnitName(id) {
    const unit = units.value.find(unit => unit.id === id)
    return unit?.name || 'Unknown'
  }
  
  function getUnitAbbreviation(id) {
    const unit = units.value.find(unit => unit.id === id)
    return unit?.abbreviation || 'Unknown'
  }
  
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
  
  // Filter functions
  function updateDateFilter(newDateFilter) {
    dateFilter.value = { ...newDateFilter }
  }
  
  function clearFilters() {
    searchQuery.value = ''
    selectedCookedItem.value = null
    dateFilter.value = {
      startDate: null,
      endDate: null
    }
    resetPagination()
  }
  
  return {
    // State
    isLoading,
    kitchenPreps,
    cookedItems,
    rawMaterials,
    units,
    
    // Filters
    searchQuery,
    selectedCookedItem,
    dateFilter,
    
    // Computed
    filteredPreps,
    paginatedPreps,
    
    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    paginationInfo,
    changePage,
    changeItemsPerPage,
    resetPagination,
    
    // Methods
    loadData,
    getCookedItemRecipe,
    calculateRequiredMaterials,
    createKitchenPrep,
    updateKitchenPrep,
    deleteKitchenPrep,
    
    // Utility functions
    getCookedItemName,
    getRawMaterialName,
    getUnitName,
    getUnitAbbreviation,
    
    // Filter functions
    updateDateFilter,
    clearFilters,
    
    // New methods
    updateCookedItemStock,
    updateRawMaterialStock
  }
}