import { ref, computed } from 'vue'
import db from '../services/db'
import api from '../services/api'
import syncService from '../services/sync'

export function useExpenses() {
  // State
  const isLoading = ref(true)
  const expenses = ref([])
  const categories = ref([])
  const searchQuery = ref('')
  const selectedCategory = ref('all')
  const selectedDateFilter = ref('all')
  const error = ref(null)
  
  // Pagination state
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [10, 25, 50, 100]
  
  // Date filter state
  const dateFilter = ref({
    startDate: '',
    endDate: '',
    dateField: 'tanggal' // 'tanggal' for expenses
  })
  
  // Filtered expenses
  const filteredExpenses = computed(() => {
    let filtered = [...expenses.value]

    const toDateOnly = (value) => {
      if (!value) return ''
      if (typeof value === 'string') {
        if (value.includes('T')) {
          const date = new Date(value)
          if (isNaN(date.getTime())) return ''
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        return value.slice(0, 10)
      }
      const date = new Date(value)
      if (isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.nama_pengeluaran.toLowerCase().includes(query) ||
        expense.deskripsi?.toLowerCase().includes(query)
      )
    }
    
    // Filter by category
    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter(expense => 
        expense.kategori.id.toString() == selectedCategory.value
      )
    }
    
    // Filter by date
    if (selectedDateFilter.value !== 'all') {
      const now = new Date()

      if (selectedDateFilter.value === 'today') {
        const todayStr = toDateOnly(now)

        filtered = filtered.filter(expense => {
          const expenseDateStr = toDateOnly(expense.tanggal)
          return expenseDateStr === todayStr
        })

      } else if (selectedDateFilter.value === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)

        filtered = filtered.filter(expense => {
          const expenseTime = new Date(expense.tanggal).getTime()
          return expenseTime >= weekAgo.getTime()
        })

      } else if (selectedDateFilter.value === 'month') {
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)

        filtered = filtered.filter(expense => {
          const expenseTime = new Date(expense.tanggal).getTime()
          return expenseTime >= monthAgo.getTime()
        })
      }
    }
    
    // Filter by date range
    if (dateFilter.value.startDate || dateFilter.value.endDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = toDateOnly(expense[dateFilter.value.dateField])
        const startDate = dateFilter.value.startDate
        const endDate = dateFilter.value.endDate
        
        if (startDate && endDate) {
          return expenseDate >= startDate && expenseDate <= endDate
        } else if (startDate) {
          return expenseDate >= startDate
        } else if (endDate) {
          return expenseDate <= endDate
        }
        return true
      })
    }
    
    return filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  })
  
  // Paginated expenses
  const paginatedExpenses = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredExpenses.value.slice(start, end)
  })
  
  // Total pages
  const totalPages = computed(() => {
    return Math.ceil(filteredExpenses.value.length / itemsPerPage.value)
  })
  
  // Pagination info
  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(start + itemsPerPage.value - 1, filteredExpenses.value.length)
    const total = filteredExpenses.value.length
    
    return {
      start,
      end,
      total,
      currentPage: currentPage.value,
      totalPages: totalPages.value
    }
  })
  
  // Reset pagination when filters change
  function resetPagination() {
    currentPage.value = 1
  }
  
  // Change page
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }
  
  // Change items per page
  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage.value = newItemsPerPage
    resetPagination()
  }
  
  // Update date filter
  function updateDateFilter(newDateFilter) {
    dateFilter.value = { ...dateFilter.value, ...newDateFilter }
    resetPagination()
  }
  
  // Get category name by ID
  function getCategoryName(categoryId) {
    if (!categoryId) return 'Tidak ada kategori'
    
    const category = categories.value.find(c => c.id === categoryId)
    if (!category) {
      console.warn(`Category with ID ${categoryId} not found in:`, categories.value)
      return `Kategori ID: ${categoryId} (tidak ditemukan)`
    }
    
    return category.name
  }
  
  // Load data from API or IndexedDB
  async function loadData() {
    try {
      isLoading.value = true
      error.value = null
      
      // Load from IndexedDB first
      const [expensesData, categoriesData] = await Promise.all([
        db.expenses.orderBy('tanggal').reverse().toArray(),
        db.expense_categories.toArray()
      ])
      
      expenses.value = expensesData
      categories.value = categoriesData.map((v) => ({...v, id: v.id.toString()}))
      
      
      // Try to fetch fresh data from API if online
      try {
        const [expensesResponse, categoriesResponse] = await Promise.all([
          api.get('/items/expenses?fields=*,kategori.*&sort=-tanggal'),
          api.get('/items/expense_categories')
        ])
        
        if (expensesResponse.data?.data) {
          expenses.value = expensesResponse.data.data
          // Update IndexedDB cache
          await db.expenses.clear()
          await db.expenses.bulkAdd(expensesResponse.data.data.map(item => ({
            ...item,
            cached_at: new Date().toISOString()
          })))
        }
        
        if (categoriesResponse.data?.data) {
          categories.value = categoriesResponse.data.data
          // Update IndexedDB cache
          await db.expense_categories.clear()
          await db.expense_categories.bulkAdd(categoriesResponse.data.data.map(item => ({
            ...item,
            cached_at: new Date().toISOString()
          })))
        }
      } catch (apiError) {
        console.warn('Failed to fetch fresh data from API, using cached data:', apiError)
      }
    } catch (err) {
      console.error('Error loading expenses data:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }
  
  // Add new expense
  // ✅ PERBAIKAN - Konsisten dengan pola yang ada
  async function addExpense(expenseData) {
    try {
      const newExpense = {
        nama_pengeluaran: expenseData.nama_pengeluaran,
        kategori: expenseData.kategori,
        jumlah: expenseData.jumlah,
        deskripsi: expenseData.deskripsi || '',
        tanggal: expenseData.tanggal,
        metode_pembayaran: expenseData.metode_pembayaran,
        bukti_pembayaran: expenseData.bukti_pembayaran || null,
        sync_status: 'pending'
      }
      
      // Add to IndexedDB first
      const id = await db.expenses.add(newExpense)
      newExpense.id = id
      
      // Add to sync queue with consistent parameters
      if (syncService.isOnline()) {
        await db.addToSyncQueue('expenses', id, 'create', newExpense)
        await syncService.processSyncQueue()
      } else {
        await db.addToSyncQueue('expenses', id, 'create', newExpense)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, data: newExpense }
    } catch (err) {
      console.error('Error adding expense:', err)
      return { success: false, error: err.message }
    }
  }
  
  async function updateExpense(expenseData) {
    try {
      const updatedExpense = {
        ...expenseData,
        sync_status: 'pending'
      }
      
      // Update in IndexedDB first
      await db.expenses.update(expenseData.id, updatedExpense)
      
      // Add to sync queue with consistent parameters
      if (syncService.isOnline()) {
        await db.addToSyncQueue('expenses', expenseData.id, 'update', updatedExpense)
        await syncService.processSyncQueue()
      } else {
        await db.addToSyncQueue('expenses', expenseData.id, 'update', updatedExpense)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, data: updatedExpense }
    } catch (err) {
      console.error('Error updating expense:', err)
      return { success: false, error: err.message }
    }
  }
  
  async function deleteExpense(expenseId) {
    try {
      // Remove from IndexedDB first
      await db.expenses.delete(expenseId)
      
      // Add to sync queue with consistent parameters
      if (syncService.isOnline()) {
        await db.addToSyncQueue('expenses', expenseId, 'delete', { id: expenseId })
        await syncService.processSyncQueue()
      } else {
        await db.addToSyncQueue('expenses', expenseId, 'delete', { id: expenseId })
      }
      
      // Reload data
      await loadData()
      
      return { success: true }
    } catch (err) {
      console.error('Error deleting expense:', err)
      return { success: false, error: err.message }
    }
  }
  
  // Calculate total expenses for filtered results
  const totalExpenses = computed(() => {
    return filteredExpenses.value.reduce((sum, expense) => sum + parseFloat(expense.jumlah || 0), 0)
  })
  
  return {
    // State
    isLoading,
    expenses,
    categories,
    searchQuery,
    selectedCategory,
    selectedDateFilter,
    error,
    
    // Computed
    filteredExpenses,
    paginatedExpenses,
    totalExpenses,
    
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
    addExpense,
    updateExpense,
    deleteExpense,
    getCategoryName,
  }
}
