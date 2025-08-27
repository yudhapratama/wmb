import { ref, computed, onMounted } from 'vue'
import db from '../services/db'
import syncService from '../services/sync'
import salesService from '../services/salesService'

export function useDashboard() {
  const isLoading = ref(true)
  const error = ref(null)
  
  // Raw data
  const sales = ref([])
  const salesItems = ref([])
  const purchaseOrders = ref([])
  const poItems = ref([])
  const expenses = ref([])
  const products = ref([])
  const rawMaterials = ref([])
  const cookedItems = ref([])
  
  // Date filter (default to today)
  const selectedDate = ref(new Date().toISOString().split('T')[0])
  
  // 1. Total pendapatan dari penjualan produk (hari ini)
  const totalRevenue = computed(() => {
    const todaySales = sales.value.filter(sale => {
      const saleDate = new Date(sale.date_created).toISOString().split('T')[0]
      return saleDate === selectedDate.value
    })
    
    return todaySales.reduce((total, sale) => {
      return total + (parseFloat(sale.total) || parseFloat(sale.dibayarkan) || 0)
    }, 0)
  })
  
  // 2. Total margin yang didapatkan (hari ini)
  const totalMargin = computed(() => {
    const todaySales = sales.value.filter(sale => {
      const saleDate = new Date(sale.date_created).toISOString().split('T')[0]
      return saleDate === selectedDate.value
    })
    
    let totalMarginAmount = 0
    
    todaySales.forEach(sale => {
      const saleItems = salesItems.value.filter(item => item.sales_id === sale.id)
      saleItems.forEach(item => {
        const margin = parseFloat(item.margin_saat_transaksi) || 0
        const quantity = parseFloat(item.jumlah) || 0
        totalMarginAmount += margin * quantity
      })
    })
    
    return totalMarginAmount
  })
  
  // 3. Total pembayaran belanja yang dilakukan (PO dengan status completed/dibayar)
  const totalPaidPurchases = computed(() => {
    const paidPOs = purchaseOrders.value.filter(po => 
      po.status === 'Dibayar' || po.status === 'Completed'
    )
    
    return paidPOs.reduce((total, po) => {
      return total + (parseFloat(po.total_pembayaran) || 0)
    }, 0)
  })
  
  // 4. Total belanja yang belum dibayar (PO dengan status diterima)
  const totalUnpaidPurchases = computed(() => {
    const receivedPOs = purchaseOrders.value.filter(po => po.status === 'Diterima')
    
    let totalUnpaid = 0
    receivedPOs.forEach(po => {
      const items = poItems.value.filter(item => item.purchase_order === po.id)
      const poTotal = items.reduce((sum, item) => {
        const quantity = parseFloat(item.total_diterima) || parseFloat(item.jumlah_pesan) || 0
        const price = parseFloat(item.harga_satuan) || 0
        return sum + (quantity * price)
      }, 0)
      totalUnpaid += poTotal
    })
    
    return totalUnpaid
  })
  
  // 5. Tingkat penyusutan ketika belanja (rata-rata penyusutan dari PO yang diterima)
  const shrinkageRate = computed(() => {
    const receivedPOs = purchaseOrders.value.filter(po => po.status === 'Diterima')
    
    if (receivedPOs.length === 0) return 0
    
    let totalOrdered = 0
    let totalShrinkage = 0
    
    receivedPOs.forEach(po => {
      const items = poItems.value.filter(item => item.purchase_order === po.id)
      items.forEach(item => {
        const ordered = parseFloat(item.jumlah_pesan) || 0
        const shrinkage = parseFloat(item.total_penyusutan) || 0
        totalOrdered += ordered
        totalShrinkage += shrinkage
      })
    })
    
    return totalOrdered > 0 ? (totalShrinkage / totalOrdered) * 100 : 0
  })
  
  // 6. Top 5 produk paling laris di hari itu
  const topProducts = computed(() => {
    const todaySales = sales.value.filter(sale => {
      const saleDate = new Date(sale.date_created).toISOString().split('T')[0]
      return saleDate === selectedDate.value
    })
    
    const productSales = {}
    
    todaySales.forEach(sale => {
      const saleItems = salesItems.value.filter(item => item.sales_id === sale.id)
      saleItems.forEach(item => {
        const productId = item.product_id
        const quantity = parseFloat(item.jumlah) || 0
        const revenue = parseFloat(item.harga_jual_saat_transaksi) * quantity
        
        if (!productSales[productId]) {
          const product = products.value.find(p => p.id === productId)
          productSales[productId] = {
            id: productId,
            name: product?.nama_produk || 'Unknown Product',
            quantity: 0,
            revenue: 0
          }
        }
        
        productSales[productId].quantity += quantity
        productSales[productId].revenue += revenue
      })
    })
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  })
  
  // 7. Total expenses (hari ini)
  const totalExpenses = computed(() => {
    const todayExpenses = expenses.value.filter(expense => {
      const expenseDate = new Date(expense.tanggal).toISOString().split('T')[0]
      return expenseDate === selectedDate.value
    })
    
    return todayExpenses.reduce((total, expense) => {
      return total + (parseFloat(expense.jumlah) || 0)
    }, 0)
  })
  
  // 8. Top 3 expenses (hari ini)
  const topExpenses = computed(() => {
    const todayExpenses = expenses.value.filter(expense => {
      const expenseDate = new Date(expense.tanggal).toISOString().split('T')[0]
      return expenseDate === selectedDate.value
    })
    
    return todayExpenses
      .sort((a, b) => (parseFloat(b.jumlah) || 0) - (parseFloat(a.jumlah) || 0))
      .slice(0, 3)
      .map(expense => ({
        id: expense.id,
        name: expense.nama_pengeluaran,
        amount: parseFloat(expense.jumlah) || 0,
        category: expense.kategori
      }))
  })
  
  // 9. Top 5 stok bahan setengah jadi yang hampir habis
  const lowStockCookedItems = computed(() => {
    if (!cookedItems.value || cookedItems.value.length === 0) return []
    
    return cookedItems.value
      .filter(item => item.current_stock <= item.minimum_stock)
      .sort((a, b) => (a.current_stock / a.minimum_stock) - (b.current_stock / b.minimum_stock))
      .slice(0, 5)
      .map(item => ({
        id: item.id,
        name: item.name,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        unit_name: item.unit_name || 'pcs'
      }))
  })
  
  // Net profit calculation
  const netProfit = computed(() => {
    return totalRevenue.value + totalMargin.value - totalExpenses.value
  })

  // Active POs count (placeholder)
  const activePOs = computed(() => {
    // This would need to be calculated from purchase orders data
    // For now, returning 0 as placeholder
    return 0
  })

  // Low stock items count
  const lowStockItemsCount = computed(() => {
    if (!cookedItems.value || cookedItems.value.length === 0) return 0
    
    return cookedItems.value.filter(item => 
      item.current_stock <= item.minimum_stock
    ).length
  })
  
  // Load all required data
  async function loadDashboardData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Sync data if online
      if (syncService.isOnline()) {
        await Promise.all([
          syncService.pullData('sales'),
          syncService.pullData('sales_items'),
          syncService.pullData('purchase_orders'),
          syncService.pullData('po_items'),
          syncService.pullData('expenses'),
          syncService.pullData('products'),
          syncService.pullData('raw_materials'),
          syncService.pullData('cooked_items')
        ])
      }
      
      // Load from local database
      const [
        salesData,
        salesItemsData,
        purchaseOrdersData,
        poItemsData,
        expensesData,
        productsData,
        rawMaterialsData,
        cookedItemsData
      ] = await Promise.all([
        db.sales.toArray(),
        db.sales_items.toArray(),
        db.purchase_orders.toArray(),
        db.po_items.toArray(),
        db.expenses.toArray(),
        db.products.toArray(),
        db.raw_materials.toArray(),
        db.cooked_items.toArray()
      ])
      
      sales.value = salesData
      salesItems.value = salesItemsData
      purchaseOrders.value = purchaseOrdersData
      poItems.value = poItemsData
      expenses.value = expensesData
      products.value = productsData
      rawMaterials.value = rawMaterialsData
      cookedItems.value = cookedItemsData
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      error.value = `Failed to load dashboard data: ${err.message}`
    } finally {
      isLoading.value = false
    }
  }
  
  // Format currency helper
  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }
  
  // Format percentage helper
  function formatPercentage(value) {
    return `${(value || 0).toFixed(2)}%`
  }
  
  // Format number helper
  function formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number || 0)
  }
  
  // Format date helper
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Change selected date
  function changeDate(newDate) {
    selectedDate.value = newDate
  }
  
  // Handle date change event
  function handleDateChange(event) {
    selectedDate.value = event.target.value
    loadDashboardData()
  }
  
  // Initialize data on mount
  onMounted(() => {
    loadDashboardData()
  })
  
  return {
    // State
    isLoading,
    error,
    selectedDate,
    
    // Computed metrics
    totalRevenue,
    totalMargin,
    totalExpenses,
    totalPaidPurchases,
    totalUnpaidPurchases,
    shrinkageRate,
    topProducts,
    topExpenses,
    lowStockCookedItems,
    netProfit,
    activePOs,
    lowStockItemsCount,
    
    // Methods
    loadDashboardData,
    formatCurrency,
    formatPercentage,
    formatNumber,
    formatDate,
    changeDate,
    handleDateChange
  }
}