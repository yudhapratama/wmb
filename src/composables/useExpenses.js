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
  
  // Filtered expenses
  const filteredExpenses = computed(() => {
    let filtered = [...expenses.value]
    
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
        expense.kategori === selectedCategory.value
      )
    }
    
    // Filter by date
    if (selectedDateFilter.value !== 'all') {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      if (selectedDateFilter.value === 'today') {
        filtered = filtered.filter(expense => {
          const expenseDate = new Date(expense.tanggal).toISOString().split('T')[0]
          return expenseDate === todayStr
        })
      } else if (selectedDateFilter.value === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        filtered = filtered.filter(expense => 
          new Date(expense.tanggal) >= weekAgo
        )
      } else if (selectedDateFilter.value === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        filtered = filtered.filter(expense => 
          new Date(expense.tanggal) >= monthAgo
        )
      }
    }
    
    return filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  })
  
  // Get category name by ID
  function getCategoryName(categoryId) {
    const category = categories.value.find(c => c.id === categoryId)
    return category ? category.name : 'Uncategorized'
  }
  
  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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
      categories.value = categoriesData
      
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
      
      // Add to IndexedDB
      const id = await db.expenses.add(newExpense)
      newExpense.id = id
      
      // Add to sync queue
      await db.addToSyncQueue(
        'expenses',    // entity
        id,           // entity_id
        'create',     // action
        newExpense    // data
      )
      
      // Try to sync immediately if online
      try {
        await syncService.processSyncQueue()
      } catch (syncError) {
        console.warn('Failed to sync immediately, will retry later:', syncError)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, data: newExpense }
    } catch (err) {
      console.error('Error adding expense:', err)
      return { success: false, error: err.message }
    }
  }
  
  // Update expense
  async function updateExpense(expenseData) {
    try {
      const updatedExpense = {
        ...expenseData,
        sync_status: 'pending'
      }
      
      // Update in IndexedDB
      await db.expenses.update(expenseData.id, updatedExpense)
      
      // Add to sync queue
      await db.addToSyncQueue({
        table: 'expenses',
        action: 'update',
        data: updatedExpense,
        id: expenseData.id
      })
      
      // Try to sync immediately if online
      try {
        await syncService.processSyncQueue()
      } catch (syncError) {
        console.warn('Failed to sync immediately, will retry later:', syncError)
      }
      
      // Reload data
      await loadData()
      
      return { success: true, data: updatedExpense }
    } catch (err) {
      console.error('Error updating expense:', err)
      return { success: false, error: err.message }
    }
  }
  
  // Delete expense
  async function deleteExpense(expenseId) {
    try {
      // Remove from IndexedDB
      await db.expenses.delete(expenseId)
      
      // Add to sync queue
      await db.addToSyncQueue({
        table: 'expenses',
        action: 'delete',
        id: expenseId
      })
      
      // Try to sync immediately if online
      try {
        await syncService.processSyncQueue()
      } catch (syncError) {
        console.warn('Failed to sync immediately, will retry later:', syncError)
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
  
  // Calculate expenses by category
  const expensesByCategory = computed(() => {
    const categoryTotals = {}
    filteredExpenses.value.forEach(expense => {
      const categoryName = getCategoryName(expense.kategori)
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + parseFloat(expense.jumlah || 0)
    })
    return categoryTotals
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
    totalExpenses,
    expensesByCategory,
    
    // Methods
    loadData,
    addExpense,
    updateExpense,
    deleteExpense,
    getCategoryName,
    formatCurrency
  }
}