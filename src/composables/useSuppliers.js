import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'

export function useSuppliers() {
  // State
  const isLoading = ref(true)
  const suppliers = ref([])
  const searchQuery = ref('')
  const error = ref(null)
  
  // Filtered suppliers
  const filteredSuppliers = computed(() => {
    let filtered = [...suppliers.value]
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(supplier => 
        (supplier.nama_pt_toko && supplier.nama_pt_toko.toLowerCase().includes(query)) ||
        (supplier.no_telp_pic && supplier.no_telp_pic.toLowerCase().includes(query))
      )
    }
    
    return filtered
  })
  
  // Add new supplier
  async function addSupplier(supplier) {
    isLoading.value = true
    error.value = null
    
    try {
      // Convert Proxy object to plain JavaScript object
      const plainSupplier = JSON.parse(JSON.stringify(supplier))

      // Add to local database first
      const id = await db.suppliers.add(plainSupplier)
      
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('suppliers', id, 'create', plainSupplier)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('suppliers', id, 'create', plainSupplier)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, id }
    } catch (err) {
      console.error('Error adding supplier:', err)
      error.value = `Failed to add supplier: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update existing supplier
  async function updateSupplier(supplier) {
    isLoading.value = true
    error.value = null

    try {
      // Convert Proxy object to plain JavaScript object
      const plainSupplier = JSON.parse(JSON.stringify(supplier))
      
      // Update in local database first
      await db.suppliers.update(plainSupplier.id, plainSupplier)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('suppliers', plainSupplier.id, 'update', plainSupplier)
        const syncResult = await syncService.processSyncQueue()
        if (!syncResult.success) {
          throw new Error(`Sync failed: ${syncResult.message}`)
        }
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('suppliers', plainSupplier.id, 'update', plainSupplier)
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.log('Supplier data:', supplier)
      console.error('Error updating supplier:', err)
      error.value = `Failed to update supplier: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete supplier
  async function deleteSupplier(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Delete from local database first
      await db.suppliers.delete(id)
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('suppliers', id, 'delete', { id })
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('suppliers', id, 'delete', { id })
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting supplier:', err)
      error.value = 'Failed to delete supplier'
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
        await syncService.pullData('suppliers')
      }
      
      // Load from local database
      suppliers.value = await db.suppliers.toArray()
    } catch (err) {
      console.error('Error loading supplier data:', err)
      error.value = 'Failed to load supplier data'
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    // State
    isLoading,
    suppliers,
    searchQuery,
    filteredSuppliers,
    error,
    
    // Methods
    loadData,
    addSupplier,
    updateSupplier,
    deleteSupplier
  }
}