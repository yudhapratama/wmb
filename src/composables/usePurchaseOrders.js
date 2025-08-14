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
      // Try to fetch from API if online
      if (syncService.isOnline()) {
        const result = await syncService.pullPurchaseOrdersWithDenormalization(id)
        // console.log("data dari dapatkan detail order ketika open modal")
        // console.log(result)
        if (!result.success) {
          console.warn(`Failed to fetch order ${id} from API, falling back to local data`)
        } else {
          // Simpan po_items dari API response
          const order = result.data
          if (order.po_items && Array.isArray(order.po_items)) {
            for (const item of order.po_items) {
              await db.po_items.put({
                ...item,
                purchase_order: id, // ✅ Gunakan field name yang benar
                cached_at: new Date().getTime()
              })
            }
          }
          return { success: true, data: result.data }
        }
      }
      
      // Fall back to local data
      const order = await db.purchase_orders.get(id)
      if (!order) {
        return { success: false, error: 'Purchase order not found' }
      }
      
      // ✅ Perbaiki query po_items
      const items = await db.po_items
        .where('purchase_order')  // ✅ Gunakan field name yang benar
        .equals(id)
        .toArray()
      
      // Attach items ke order dengan nama yang konsisten
      order.po_items = items
      
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
      const orderItems = [...plainOrder.items]
      delete plainOrder.items
      
      // Update order in local database first
      await db.purchase_orders.update(plainOrder.id, {
        ...plainOrder,
        sync_status: 'pending'
      })
      
      // ✅ Perbaiki delete existing items
      await db.po_items
        .where('purchase_order')  // ✅ Gunakan field name yang benar
        .equals(plainOrder.id)
        .delete()
      
      // Add updated items dengan struktur yang benar
      for (const item of orderItems) {
        await db.po_items.add({
          purchase_order: plainOrder.id,  // ✅ Gunakan field name yang benar
          item: item.raw_material_id,
          item_name: item.item,
          jumlah_pesan: item.quantity,
          harga_satuan: item.total_price,
          unit_name: item.unit,
          sync_status: 'pending',
          cached_at: new Date().getTime()
        })
      }
      
      // Check if status is changed to "Diterima"
      const isReceived = plainOrder.status === 'Diterima'
      
      // If online, sync to server
      if (syncService.isOnline()) {
        // Add additional data for stock update if status is "Diterima"
        if (isReceived) {
          plainOrder.items = orderItems.map(item => ({
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
        }
        
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
    console.log('receiptData di usePurchaseOrder', receiptData)
    
    try {
      const orderId = receiptData.orderId
      const currentUserId = authStore.user?.id || 1 // Gunakan current user ID dengan fallback
      
      // 1. Update PO status menjadi "Diterima"
      const updateData = {
        status: 'Diterima',
        tanggal_penerimaan: new Date().toISOString().split('T')[0],
        penerima_barang: currentUserId, // Gunakan current user ID
        sync_status: 'pending',
        items: receiptData.items.map(item => ({
          id: item.id,
          raw_material_id: item.raw_material_id,
          total_diterima: item.total_diterima,
          total_penyusutan: item.total_penyusutan || 0,
          alasan_penyusutan: item.alasan_penyusutan,
          bukti_penyusutan: item.bukti_penyusutan,
          jumlah_dapat_digunakan: item.jumlah_dapat_digunakan,
          harga_satuan: item.harga_satuan,
          unit: item.unit
        }))        
      }
      
      await db.purchase_orders.update(orderId, updateData)
      
      // Tambahkan ke sync queue untuk update purchase order
      await db.addToSyncQueue('purchase_orders', orderId, 'update', updateData)
      
      // 2. Update items dengan data penerimaan
      // for (const item of receiptData.items) {
      //   const itemUpdateData = {
      //     total_diterima: item.total_diterima,
      //     total_penyusutan: item.total_penyusutan,
      //     alasan_penyusutan: item.alasan_penyusutan,
      //     bukti_penyusutan: item.bukti_penyusutan,
      //     jumlah_dapat_digunakan: item.jumlah_dapat_digunakan,
      //     sync_status: 'pending'
      //   }
        
      //   await db.po_items.update(item.id, itemUpdateData)
        
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
      // }
      
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