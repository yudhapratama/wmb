import api from './api.js'
import db from './db.js'
import syncService from './sync.js'

class SalesService {
  // Create sales transaction with items
  async createSalesTransaction(salesData) {
    try {
      const { items, ...saleInfo } = salesData
      
      // Hitung total dari semua items
      const total = items.reduce((sum, item) => {
        const hargaJual = item.harga_jual_saat_transaksi || item.harga_jual
        return sum + (hargaJual * item.quantity)
      }, 0)
      
      // Prepare sales data
      const salesRecord = {
        sesi_penjualan: saleInfo.sesi_penjualan || 1, // Default session ID
        mekanisme_pembayaran: saleInfo.mekanisme_pembayaran,
        total: total, // ✅ TAMBAHKAN FIELD TOTAL
        dibayarkan: saleInfo.dibayarkan,
        kembalian: saleInfo.kembalian || 0,
        sync_status: 'pending'
      }
      
      // Add to local database first
      const salesId = await db.sales.add(salesRecord)
      
      // Add sales items
      const salesItems = []
      for (const item of items) {
        const salesItem = {
          sales_id: salesId,
          product_id: item.product_id,
          jumlah: item.quantity,
          hpp_saat_transaksi: item.hpp_saat_transaksi || item.harga_pokok || 0,
          harga_jual_saat_transaksi: item.harga_jual_saat_transaksi || item.harga_jual,
          margin_saat_transaksi: item.margin_saat_transaksi || 
            ((item.harga_jual_saat_transaksi || item.harga_jual) - (item.hpp_saat_transaksi || item.harga_pokok || 0)),
          sync_status: 'pending'
        }
        
        const itemId = await db.sales_items.add(salesItem)
        salesItems.push({ ...salesItem, id: itemId })
      }
      
      // If online, sync to server
      if (syncService.isOnline()) {
        try {
          // Prepare data for API
          const apiData = {
            sesi_penjualan: salesRecord.sesi_penjualan,
            mekanisme_pembayaran: salesRecord.mekanisme_pembayaran,
            total: salesRecord.total, // ✅ TAMBAHKAN FIELD TOTAL
            dibayarkan: salesRecord.dibayarkan,
            kembalian: salesRecord.kembalian,
            items: salesItems.map(item => ({
              product_id: item.product_id,
              jumlah: item.jumlah,
              hpp_saat_transaksi: item.hpp_saat_transaksi,
              harga_jual_saat_transaksi: item.harga_jual_saat_transaksi,
              margin_saat_transaksi: item.margin_saat_transaksi
            }))
          }
          
          await db.addToSyncQueue('sales', salesId, 'create', apiData)
          await syncService.processSyncQueue()
        } catch (syncError) {
          console.warn('Failed to sync sales transaction immediately:', syncError)
        }
      } else {
        // Add to sync queue for later
        const syncData = {
          sesi_penjualan: salesRecord.sesi_penjualan,
          mekanisme_pembayaran: salesRecord.mekanisme_pembayaran,
          total: salesRecord.total, // ✅ TAMBAHKAN FIELD TOTAL
          dibayarkan: salesRecord.dibayarkan,
          kembalian: salesRecord.kembalian,
          items: salesItems.map(item => ({
            product_id: item.product_id,
            jumlah: item.jumlah,
            hpp_saat_transaksi: item.hpp_saat_transaksi,
            harga_jual_saat_transaksi: item.harga_jual_saat_transaksi,
            margin_saat_transaksi: item.margin_saat_transaksi
          }))
        }
        await db.addToSyncQueue('sales', salesId, 'create', syncData)
      }
      
      return {
        success: true,
        salesId,
        salesItems,
        message: 'Transaksi berhasil disimpan'
      }
      
    } catch (error) {
      console.error('Error creating sales transaction:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Get sales transactions
  async getSalesTransactions(filters = {}) {
    try {
      // Try to sync first if online
      if (syncService.isOnline()) {
        await syncService.pullData('sales')
        await syncService.pullData('sales_items')
      }
      
      // Load from local database
      let sales = await db.sales.toArray()
      
      // Apply filters if provided
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom)
        sales = sales.filter(sale => new Date(sale.date_created) >= dateFrom)
      }
      
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo)
        sales = sales.filter(sale => new Date(sale.date_created) <= dateTo)
      }
      
      if (filters.paymentMethod) {
        sales = sales.filter(sale => sale.mekanisme_pembayaran === filters.paymentMethod)
      }
      
      // Load items for each sale
      for (const sale of sales) {
        const items = await db.sales_items
          .where('sales_id')
          .equals(sale.id)
          .toArray()
        sale.items = items
      }
      
      return {
        success: true,
        data: sales
      }
      
    } catch (error) {
      console.error('Error getting sales transactions:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // Get sales summary/statistics
  async getSalesSummary(dateRange = {}) {
    try {
      const { data: sales } = await this.getSalesTransactions(dateRange)
      
      if (!sales || sales.length === 0) {
        return {
          success: true,
          data: {
            totalSales: 0,
            totalTransactions: 0,
            totalItems: 0,
            averageTransaction: 0,
            paymentMethods: {}
          }
        }
      }
      
      const summary = {
        totalSales: 0,
        totalTransactions: sales.length,
        totalItems: 0,
        paymentMethods: {}
      }
      
      sales.forEach(sale => {
        summary.totalSales += parseFloat(sale.dibayarkan || 0)
        summary.totalItems += sale.items?.reduce((sum, item) => sum + (item.jumlah || 0), 0) || 0
        
        // Count payment methods
        const method = sale.mekanisme_pembayaran || 'Unknown'
        summary.paymentMethods[method] = (summary.paymentMethods[method] || 0) + 1
      })
      
      summary.averageTransaction = summary.totalTransactions > 0 
        ? summary.totalSales / summary.totalTransactions 
        : 0
      
      return {
        success: true,
        data: summary
      }
      
    } catch (error) {
      console.error('Error getting sales summary:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new SalesService()