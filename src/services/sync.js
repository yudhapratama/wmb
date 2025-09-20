import db from './db'
import api from './api'

// Service to handle data synchronization between local IndexedDB and Directus API
export const syncService = {
  // Check if online
  isOnline() {
    return navigator.onLine
  },

  // New helper method to handle expense file upload
  async handleExpenseFileUpload(expenseData, entity, action, entityId = null) {
    // Remove problematic fields
    const cleanData = { ...expenseData }
    
    // Remove IndexedDB-specific fields
    delete cleanData.id
    delete cleanData.sync_status
    delete cleanData.cached_at
    
    // Handle bukti_pembayaran file upload
    if (cleanData.bukti_pembayaran && cleanData.bukti_pembayaran instanceof File) {
      const formData = new FormData()
      formData.append('file', cleanData.bukti_pembayaran)
      
      const uploadResponse = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      cleanData.bukti_pembayaran = uploadResponse.data.data.id
    } else if (!cleanData.bukti_pembayaran) {
      delete cleanData.bukti_pembayaran
    }
    
    // Clean empty string fields (except required ones)
    Object.keys(cleanData).forEach(key => {
      if (key !== 'nama_pengeluaran' && 
          (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined)) {
        delete cleanData[key]
      }
    })
    
    // Perform API call
    if (action === 'create') {
      await api.post(`/items/${entity}`, cleanData)
    } else if (action === 'update') {
      await api.patch(`/items/${entity}/${entityId}`, cleanData)
    }
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
      console.log('queueItems', queueItems)
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
    
    // Bersihkan data untuk entitas sales
    if (entity === 'sales' && data) {
      const cleanData = { ...data }
      // Hapus field yang tidak boleh dikirim ke Directus
      delete cleanData.date_created
      delete cleanData.date_updated
      delete cleanData.id
      delete cleanData.sync_status
      delete cleanData.cached_at
      
      // Update data yang akan diproses
      item.data = cleanData
    }
    
    // Bersihkan data untuk entitas stock_opname_items
    if (entity === 'stock_opname_items' && data) {
      const cleanData = { ...data }
      // Hapus field yang tidak boleh dikirim ke Directus
      delete cleanData.id
      delete cleanData.sync_status
      delete cleanData.cached_at
      
      // Update data yang akan diproses
      item.data = cleanData
    }

    // log inventori tidak butuh id
    if (entity === 'log_inventaris' && data) {
      const cleanData = { ...data }
      delete cleanData.id
      // Update data yang akan diproses
      item.data = cleanData
    }
    
    switch (action) {
      case 'create':
        if (entity === 'expenses') {
          await this.handleExpenseFileUpload(data, entity, 'create')
        } else if (entity === 'purchase_orders' && data.items) {
          // Handle purchase order dengan items
          const { items, ...orderData } = data
          
          // Create purchase order first
          const orderResponse = await api.post(`/items/${entity}`, orderData)
          const createdOrderId = orderResponse.data.data.id
          
          // Create po_items
          for (const item of items) {
            await api.post('/items/po_items', {
              ...item,
              purchase_order: createdOrderId
            })
          }
     
        } else if (entity === 'expenses' && data.bukti_pembayaran === null) {
            const expenseData = { ...data }
            delete expenseData.bukti_pembayaran
            await api.post(`/items/${entity}`, expenseData)
          } else if (entity === 'sales' && data.items) {
            // Handle sales dengan items
            const { items, ...salesData } = data
            
            // Create sales record first
            const salesResponse = await api.post(`/items/${entity}`, salesData)
            const createdSalesId = salesResponse.data.data.id
            
            // Create sales_items
            for (const item of items) {
              await api.post('/items/sales_items', {
                ...item,
                sales_id: createdSalesId
              })
            }
          } else if (entity === 'stock_opnames') {
            // Handle stock opnames
            await api.post(`/items/${entity}`, data)
          } else if (entity === 'stock_opname_items') {
            // Handle stock opname items
            await api.post(`/items/${entity}`, data)
          } else {
            await api.post(`/items/${entity}`, data)
          }

        break
      case 'update':
        if (entity === 'expenses') {
          await this.handleExpenseFileUpload(data, entity, 'update', entity_id)
        } else if (entity === 'purchase_orders' && data.items) {
          // console.log('ini adalah data di process queue item',data)
          // Handle purchase order update dengan items (untuk penerimaan PO)
          const { items, deletedItems, ...orderData } = data
          // console.log('items', items)
          // console.log('deletedItems', deletedItems)
          
          // Update purchase order first
          await api.patch(`/items/${entity}/${entity_id}`, orderData)
          
          // Hapus item yang dihapus dari server
          if (deletedItems && deletedItems.length > 0) {
            for (const deletedItem of deletedItems) {
              // console.log('Deleting po_item:', deletedItem.id)
              await api.delete(`/items/po_items/${deletedItem.id}`)
            }
          }
          
          // Pisahkan item yang sudah ada (dengan id) dan item baru (tanpa id)
          const existingItems = items.filter(item => item.id && item.id !== undefined)
          const newItems = items.filter(item => !item.id || item.id === undefined)
          // console.log('existingItems', existingItems)
          // console.log('newItems', newItems)
          // Update existing po_items
          if (existingItems.length > 0) {
            for (const item of existingItems) {
              /**
               * data item ketika proses penerimaan
               * alasan_penyusutan: null
               * bukti_penyusutan: null
               * harga_satuan: 12500
               * id: 36
               * jumlah_dapat_digunakan: 400
               * raw_material_id: 41
               * total_diterima: 400
               * total_penyusutan: 100
               * unit: "gr"
               */

              /**
               * data item ketika proses update
               * 0: 
               * item: "Item Test A"
               * quantity: 1600
               * raw_material_id: 41s
               * total_price: 60000
               * unit: "gr"
               */
              // console.log('Updating po_item:', item.id, 'with data:', JSON.stringify(item))
              
              // Tentukan field yang akan di-update berdasarkan data yang tersedia
              const updateData = {}
              
              // Untuk penerimaan PO (ada field total_diterima)
              if (item.total_diterima !== undefined) {
                updateData.total_diterima = item.total_diterima
                updateData.total_penyusutan = item.total_penyusutan
                updateData.alasan_penyusutan = item.alasan_penyusutan
                updateData.bukti_penyusutan = item.bukti_penyusutan
                updateData.jumlah_dapat_digunakan = item.jumlah_dapat_digunakan
              }
              
              // Untuk update biasa (edit PO)
              if (item.quantity !== undefined) {
                updateData.jumlah_pesan = item.quantity
              }
              if (item.price !== undefined) {
                updateData.harga_satuan = item.price
              }
              if (item.harga_satuan !== undefined) {
                updateData.harga_satuan = item.harga_satuan
              }
              if (item.jumlah_pesan !== undefined) {
                updateData.jumlah_pesan = item.jumlah_pesan
              }
              if (item.raw_material_id !== undefined) {
                updateData.raw_material_id = item.raw_material_id
              }
              if (item.unit !== undefined) {
                updateData.unit = item.unit
              }
              
              await api.patch(`/items/po_items/${item.id}`, updateData)
            }
          }
          // Create new po_items
          if (newItems.length > 0) {
            for (const item of newItems) {
              // console.log('Creating new po_item with data:', JSON.stringify(item))
              await api.post('/items/po_items', {
                raw_material_id: item.raw_material_id,
                item: item.raw_material_id,
                quantity: item.quantity,
                price: item.price,
                unit: item.unit,
                jumlah_pesan: item.quantity || item.jumlah_pesan,
                harga_satuan: item.price || item.harga_satuan,
                purchase_order: entity_id
              })
            }
          }
        } else if (entity === 'stock_opname_items') {
          // Handle stock opname items update
          await api.patch(`/items/${entity}/${entity_id}`, data)
        } else {
          await api.patch(`/items/${entity}/${entity_id}`, data)
        }
        break
      case 'delete':
        if (entity === 'stock_opname_items') {
          // Handle stock opname items delete
          await api.delete(`/items/${entity}/${entity_id}`)
        } else {
          await api.delete(`/items/${entity}/${entity_id}`)
        }
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
      // console.error(`Failed to pull ${entity}:`, error)
      return { success: false, message: error.message }
    }
  },
  
  // Initialize data sync
  async initializeSync() {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      console.log('Starting data synchronization with Directus...')
      
      // Pull master data first dengan clearExisting untuk memastikan data fresh
      await this.pullData('suppliers', { clearExisting: true })
      
      // Pull item_categories directly
      await this.pullData('item_categories', { clearExisting: true })
      await this.pullData('units', { clearExisting: true })
      await this.pullData('raw_materials', { clearExisting: true })
      await this.pullData('expense_categories', { clearExisting: true })
      await this.pullData('products', { clearExisting: true })
      await this.pullData('recipe_items', { clearExisting: true })
  
      // Clear purchase orders dan po_items sebelum pull data baru
      await db.purchase_orders.clear()
      await db.po_items.clear()
      
      // Pull purchase orders dengan denormalisasi
      await this.pullPurchaseOrdersWithDenormalization()
      
      // Clear log_inventory dan waste untuk data fresh
      await db.log_inventaris.clear()
      await db.waste.clear()
  
      // Process any pending sync items
      const syncResult = await this.processSyncQueue()
      
      console.log('Data synchronization completed successfully')
      return syncResult
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
  },

  // Tambahkan denormalisasi saat pull data
  async pullPurchaseOrdersWithDenormalization(id = null) {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      // ✅ Query 1: Ambil purchase_orders (dengan atau tanpa filter id)
      let ordersResponse
      if (id) {
        // Jika ada id, ambil purchase order spesifik
        ordersResponse = await api.get(`/items/purchase_orders/${id}`, {
          params: {
            fields: '*,supplier.*,pembuat_po.first_name,pembuat_po.last_name,penerima_barang.first_name,penerima_barang.last_name'
          }
        })
        // Wrap single item dalam array untuk konsistensi
        ordersResponse.data.data = [ordersResponse.data.data]
      } else {
        // Jika tidak ada id, ambil semua purchase orders
        ordersResponse = await api.get('/items/purchase_orders', {
          params: {
            fields: '*,supplier.*,pembuat_po.first_name,pembuat_po.last_name,penerima_barang.first_name,penerima_barang.last_name'
          }
        })
      }
  
      // console.log('ini data orders:', ordersResponse.data.data)
      
      // ✅ Query 2: Ambil po_items dengan filter yang tepat
      let itemsResponse
      if (id) {
        // Jika ada id, filter po_items berdasarkan purchase_order tertentu
        itemsResponse = await api.get('/items/po_items', {
          params: {
            filter: {
              purchase_order: {
                _eq: id
              }
            },
            fields: [
              '*',
              'item.id',
              'item.nama_item',
              'item.kategori.id',
              'item.kategori.name',
              'item.unit.id',
              'item.unit.name',
              'item.unit.abbreviation'
            ].join(',')
          }
        })
      } else {
        // Jika tidak ada id, ambil semua po_items
        const orderIds = ordersResponse.data.data.map(order => order.id)
        itemsResponse = await api.get('/items/po_items', {
          params: {
            filter: {
              purchase_order: {
                _in: orderIds
              }
            },
            fields: [
              '*',
              'item.id',
              'item.nama_item',
              'item.kategori.id',
              'item.kategori.name',
              'item.unit.id',
              'item.unit.name',
              'item.unit.abbreviation'
            ].join(',')
          }
        })
      }
      
      // console.log('ini data po_items:', itemsResponse.data.data)
      
      // ✅ Gabungkan data orders dengan items
      const ordersWithItems = ordersResponse.data.data.map(order => {
        const orderItems = itemsResponse.data.data.filter(
          item => item.purchase_order === order.id
        )
        
        return {
          ...order,
          items: orderItems // ✅ Struktur yang diinginkan
        }
      })
      
      const timestamp = new Date().getTime()
      
      // ✅ Transform dan simpan dengan denormalisasi lengkap
      for (const order of ordersWithItems) {
        const localOrder = {
          ...order,
          supplier_name: order.supplier?.nama_pt_toko,
          supplier_category: order.supplier?.kategori_supplier,
          pembuat_po_name: `${order.pembuat_po?.first_name || ''} ${order.pembuat_po?.last_name || ''}`.trim(),
          penerima_barang_name: `${order.penerima_barang?.first_name || ''} ${order.penerima_barang?.last_name || ''}`.trim(),
          supplier: order.supplier?.id,
          cached_at: timestamp
        }
        // console.log('Local order:', localOrder);
        await db.purchase_orders.put(localOrder)
        // console.log('order with items:', order)
        
        // ✅ Sekarang items sudah berisi data lengkap
        const poItems = order.items || []
        
        if (poItems && Array.isArray(poItems)) {
          // console.log('Processing po_items:', poItems)
          
          for (const item of poItems) {
            // Jika item adalah ID saja, skip karena tidak ada data detail
            if (typeof item === 'number' || typeof item === 'string') {
              console.warn(`Skipping item ${item} - no detail data available`)
              continue
            }
            
            const poItemData = {
              ...item,
              // ✅ Data sudah di-populate dari API
              item_name: item.item?.nama_item,
              item_category: item.item?.kategori?.id,
              item_category_name: item.item?.kategori?.name,
              unit_id: item.item?.unit?.id,
              unit_name: item.item?.unit?.name,
              unit_abbreviation: item.item?.unit?.abbreviation,
              item: item.item?.id,
              purchase_order: order.id,
              cached_at: timestamp
            }
            
            // console.log('Saving po_item:', poItemData)
            await db.po_items.put(poItemData)
          }
        } else {
          console.log('No po_items found for order:', order.id)
        }
      }
      
      // ✅ Return data yang konsisten
      return { 
        success: true, 
        data: id ? ordersWithItems[0] : ordersWithItems 
      }
    } catch (error) {
      console.error('Failed to pull purchase orders with denormalization:', error)
      return { success: false, message: error.message }
    }
  },

  // Update fungsi pullData untuk raw_materials
  async pullRawMaterialsWithDenormalization() {
    const response = await api.get('/items/raw_materials', {
      params: {
        fields: '*,kategori.name,unit.name,unit.abbreviation,supplier_utama.nama_pt_toko'
      }
    })
    
    const itemsToCache = response.data.data.map(item => ({
      ...item,
      kategori_name: item.kategori?.name,
      unit_name: item.unit?.name,
      unit_abbreviation: item.unit?.abbreviation,
      supplier_name: item.supplier_utama?.nama_pt_toko,
      cached_at: new Date().getTime()
    }))
    
    await db.raw_materials.bulkPut(itemsToCache)
  },

  // Create stock opname
  async createStockOpname(data) {
    try {
      // Clean data for API
      const cleanData = { ...data }
      delete cleanData.id
      delete cleanData.sync_status
      delete cleanData.cached_at
      
      if (this.isOnline()) {
        // If online, create directly via API
        const response = await api.post('/items/stock_opnames', cleanData)
        return { success: true, data: response.data.data }
      } else {
        // If offline, add to sync queue and store locally
        const localId = Date.now()
        const localData = { ...cleanData, id: localId, sync_status: 'pending' }
        
        // Store in local database
        await db.stock_opnames.add(localData)
        
        // Add to sync queue
        await db.sync_queue.add({
          entity: 'stock_opnames',
          entity_id: null,
          action: 'create',
          data: cleanData,
          created_at: new Date().toISOString()
        })
        
        return { success: true, data: localData }
      }
    } catch (error) {
      console.error('Error creating stock opname:', error)
      throw error
    }
  },

  // Update stock opname
  async updateStockOpname(id, data) {
    try {
      // Clean data for API
      const cleanData = { ...data }
      delete cleanData.id
      delete cleanData.sync_status
      delete cleanData.cached_at
      
      if (this.isOnline()) {
        // If online, update directly via API
        const response = await api.patch(`/items/stock_opnames/${id}`, cleanData)
        return { success: true, data: response.data.data }
      } else {
        // If offline, add to sync queue and update locally
        await db.stock_opnames.update(id, { ...cleanData, sync_status: 'pending' })
        
        // Add to sync queue
        await db.sync_queue.add({
          entity: 'stock_opnames',
          entity_id: id,
          action: 'update',
          data: cleanData,
          created_at: new Date().toISOString()
        })
        
        return { success: true, data: { ...cleanData, id } }
      }
    } catch (error) {
      console.error('Error updating stock opname:', error)
      throw error
    }
  },

  // Delete stock opname
  async deleteStockOpname(id) {
    try {
      if (this.isOnline()) {
        // If online, delete directly via API
        await api.delete(`/items/stock_opnames/${id}`)
        
        // Also delete from local database
        await db.stock_opnames.delete(id)
        
        return { success: true }
      } else {
        // If offline, mark as deleted locally and add to sync queue
        await db.stock_opnames.update(id, { sync_status: 'pending_delete' })
        
        // Add to sync queue
        await db.sync_queue.add({
          entity: 'stock_opnames',
          entity_id: id,
          action: 'delete',
          data: null,
          created_at: new Date().toISOString()
        })
        
        return { success: true }
      }
    } catch (error) {
      console.error('Error deleting stock opname:', error)
      throw error
    }
  },

  // Create stock opname item
  async createStockOpnameItem(data) {
    try {
      // Clean data for API
      const cleanData = { ...data }
      delete cleanData.id
      delete cleanData.sync_status
      delete cleanData.cached_at
      
      if (this.isOnline()) {
        // If online, create directly via API
        const response = await api.post('/items/stock_opname_items', cleanData)
        return { success: true, data: response.data.data }
      } else {
        // If offline, add to sync queue
        await db.sync_queue.add({
          entity: 'stock_opname_items',
          entity_id: null,
          action: 'create',
          data: cleanData,
          created_at: new Date().toISOString()
        })
        
        return { success: true, data: cleanData }
      }
    } catch (error) {
      console.error('Error creating stock opname item:', error)
      throw error
    }
  },

  // Update stock opname item
  async updateStockOpnameItem(id, data) {
    try {
      // Clean data for API
      const cleanData = { ...data }
      delete cleanData.id
      delete cleanData.sync_status
      delete cleanData.cached_at
      
      if (this.isOnline()) {
        // If online, update directly via API
        const response = await api.patch(`/items/stock_opname_items/${id}`, cleanData)
        return { success: true, data: response.data.data }
      } else {
        // If offline, add to sync queue
        await db.sync_queue.add({
          entity: 'stock_opname_items',
          entity_id: id,
          action: 'update',
          data: cleanData,
          created_at: new Date().toISOString()
        })
        
        return { success: true, data: cleanData }
      }
    } catch (error) {
      console.error('Error updating stock opname item:', error)
      throw error
    }
  },

  // Delete stock opname item
  async deleteStockOpnameItem(id) {
    try {
      if (this.isOnline()) {
        // If online, delete directly via API
        await api.delete(`/items/stock_opname_items/${id}`)
        
        // Also delete from local database
        await db.stock_opname_items.delete(id)
        
        return { success: true }
      } else {
        // If offline, mark as deleted locally and add to sync queue
        await db.stock_opname_items.update(id, { sync_status: 'pending_delete' })
        
        // Add to sync queue
        await db.sync_queue.add({
          entity: 'stock_opname_items',
          entity_id: id,
          action: 'delete',
          data: null,
          created_at: new Date().toISOString()
        })
        
        return { success: true }
      }
    } catch (error) {
      console.error('Error deleting stock opname item:', error)
      throw error
    }
  },

  // Pull stock opname with items
  async pullStockOpnameWithItems(id) {
    if (!this.isOnline()) {
      return { success: false, message: 'Device is offline' }
    }
    
    try {
      // Fetch stock opname with items
      const response = await api.get(`/items/stock_opnames/${id}`, {
        params: {
          fields: '*,items_opname.*,items_opname.nama_bahan.*'
        }
      })
      
      const opname = response.data.data
      const timestamp = new Date().getTime()
      
      // Save stock opname to local database
      await db.stock_opnames.put({
        ...opname,
        cached_at: timestamp
      })
      
      // Process and save items if they exist
      if (opname.items_opname && Array.isArray(opname.items_opname)) {
        for (const item of opname.items_opname) {
          await db.stock_opname_items.put({
            ...item,
            stock_opname_id: id,
            cached_at: timestamp
          })
        }
      }
      
      return { success: true, data: opname }
    } catch (error) {
      console.error(`Failed to fetch stock opname ${id} with items:`, error)
      return { success: false, message: error.message }
    }
  }
}

export default syncService

// Tambahkan metrics untuk monitoring denormalisasi
const denormalizationMetrics = {
  lastSync: null,
  itemsProcessed: 0,
  errors: []
}

// Fungsi untuk monitoring performa
function trackDenormalizationPerformance(operation, startTime) {
  const endTime = performance.now()
  console.log(`Denormalization ${operation} took ${endTime - startTime} milliseconds`)
}
