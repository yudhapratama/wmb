import { ref, computed, watch } from 'vue'
import api from '../services/api'
import db from '../services/db'
import { useNotification } from './useNotification'
import { useAuthStore } from '../stores/auth'

// ✅ PERBAIKAN: Buat shared state di luar function
const sharedCurrentSession = ref(null)
const isLoadingSession = ref(false)

export function useSales() {
  const { showNotification } = useNotification()
  const authStore = useAuthStore()
  const user = computed(() => authStore.user)

  // State
  const isLoading = ref(false)
  const sales = ref([])
  const salesSessions = ref([])
  const products = ref([])
  
  // ✅ PERBAIKAN: Gunakan shared state
  const currentSession = sharedCurrentSession

  // Filters
  const searchQuery = ref('')
  const selectedSession = ref('')
  const selectedPaymentMethod = ref('')
  const dateFilter = ref({
    start: '',
    end: ''
  })

  // Pagination
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const itemsPerPageOptions = [5, 10, 25, 50]

  // Payment methods from schema
  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'BRI', label: 'BRI' },
    { value: 'BNI', label: 'BNI' },
    { value: 'OVO', label: 'OVO' },
    { value: 'QR', label: 'QR' }
  ]

  // Computed properties
  const filteredSales = computed(() => {
    let filtered = sales.value

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(sale => {
        return (
          sale.id?.toString().includes(query) ||
          sale.mekanisme_pembayaran?.toLowerCase().includes(query) ||
          sale.sesi_penjualan?.cashier?.first_name?.toLowerCase().includes(query) ||
          sale.items?.some(item => 
            item.product?.nama_produk?.toLowerCase().includes(query)
          )
        )
      })
    }

    // Session filter
    if (selectedSession.value) {
      filtered = filtered.filter(sale => 
        sale.sesi_penjualan?.id === parseInt(selectedSession.value)
      )
    }

    // Payment method filter
    if (selectedPaymentMethod.value) {
      filtered = filtered.filter(sale => 
        sale.mekanisme_pembayaran === selectedPaymentMethod.value
      )
    }

    // Date filter
    if (dateFilter.value.start) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date_created)
        const startDate = new Date(dateFilter.value.start)
        return saleDate >= startDate
      })
    }

    if (dateFilter.value.end) {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.date_created)
        const endDate = new Date(dateFilter.value.end)
        endDate.setHours(23, 59, 59, 999) // Include full end date
        return saleDate <= endDate
      })
    }

    return filtered
  })

  const totalPages = computed(() => {
    return Math.ceil(filteredSales.value.length / itemsPerPage.value)
  })

  const paginatedSales = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredSales.value.slice(start, end)
  })

  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value + 1
    const end = Math.min(start + itemsPerPage.value - 1, filteredSales.value.length)
    const total = filteredSales.value.length
    return { start, end, total }
  })

  const sessionOptions = computed(() => {
    return salesSessions.value.map(session => ({
      value: session.id,
      label: `${session.cashier?.first_name || 'Unknown'} - ${new Date(session.waktu_buka).toLocaleDateString()}`
    }))
  })

  const isSessionActive = computed(() => {
    return currentSession.value && !currentSession.value.waktu_tutup
  })

  // Functions
  async function loadData() {
    isLoading.value = true
    try {
      await Promise.all([
        loadSales(),
        loadSalesSessions(),
        loadProducts(),
        loadCurrentSession()
      ])
    } catch (error) {
      console.error('Error loading sales data:', error)
      showNotification('Gagal memuat data penjualan', 'error')
    } finally {
      isLoading.value = false
    }
  }

  async function loadSales() {
    try {
      const response = await api.get('/items/sales', {
        params: {
          fields: [
            'id',
            'sesi_penjualan.id',
            'sesi_penjualan.cashier.first_name',
            'sesi_penjualan.waktu_buka',
            'mekanisme_pembayaran',
            'dibayarkan',
            'date_created',
            'items.id',
            'items.product_id.id',
            'items.product_id.nama_produk',
            'items.product_id.harga_jual',
            'items.jumlah',
            'items.harga_jual_saat_transaksi',
            'items.hpp_saat_transaksi',
            'items.margin_saat_transaksi'
          ].join(','),
          sort: '-date_created'
        }
      })
      sales.value = response.data.data || []
      console.log('Sales loaded:', sales.value)
      console.log('Sales count:', sales.value.length)
    } catch (error) {
      console.error('Error loading sales:', error)
      throw error
    }
  }

  async function loadSalesSessions() {
    try {
      console.log('Loading sales sessions...')
      const response = await api.get('/items/sales_sessions', {
        params: {
          fields: [
            'id',
            'modal_awal',
            'modal_akhir',  // ✅ TAMBAHKAN FIELD INI
            'modal_selisih',
            'waktu_buka',
            'waktu_tutup',
            'cashier.id',
            'cashier.first_name',
            'cashier.last_name'
          ].join(','),
          sort: '-waktu_buka'
        }
      })
      console.log('Sales sessions response:', response.data)
      console.log('Sales sessions data:', response.data.data)
      salesSessions.value = response.data.data || []
      console.log('salesSessions.value after assignment:', salesSessions.value)
    } catch (error) {
      console.error('Error loading sales sessions:', error)
      throw error
    }
  }

  async function loadProducts() {
    try {
      const response = await api.get('/items/products', {
        params: {
          fields: [
            'id',
            'nama_produk',
            'harga_jual',
            'harga_pokok',
            'kategori.name',
            'tipe_produk'
          ].join(','),
          sort: 'nama_produk'
        }
      })
      products.value = response.data.data || []
    } catch (error) {
      console.error('Error loading products:', error)
      throw error
    }
  }

  async function loadCurrentSession() {
    // ✅ PERBAIKAN: Cegah multiple loading
    if (isLoadingSession.value) {
      return currentSession.value
    }
    
    try {
      isLoadingSession.value = true
      
      const response = await api.get('/items/sales_sessions', {
        params: {
          fields: [
            'id',
            'modal_awal',
            'modal_akhir',  // ✅ TAMBAHKAN FIELD 
            'modal_selisih',
            'waktu_buka',
            'waktu_tutup',
            'cashier.id',
            'cashier.first_name',
            'cashier.last_name'
          ].join(','),
          filter: {
            waktu_tutup: { _null: true },
            cashier: { _eq: user.value?.id }
          },
          limit: 1
        }
      })
      
      const sessions = response.data.data || []
      currentSession.value = sessions.length > 0 ? sessions[0] : null
      
      // ✅ SIMPAN KE DATABASE LOKAL DENGAN ID YANG BENAR
      if (currentSession.value) {
        const cleanSession = {
          id: currentSession.value.id,
          modal_awal: currentSession.value.modal_awal,
          modal_akhir: currentSession.value.modal_akhir,  // ✅ TAMBAHKAN FIELD INI
          waktu_buka: currentSession.value.waktu_buka,
          waktu_tutup: currentSession.value.waktu_tutup,
          cashier_id: currentSession.value.cashier?.id,
          cashier_name: currentSession.value.cashier?.first_name,
          cached_at: new Date().getTime()
        }
        
        await db.sales_sessions.put(cleanSession)
        console.log('✅ Current session loaded:', currentSession.value)
      } else {
        console.warn('⚠️ No active session found')
      }
      
      return currentSession.value
    } catch (error) {
      console.error('Error loading current session:', error)
      throw error
    } finally {
      isLoadingSession.value = false
    }
  }

  async function createSale(saleData) {
    try {
      // Calculate totals
      const totalAmount = saleData.items.reduce((sum, item) => {
        return sum + (item.harga_jual_saat_transaksi * item.jumlah)
      }, 0)

      // Prepare sale data
      const newSale = {
        sesi_penjualan: currentSession.value.id,
        mekanisme_pembayaran: saleData.mekanisme_pembayaran,
        dibayarkan: saleData.dibayarkan || totalAmount,
        items: saleData.items.map(item => ({
          product_id: item.product_id,
          jumlah: item.jumlah,
          harga_jual_saat_transaksi: item.harga_jual_saat_transaksi,
          hpp_saat_transaksi: item.hpp_saat_transaksi,
          margin_saat_transaksi: item.margin_saat_transaksi
        }))
      }

      const response = await api.post('/items/sales', newSale)
      
      // Reload data to get updated list
      await loadSales()
      
      return response.data.data
    } catch (error) {
      console.error('Error creating sale:', error)
      throw error
    }
  }

  async function openSalesSession(sessionData) {
    try {
      // Tidak perlu menyertakan cashier karena sudah dikonfigurasi di Directus
      // untuk menyimpan current user ID secara otomatis
      const newSession = {
        modal_awal: sessionData.modal_awal,
        waktu_buka: new Date().toISOString()
        // Field cashier dihapus karena akan diisi otomatis oleh Directus
      }
  
      const response = await api.post('/items/sales_sessions', newSession)
      currentSession.value = response.data.data
      
      // Reload sessions
      await loadSalesSessions()
      
      return response.data.data
    } catch (error) {
      console.error('Error opening sales session:', error)
      throw error
    }
  }

  async function closeSalesSession(sessionId, closingData) {
    try {
      const updateData = {
        waktu_tutup: new Date().toISOString(),
        ...closingData
      }

      await api.patch(`/items/sales_sessions/${sessionId}`, updateData)
      currentSession.value = null
      
      // Reload sessions
      await loadSalesSessions()
      
    } catch (error) {
      console.error('Error closing sales session:', error)
      throw error
    }
  }

  // Pagination functions
  function changePage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage.value = newItemsPerPage
    currentPage.value = 1
  }

  function resetPagination() {
    currentPage.value = 1
  }

  // Filter functions
  function updateDateFilter(newDateFilter) {
    dateFilter.value = { ...newDateFilter }
  }

  function clearFilters() {
    searchQuery.value = ''
    selectedSession.value = ''
    selectedPaymentMethod.value = ''
    dateFilter.value = { start: '', end: '' }
    resetPagination()
  }

  // Watch for filter changes to reset pagination
  watch([searchQuery, selectedSession, selectedPaymentMethod, dateFilter], () => {
    resetPagination()
  }, { deep: true })

  return {
    // State
    isLoading,
    sales,
    salesSessions,
    products,
    currentSession,
    isLoadingSession,
    
    // Filters
    searchQuery,
    selectedSession,
    selectedPaymentMethod,
    dateFilter,
    
    // Computed
    filteredSales,
    paginatedSales,
    sessionOptions,
    paymentMethods,
    isSessionActive,
    
    // Pagination
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    totalPages,
    paginationInfo,
    changePage,
    changeItemsPerPage,
    resetPagination,
    
    // Functions
    loadData,
    loadSales,           // Tambahkan ini
    loadSalesSessions,   // Tambahkan ini jika belum ada
    loadProducts,        // Tambahkan ini jika belum ada
    loadCurrentSession,
    createSale,
    openSalesSession,
    closeSalesSession,
    updateDateFilter,
    clearFilters
  }
}