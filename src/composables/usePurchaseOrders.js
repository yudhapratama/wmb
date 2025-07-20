import { ref, computed } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'

export function usePurchaseOrders() {
  // State
  const isLoading = ref(true)
  const purchaseOrders = ref([])
  const searchQuery = ref('')
  const selectedStatus = ref('all')
  const selectedSupplier = ref('all')
  const error = ref(null)
  
  // Filtered purchase orders
  const filteredOrders = computed(() => {
    let filtered = [...purchaseOrders.value]
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(order => {
        // Sesuaikan dengan struktur data API
        const orderNumber = order.id?.toString() || ''
        const supplierName = order.supplier?.nama_pt_toko || ''
        
        return orderNumber.toLowerCase().includes(query) ||
               supplierName.toLowerCase().includes(query)
      })
    }
    
    // Filter by status
    if (selectedStatus.value !== 'all') {
      filtered = filtered.filter(order => 
        order.status === selectedStatus.value
      )
    }
    
    // Filter by supplier
    if (selectedSupplier.value !== 'all') {
      filtered = filtered.filter(order => 
        order.supplier?.nama_pt_toko === selectedSupplier.value
      )
    }
    
    return filtered
  })
  
  // Load purchase orders
  async function loadData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Try to fetch from API first if online
      if (syncService.isOnline()) {
        const result = await syncService.fetchPurchaseOrders()
        if (!result.success) {
          console.warn('Failed to fetch from API, falling back to local data')
        }
      }
      
      // Load from local database
      const localOrders = await db.purchase_orders.toArray()
      
      // Langsung gunakan data dari API tanpa mapping
      purchaseOrders.value = localOrders
      
      return { success: true }
    } catch (err) {
      console.error('Error loading purchase orders:', err)
      error.value = `Failed to load purchase orders: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Fetch a specific purchase order with details
  async function fetchOrderDetail(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Try to fetch from API if online
      if (syncService.isOnline()) {
        const result = await syncService.fetchPurchaseOrderDetail(id)
        if (!result.success) {
          console.warn(`Failed to fetch order ${id} from API, falling back to local data`)
        } else {
          return { success: true, data: result.data }
        }
      }
      
      // Fall back to local data
      const order = await db.purchase_orders.get(id)
      if (!order) {
        return { success: false, error: 'Purchase order not found' }
      }
      
      const items = await db.po_items
        .where('purchase_order_id')
        .equals(id)
        .toArray()
      
      order.items = items
      
      return { success: true, data: order }
    } catch (err) {
      console.error(`Error fetching purchase order ${id}:`, err)
      error.value = `Failed to fetch purchase order: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Add new purchase order
  async function addPurchaseOrder(order) {
    isLoading.value = true
    error.value = null
    
    try {
      // Convert Proxy object to plain JavaScript object
      const plainOrder = JSON.parse(JSON.stringify(order))
      const orderItems = [...plainOrder.items]
      delete plainOrder.items
      
      // Add order to local database first
      const orderId = await db.purchase_orders.add({
        ...plainOrder,
        sync_status: 'pending',
        date: new Date().toISOString()
      })
      
      // Add order items
      for (const item of orderItems) {
        await db.po_items.add({
          purchase_order_id: orderId,
          item: item.item,
          jumlah_pesan: item.quantity,
          harga_satuan: item.price,
          unit: item.unit
        })
      }
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('purchase_orders', orderId, 'create', plainOrder)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('purchase_orders', orderId, 'create', plainOrder)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, id: orderId }
    } catch (err) {
      console.error('Error adding purchase order:', err)
      error.value = `Failed to add purchase order: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Update existing purchase order
  async function updatePurchaseOrder(order) {
    isLoading.value = true
    error.value = null

    try {
      // Convert Proxy object to plain JavaScript object
      const plainOrder = JSON.parse(JSON.stringify(order))
      const orderItems = [...plainOrder.items]
      delete plainOrder.items
      
      // Update order in local database first
      await db.purchase_orders.update(plainOrder.id, {
        ...plainOrder,
        sync_status: 'pending'
      })
      
      // Delete existing items
      await db.po_items
        .where('purchase_order_id')
        .equals(plainOrder.id)
        .delete()
      
      // Add updated items
      for (const item of orderItems) {
        await db.po_items.add({
          purchase_order_id: plainOrder.id,
          item: item.item,
          jumlah_pesan: item.quantity,
          harga_satuan: item.price,
          unit: item.unit
        })
      }
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('purchase_orders', plainOrder.id, 'update', plainOrder)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('purchase_orders', plainOrder.id, 'update', plainOrder)
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error updating purchase order:', err)
      error.value = `Failed to update purchase order: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Delete purchase order
  async function deletePurchaseOrder(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // Delete from local database first
      await db.purchase_orders.delete(id)
      
      // Delete related items
      await db.po_items
        .where('purchase_order_id')
        .equals(id)
        .delete()
      
      // If online, sync to server
      if (syncService.isOnline()) {
        await db.addToSyncQueue('purchase_orders', id, 'delete', { id })
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        await db.addToSyncQueue('purchase_orders', id, 'delete', { id })
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting purchase order:', err)
      error.value = `Failed to delete purchase order: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }
  
  // Initialize
  loadData()
  
  return {
    // State
    isLoading,
    purchaseOrders,
    filteredOrders,
    searchQuery,
    selectedStatus,
    selectedSupplier,
    error,
    
    // Methods
    loadData,
    fetchOrderDetail,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder
  }
}