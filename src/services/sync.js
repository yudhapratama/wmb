import db from './db'
import api from './api'

// Service to handle data synchronization between local IndexedDB and Directus API
export const syncService = {
  // Check if online
  isOnline() {
    return navigator.onLine
  },
  
  // Process sync queue
  async processSyncQueue() {
    if (!this.isOnline()) {
      console.log('Offline: Sync postponed')
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      // Get all items from sync queue
      const queueItems = await db.sync_queue.toArray()
      
      if (queueItems.length === 0) {
        return { success: true, message: 'No items to sync' }
      }
      
      console.log(`Processing ${queueItems.length} items in sync queue`)
      
      // Process each item in the queue
      for (const item of queueItems) {
        try {
          await this.processQueueItem(item)
          // Remove from queue if successful
          await db.sync_queue.delete(item.id)
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          // Leave in queue to retry later
        }
      }
      
      return { success: true, message: `Synced ${queueItems.length} items` }
    } catch (error) {
      console.error('Sync error:', error)
      return { success: false, message: error.message }
    }
  },
  
  // Process a single queue item
  async processQueueItem(item) {
    const { entity, entity_id, action, data } = item
    
    // Tidak perlu mapping lagi, langsung gunakan data
    const mappedData = data
    
    switch (action) {
      case 'create':
        await api.post(`/items/${entity}`, mappedData)
        break
      case 'update':
        await api.patch(`/items/${entity}/${entity_id}`, mappedData)
        break
      case 'delete':
        await api.delete(`/items/${entity}/${entity_id}`)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  },
  
  // Pull data from server
  async pullData(entity, query = {}) {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      // Tambahkan parameter fields untuk deep populate
      if (!query.params) query.params = {}
      if (!query.params.fields) {
        // Default fields untuk deep populate
        switch(entity) {
          case 'raw_materials':
            query.params.fields = '*,kategori.*,unit.*,supplier_utama.*'
            break
          case 'products':
            query.params.fields = '*,kategori.*,resep.cooked_items_id.*,supplier_konsinyasi.*'
            break
          case 'purchase_orders':
            query.params.fields = ['supplier.nama_pt_toko', 'catatan_pembelian', 'status', 
                                 'total_pembayaran', 'tanggal_pembayaran', 'pembuat_po.first_name', 
                                 'date_created', 'date_updated', 'id']
            break
          default:
            query.params.fields = '*'
        }
      }
      
      const response = await api.get(`/items/${entity}`, { params: query.params })
      let items = response.data.data

      // Add cache timestamp to each item
      const timestamp = new Date().getTime();
      const itemsToCache = items.map(item => ({ ...item, cached_at: timestamp }));
      
      // Store in local database
      await db.transaction('rw', db[entity], async () => {
        // Clear existing data if needed
        if (query.clearExisting) {
          await db[entity].clear()
        }
        
        // Add all items
        await db[entity].bulkPut(itemsToCache)
      })
      
      return { success: true, data: items }
    } catch (error) {
      console.error(`Failed to pull ${entity}:`, error)
      return { success: false, message: error.message }
    }
  },
  
  // Initialize data sync
  // In the initializeSync function
  async initializeSync() {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      // Purge old cache before pulling new data
      await db.purgeOldCache();

      // Pull master data first
      await this.pullData('suppliers')
      
      // Pull item_categories directly
      await this.pullData('item_categories')
      await this.pullData('units')
      await this.pullData('raw_materials')
      await this.pullData('expense_categories')
      await this.pullData('products')
      await this.pullData('recipe_items')
      await this.pullData('purchase_orders') // Tambahkan ini
      
      // Process any pending sync items
      return this.processSyncQueue()
    } catch (error) {
      console.error('Failed to initialize sync:', error)
      return { success: false, message: error.message }
    }
  },
  
  // Set up event listeners for online/offline status
  setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('Device is online, starting sync')
      this.processSyncQueue()
    })
    
    window.addEventListener('offline', () => {
      console.log('Device is offline')
    })
  },
  
  // Fetch purchase orders from API
  async fetchPurchaseOrders() {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      // Langsung gunakan pullData untuk purchase_orders
      // Data akan disimpan ke database lokal dengan struktur yang sama dari API
      return await this.pullData('purchase_orders', {
        params: {
          fields: ['*', 'supplier.nama_pt_toko', 'pembuat_po.first_name'],
          sort: ['-date_created']
        }
      })
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error)
      return { success: false, message: error.message }
    }
  },
  
  // Fetch purchase order detail from API
  async fetchPurchaseOrderDetail(id) {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      const response = await api.get(`/items/purchase_orders/${id}`, {
        params: {
          fields: ['*', 'supplier.*', 'pembuat_po.*', 'po_items.*']
        }
      })
      
      const order = response.data.data
      const timestamp = new Date().getTime()
      
      // Simpan ke database lokal
      await db.purchase_orders.put({
        ...order,
        cached_at: timestamp
      })
      
      return { success: true, data: order }
    } catch (error) {
      console.error(`Failed to fetch purchase order ${id}:`, error)
      return { success: false, message: error.message }
    }
  }
}

export default syncService