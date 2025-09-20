import { ref, computed, onMounted } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'
import { useAuthStore } from '../stores/auth'

export function usePurchaseOrders() {
  const authStore = useAuthStore()
  
  // State
  const isLoading = ref(true)
  const purchaseOrders = ref([])
  const searchQuery = ref('')
  const selectedStatus = ref('all')
  const selectedSupplier = ref('all')
  const error = ref(null)
  
  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [5, 10, 25, 50, 100]
  
  // Date filter state
  const dateFilter = ref({
    startDate: '',
    endDate: '',
    dateField: 'date_created' // 'date_created' or 'date_updated'
  })
  
  // Filtered purchase orders with date filter
  const filteredOrders = computed(() => {
    let filtered = [...purchaseOrders.value]
    
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(order => {
        const orderNumber = order.id?.toString() || ''
        const supplierName = order.supplier_name || order.supplier?.nama_pt_toko || ''
        const createdBy = order.pembuat_po_name || order.pembuat_po?.first_name || ''
        
        return orderNumber.toLowerCase().includes(query) ||
               supplierName.toLowerCase().includes(query) ||
               createdBy.toLowerCase().includes(query)
      })
    }
    
    // Status filter
    if (selectedStatus.value !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus.value)
    }
    
    // Supplier filter
    if (selectedSupplier.value !== 'all') {
      filtered = filtered.filter(order => 
        (order.supplier_name || order.supplier?.nama_pt_toko) === selectedSupplier.value
      )
    }
    
    // Date filter
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      filtered = filtered.filter(order => {
        const dateField = dateFilter.value.dateField
        const orderDate = order[dateField]
        
        if (!orderDate) return false
        
        const date = new Date(orderDate).toISOString().split('T')[0]
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
    return Math.ceil(filteredOrders.value.length / itemsPerPage.value)
  })
  
  const paginatedOrders = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredOrders.value.slice(start, end)
  })
  
  const paginationInfo = computed(() => {
    const start = filteredOrders.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(currentPage.value * itemsPerPage.value, filteredOrders.value.length)
    const total = filteredOrders.value.length
    
    return { start, end, total }
  })
  
  // Pagination methods
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage.value = newItemsPerPage
    currentPage.value = 1 // Reset to first page
  }
  
  function resetPagination() {
    currentPage.value = 1
  }
  
  // Date filter methods
  function updateDateFilter(newDateFilter) {
    dateFilter.value = { ...newDateFilter }
    resetPagination() // Reset pagination when filter changes
  }

  // Load purchase orders
  async function loadData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Try to fetch from API first if online
      if (syncService.isOnline()) {
        // ✅ Gunakan pullPurchaseOrdersWithDenormalization untuk mengambil po_items sekaligus
        const result = await syncService.pullPurchaseOrdersWithDenormalization()
        // console.log("result dari load data dengan po_items:", result);
        
        if (!result.success) {
          console.warn('Failed to fetch from API, falling back to local data')
        }
      }
      
      // Load from local database with descending order by date_created
      const localOrders = await db.purchase_orders
        .orderBy('date_created')
        .reverse() // This makes it descending order
        .toArray()
      // console.log("ini data setelah call api -> simpan di local -> lalu panggil lagi localOrders:", localOrders);
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
  
  // Auto-load data when composable is used
  onMounted(() => {
    loadData()
  })
  
  // Fetch a specific purchase order with details
  // Perbaiki fetchOrderDetail function
  async function fetchOrderDetail(id) {
    isLoading.value = true
    error.value = null
    
    try {
      // console.log(`🔍 Fetching order detail for ID: ${id}`)
      
      // Try to fetch from API if online
      if (syncService.isOnline()) {
        // console.log('📡 Fetching from API...')
        const result = await syncService.pullPurchaseOrdersWithDenormalization(id)
        // console.log('API result:', result)
        
        if (!result.success) {
          console.warn(`Failed to fetch order ${id} from API, falling back to local data`)
        } else {
          // Simpan po_items dari API response
          const order = result.data
          // console.log('Order from API:', order)
          // console.log('po_items from API:', order.po_items)
          // console.log('items from API:', order.items) // ✅ API menggunakan field 'items', bukan 'po_items'
          
          if (order.items && Array.isArray(order.items)) {
            // console.log(`💾 Saving ${order.items.length} po_items to local DB`)
            for (const item of order.items) {
              await db.po_items.put({
                ...item,
                purchase_order: id, // ✅ Gunakan field name yang benar
                cached_at: new Date().getTime()
              })
            }
          }
          
          // ✅ Perbaiki: API response menggunakan field 'items', bukan 'po_items'
          // Rename field untuk konsistensi dengan kode lainnya
          order.po_items = order.items
          delete order.items // Hapus field items untuk menghindari konfusi
          
          return { success: true, data: order }
        }
      }
      
      // console.log('💾 Fetching from local database...')
      // Fall back to local data
      const order = await db.purchase_orders.get(id)
      if (!order) {
        // console.error(`❌ Purchase order ${id} not found in local DB`)
        return { success: false, error: 'Purchase order not found' }
      }
      
      // console.log('Order from local DB:', order)
      
      // ✅ Perbaiki query po_items
      const items = await db.po_items
        .where('purchase_order')  // ✅ Gunakan field name yang benar
        .equals(id)
        .toArray()
      
      // console.log(`📦 Found ${items.length} po_items for order ${id}:`, items)
      
      // Attach items ke order dengan nama yang konsisten
      order.po_items = items
      
      // console.log('Final order data with po_items:', order)
      return { success: true, data: order }
    } catch (err) {
      // console.error(`Error fetching purchase order ${id}:`, err)
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
      
      // Map form data ke struktur Directus
      const directusOrder = {
        status: plainOrder.status || 'Dibuat',
        supplier: parseInt(plainOrder.supplier), // Pastikan ini integer
        catatan_pembelian: plainOrder.notes || '',
        date_created: new Date().toISOString(),
        sync_status: 'pending'
      }
      
      // Validasi supplier
      if (!plainOrder.supplier || isNaN(parseInt(plainOrder.supplier))) {
        throw new Error('Supplier ID tidak valid')
      }
      
      // Add order to local database
      const orderId = await db.purchase_orders.add(directusOrder)
      
      // Add order items dengan struktur Directus
      // Perbaiki struktur po_items
      for (const item of orderItems) {
        await db.po_items.add({
          purchase_order: orderId, // Gunakan 'purchase_order' bukan 'purchase_order_id'
          item: item.raw_material_id,
          jumlah_pesan: item.quantity,
          harga_satuan: item.total_price,
          sync_status: 'pending'
        })
      }
      
      // TAMBAHKAN LOGIKA SYNC YANG HILANG
      // If online, sync to server
      if (syncService.isOnline()) {
        // Siapkan data untuk sync dengan items
        const syncData = {
          ...directusOrder,
          items: orderItems.map(item => ({
            purchase_order: orderId,
            item: item.raw_material_id,
            jumlah_pesan: item.quantity,
            harga_satuan: item.total_price
          }))
        }
        
        await db.addToSyncQueue('purchase_orders', orderId, 'create', syncData)
        await syncService.processSyncQueue()
      } else {
        // Add to sync queue for later
        const syncData = {
          ...directusOrder,
          items: orderItems.map(item => ({
            purchase_order: orderId,
            item: item.raw_material_id,
            jumlah_pesan: item.quantity,
            harga_satuan: item.total_price
          }))
        }
        await db.addToSyncQueue('purchase_orders', orderId, 'create', syncData)
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
  // Perbaiki updatePurchaseOrder function
  async function updatePurchaseOrder(order) {
    isLoading.value = true
    error.value = null

    try {
      const plainOrder = JSON.parse(JSON.stringify(order))
      // data order disini reactive, mengikuti perubahan yang terjadi di form
      
      // mengeluarkan data items sehingga terpisah dari data order nya
      const orderItems = [...plainOrder.items]
      
      // ✅ Validasi: Purchase Order harus memiliki minimal 1 item
      if (!orderItems || orderItems.length === 0) {
        throw new Error('Purchase Order harus memiliki minimal 1 item')
      }
          
      delete plainOrder.items

      // mendapatkan purchase order id
      const orderId = plainOrder.orderNumber
      
      // ✅ PENTING: Gunakan snapshot dari EditModal jika tersedia, jika tidak ambil dari database
      let originalItemsInDb
      if (plainOrder._originalItemsSnapshot && plainOrder._originalItemsSnapshot.length >= 0) {
        originalItemsInDb = plainOrder._originalItemsSnapshot
        console.log('🎯 Menggunakan snapshot dari EditModal:', originalItemsInDb)
      } else {
        originalItemsInDb = await db.po_items.where('purchase_order').equals(orderId).toArray()
        console.log('📂 Menggunakan data dari database (fallback):', originalItemsInDb)
      }
      
      // Hapus field snapshot dari plainOrder
      delete plainOrder._originalItemsSnapshot
      
      // mempersiapkan payload untuk dikirim ke directus
      const directusOrder = {
        supplier: parseInt(plainOrder.supplier), // Pastikan ini integer
        catatan_pembelian: plainOrder.notes || '',
        date_created: new Date().toISOString(),
        sync_status: 'pending'
      }     

      // Validasi supplier
      if (!plainOrder.supplier || isNaN(parseInt(plainOrder.supplier))) {
        throw new Error('Supplier ID tidak valid')
      }      

      // Update data purchase order in local database first
      await db.purchase_orders.update(orderId, directusOrder)
      
      // tujuannya adalah hapus yang lama dan tambahkan data yang baru instead of update satu satu
      await db.po_items
        .where('purchase_order')  // ✅ Gunakan field name yang benar
        .equals(orderId)
        .delete()

      // Add items dengan struktur yang benar
      for (const item of orderItems) {
        await db.po_items.add({
          purchase_order: orderId,  // ✅ Gunakan field name yang benar
          item: item.raw_material_id,
          item_name: item.item,
          jumlah_pesan: item.quantity,
          harga_satuan: item.total_price,
          unit_name: item.unit,
          sync_status: 'pending',
          cached_at: new Date().getTime()
        })
      }
      
      // TODO: Perludicek lagi karena sepertinya tidak diperlukan mengingat fungsi terima ada di receivePurchaseOrder()
      // Check if status is changed to "Diterima"
      const isReceived = directusOrder.status === 'Diterima'
      
      // If online, sync to server
      if (syncService.isOnline()) {
        // TODO: Bisa abaikan dulu untukfungsi di dalam block receive ini
        // Add additional data for stock update if status is "Diterima"
        if (isReceived) {
          directusOrder.items = orderItems.map(item => ({
            id: item.id,
            raw_material_id: item.raw_material_id,
            item: item.item,
            jumlah_pesan: item.quantity,
            harga_satuan: item.price,
            unit: item.unit,
            received_quantity: item.received_quantity || 0,
            shrinkage: item.shrinkage || 0,
            usable_quantity: item.usable_quantity || 0
          }))
        } else {
          // Format untuk update biasa (status "Dibuat", "Selesai", dll)
          // Pisahkan item yang sudah ada (dengan id) dan item baru (tanpa id)
          const existingItems = orderItems.filter(item => item.id && item.id !== undefined)
          const newItems = orderItems.filter(item => !item.id || item.id === undefined)
          console.log('existingItems', existingItems)
          console.log('newItems', newItems)          
          // Gunakan snapshot originalItemsInDb untuk mendeteksi item yang dihapus
          const currentItemIds = existingItems.map(item => item.id)
          const deletedItems = originalItemsInDb.filter(dbItem => !currentItemIds.includes(dbItem.id))
          console.log('originalItemsInDb (snapshot):', originalItemsInDb)
          console.log('currentItemIds', currentItemIds)
          console.log('deletedItems', deletedItems)
          directusOrder.items = [
            // Item yang sudah ada - untuk di-update
            ...existingItems.map(item => ({
              id: item.id,
              raw_material_id: item.raw_material_id,
              item: item.item,
              quantity: item.quantity,
              price: item.total_price,
              unit: item.unit,
              jumlah_pesan: item.quantity,
              harga_satuan: item.total_price
            })),
            // Item baru - untuk di-create
            ...newItems.map(item => ({
              raw_material_id: item.raw_material_id,
              item: item.raw_material_id,
              quantity: item.quantity,
              price: item.total_price,
              unit: item.unit,
              jumlah_pesan: item.quantity,
              harga_satuan: item.total_price,
              purchase_order: orderId
            }))
          ]
          
          // Tambahkan informasi item yang dihapus
          if (deletedItems.length > 0) {
            directusOrder.deletedItems = deletedItems.map(item => ({
              id: item.id
            }))
          }
        }
        console.log('plainOrder', directusOrder)
        await db.addToSyncQueue('purchase_orders', orderId, 'update', directusOrder)
        await syncService.processSyncQueue()
      } else {
        // Format untuk offline sync
        const existingItems = orderItems.filter(item => item.id && item.id !== undefined)
        const newItems = orderItems.filter(item => !item.id || item.id === undefined)
        
        // Gunakan snapshot originalItemsInDb untuk mendeteksi item yang dihapus
        const currentItemIds = existingItems.map(item => item.id)
        const deletedItems = originalItemsInDb.filter(dbItem => !currentItemIds.includes(dbItem.id))
        
        directusOrder.items = [
          // Item yang sudah ada - untuk di-update
          ...existingItems.map(item => ({
            id: item.id,
            raw_material_id: item.raw_material_id,
            item: item.item,
            quantity: item.quantity,
            price: item.total_price,
            unit: item.unit,
            jumlah_pesan: item.quantity,
            harga_satuan: item.total_price
          })),
          // Item baru - untuk di-create
          ...newItems.map(item => ({
            raw_material_id: item.raw_material_id,
            item: item.raw_material_id,
            quantity: item.quantity,
            price: item.total_price,
            unit: item.unit,
            jumlah_pesan: item.quantity,
            harga_satuan: item.total_price,
            purchase_order: orderId
          }))
        ]
        
        // Tambahkan informasi item yang dihapus
        if (deletedItems.length > 0) {
          directusOrder.deletedItems = deletedItems.map(item => ({
            id: item.id
          }))
        }
        
        // Add to sync queue for later
        await db.addToSyncQueue('purchase_orders', orderId, 'update', directusOrder)
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
      // PENTING: Hapus po_items terlebih dahulu
      await db.po_items
        .where('purchase_order')  // Pastikan menggunakan 'purchase_order', bukan 'purchase_order_id'
        .equals(id)
        .delete()
      
      // Kemudian hapus purchase order
      await db.purchase_orders.delete(id)
      
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

  // Tambahkan fungsi untuk proses penerimaan
  // Perbaiki fungsi receivePurchaseOrder untuk menggunakan current user ID
  async function receivePurchaseOrder(receiptData) {
    isLoading.value = true
    error.value = null
    console.log('receiptData di usePurchaseOrder', JSON.stringify(receiptData))
    
    try {
      const orderId = receiptData.id // Gunakan id dari receiptData
      const currentUserId = authStore.user?.id || receiptData.penerima_barang // Gunakan current user ID dengan fallback
      
      // 1. Update PO status menjadi "Diterima"
      const updateData = {
        status: 'Diterima',
        tanggal_penerimaan: receiptData.tanggal_penerimaan || new Date().toISOString().split('T')[0],
        penerima_barang: currentUserId, // Gunakan current user ID
        sync_status: 'pending',
        items: receiptData.items.map(item => {
          console.log(`Item ${item.id} bukti_penyusutan:`, item.bukti_penyusutan)
          return {
            id: item.id,
            raw_material_id: item.raw_material_id,
            total_diterima: item.total_diterima,
            total_penyusutan: item.total_penyusutan || 0,
            alasan_penyusutan: item.alasan_penyusutan,
            bukti_penyusutan: item.bukti_penyusutan, // Pastikan ini adalah ID file yang diupload
            jumlah_dapat_digunakan: item.jumlah_dapat_digunakan,
            harga_satuan: item.harga_satuan,
            unit: item.unit
          }
        })        
      }
      
      await db.purchase_orders.update(orderId, updateData)

      console.log('setelah update local data updateData', updateData)
      
      // Tambahkan ke sync queue untuk update purchase order
      await db.addToSyncQueue('purchase_orders', orderId, 'update', updateData)
      
      // 2. Update items dengan data penerimaan
      for (const item of receiptData.items) {
        const itemUpdateData = {
          total_diterima: item.total_diterima,
          total_penyusutan: item.total_penyusutan,
          alasan_penyusutan: item.alasan_penyusutan,
          bukti_penyusutan: item.bukti_penyusutan,
          jumlah_dapat_digunakan: item.jumlah_dapat_digunakan,
          sync_status: 'pending'
        }
        
        await db.po_items.update(item.id, itemUpdateData)
        
      //   // Tambahkan ke sync queue untuk update po_items
      //   await db.addToSyncQueue('po_items', item.id, 'update', itemUpdateData)
        
      //   // 3. update existing intentory
      //   // 4. Update atau tambah data di raw_material
      //   const materialId = item.raw_material_id
      //   if (!materialId) {
      //     console.error('Material ID tidak valid:', item)
      //     continue
      //   }  

      //   const existingMaterial = await db.raw_materials.get(materialId)
      //   console.log('existingMaterial', existingMaterial);
        
      //   if (existingMaterial) {
      //     // stok yang ada saat ini
      //     const currentStock = existingMaterial.total_stock || 0
      //     // harga rata-rata saat ini
      //     const currentPrice = existingMaterial.harga_rata_rata || 0
      //     // harga per unit saat ini
      //     const currentStockPricePerUnit = currentPrice / currentStock
      //     // stok yang diterima dan dapat digunakan
      //     const receivedStock = item.jumlah_dapat_digunakan
      //     // harga beli stok yang diterima
      //     const receivedStockPrice = item.harga_satuan // abaikan penamaan harga_satuan karena sebenaranya ini adalah harga beli
      //     // harga per unit ketika diterima
      //     const receivedStockPricePerUnit = receivedStockPrice / receivedStock

      //     // mulai ini hitung untuk disimpan menjadi stok baru dan harga rata-rata baru
      //     const newStock = currentStock + receivedStock
      //     // harga baru per unit
      //     const newStockPricePerUnit = ((currentStockPricePerUnit * currentStock) + (receivedStockPricePerUnit * receivedStock)) / newStock
      //     // harga baru rata-rata
      //     const totalNewStockPrice = newStockPricePerUnit * newStock
          
      //     const materialUpdateData = {
      //       total_stock: newStock,
      //       harga_rata_rata: totalNewStockPrice,
      //       sync_status: 'pending'
      //     }
          
      //     await db.raw_materials.update(materialId, materialUpdateData)
          
      //     // Tambahkan ke sync queue untuk raw_materials
      //     await db.addToSyncQueue('raw_materials', materialId, 'update', materialUpdateData)
      //   } else {
      //     // Jika material belum ada, buat baru
      //     const newMaterialData = {
      //       id: materialId,
      //       nama_item: item.nama_item || 'Unknown',
      //       total_stock: item.jumlah_dapat_digunakan,
      //       harga_rata_rata: item.harga_satuan || 0,
      //       sync_status: 'pending',
      //       cached_at: new Date().getTime()
      //     }
          
      //     await db.raw_materials.add(newMaterialData)
          
      //     // Tambahkan ke sync queue untuk raw_materials
      //     await db.addToSyncQueue('raw_materials', materialId, 'create', newMaterialData)
      //   }

      //   // 4. Input data ke log_inventory
      //   const logInventoryData = {
      //     item: item.raw_material_id,
      //     tipe_transaksi: 'PENERIMAAN_PO',
      //     perubahan_jumlah: item.jumlah_dapat_digunakan,
      //     stok_sebelum: existingMaterial.total_stock || 0,
      //     stok_setelah: (item.jumlah_dapat_digunakan + existingMaterial.total_stock),
      //     dokumen_sumber: `${orderId}`,
      //     pengguna: currentUserId, // Gunakan current user ID
      //     waktu_log: new Date().toISOString(),
      //     sync_status: 'pending',
      //     cached_at: new Date().getTime()
      //   }
      //   console.log('logInventoryData', logInventoryData);
        
      //   await db.log_inventaris.add(logInventoryData)
        
      //   // Tambahkan ke sync queue untuk log_inventaris
      //   await db.addToSyncQueue('log_inventaris', logInventoryData.id, 'create', logInventoryData)      
        
        // 5. Tambahkan data ke waste jika ada penyusutan
        // if (item.total_penyusutan > 0) {
        //   const wasteData = {
        //     id: `waste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        //     raw_material: item.item?.id || item.item,
        //     jenis: 'Penyusutan',
        //     jumlah: item.total_penyusutan,
        //     unit: item.unit, // Gunakan unit langsung dari item
        //     alasan: item.alasan_penyusutan,
        //     keterangan: item.alasan_penyusutan, // Perbaiki field name
        //     bukti_foto: item.bukti_penyusutan,
        //     tanggal: new Date().toISOString().split('T')[0],
        //     user_id: 1,
        //     purchase_order_id: orderId,
        //     sync_status: 'pending',
        //     cached_at: new Date().getTime()
        //   }
          
        //   await db.waste.add(wasteData)
        // }
      }
      
      // 6. Sync ke server jika online
      if (syncService.isOnline()) {
        await syncService.processSyncQueue()
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error receiving purchase order:', err)
      error.value = `Failed to receive purchase order: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // Fungsi untuk membayar dan menyelesaikan purchase order
  // Perbaiki fungsi payPurchaseOrder
  async function payPurchaseOrder(paymentData) {
    isLoading.value = true
    error.value = null
    
    try {
      const updateData = {
        status: 'Selesai',
        tanggal_pembayaran: paymentData.tanggal_pembayaran,
        total_pembayaran: paymentData.total_pembayaran,
        bukti_bayar: paymentData.bukti_bayar,
        catatan_pembayaran: paymentData.catatan_pembayaran,
        sync_status: 'pending'
      }
      
      // Update local database
      await db.purchase_orders.update(paymentData.orderId, updateData)
      
      // Add to sync queue
      if (syncService.isOnline()) {
        await db.addToSyncQueue('purchase_orders', paymentData.orderId, 'update', updateData)
        await syncService.processSyncQueue()
      } else {
        await db.addToSyncQueue('purchase_orders', paymentData.orderId, 'update', updateData)
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error paying purchase order:', err)
      error.value = `Failed to pay purchase order: ${err.message}`
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // Export semua state dan methods
  return {
    // State
    isLoading,
    purchaseOrders,
    filteredOrders,
    paginatedOrders,
    searchQuery,
    selectedStatus,
    selectedSupplier,
    error,
    
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
    
    // Methods
    loadData,
    fetchOrderDetail,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    payPurchaseOrder
  }
}