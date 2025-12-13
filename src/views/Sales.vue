<template>
  <AppLayout>
    <!-- Mode POS -->
    <div v-if="isPosMode" class="pos-mode">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center text-blue-800">
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h1 class="text-xl font-bold">Mode POS - Sesi #{{ selectedSessionId }}</h1>
              <p class="text-sm">Antarmuka Point of Sale untuk transaksi cepat</p>
            </div>
          </div>
          <button 
            @click="$router.push('/sales')"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Sales
          </button>
        </div>
      </div>
      
      <!-- Konten Mode POS -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Panel Produk -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-semibold mb-4">Pilih Produk</h2>
          <div class="text-center py-8 text-gray-500">
            <p>Interface POS untuk memilih produk akan ditambahkan di sini</p>
          </div>
        </div>
        
        <!-- Panel Keranjang -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-semibold mb-4">Keranjang Belanja</h2>
          <div class="text-center py-8 text-gray-500">
            <p>Keranjang belanja dan checkout akan ditambahkan di sini</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mode Normal Sales -->
    <div v-else class="sales-page">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Penjualan</h1>
          <p class="text-gray-600">Kelola transaksi penjualan dan sesi kasir</p>
        </div>
        <div class="flex gap-3">
          <!-- Session Status -->
          <div v-if="isSessionActive" class="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div class="flex items-center text-green-800">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm font-medium">Sesi Aktif: {{ currentSession?.cashier?.first_name }}</span>
            </div>
          </div>
          <div v-else class="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <div class="flex items-center text-red-800">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span class="text-sm font-medium">Tidak Ada Sesi Aktif</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <PermissionBasedAccess collection="sales_sessions" action="create">
            <button
              v-if="!isSessionActive"
              @click="showSessionModal = true"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Buka Sesi Kasir
            </button>
            <button
              v-else
              @click="openCloseSessionModal(salesSessions.find(v => v.waktu_tutup == null))"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Tutup Sesi
            </button>
          </PermissionBasedAccess>
          
          <PermissionBasedAccess collection="sales" action="create">
            <button
              @click="showAddModal = true"
              :disabled="!isSessionActive"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Transaksi Baru
            </button>
          </PermissionBasedAccess>
        </div>
      </div>

      <!-- Offline Status -->
      <div v-if="isOffline" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span class="text-yellow-800">Mode Offline - Data mungkin tidak terbaru</span>
        </div>
      </div>

      <!-- Filters -->
      <SalesFilters
        :search-query="searchQuery"
        :selected-session="selectedSession"
        :selected-payment-method="selectedPaymentMethod"
        :date-filter="dateFilter"
        :session-options="sessionOptions"
        :payment-methods="paymentMethods"
        @update:search-query="searchQuery = $event"
        @update:selected-session="selectedSession = $event"
        @update:selected-payment-method="selectedPaymentMethod = $event"
        @update:date-filter="dateFilter = $event"
        @clear-filters="clearFilters"
        @update-date-filter="updateDateFilter"
        class="mb-6"
      />

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Sales Sessions List -->
      <div v-else-if="!isLoading && paginatedSalesSessions.length > 0" class="space-y-4">
        <SalesSessionCard
          v-for="session in paginatedSalesSessions"
          :key="session.id"
          :session="session"
          :sales="sales"
          @open-pos="openPosMode"
          @view-session-detail="viewSessionDetail"
          @close-session="openCloseSessionModal"
        />
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading" class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada sesi penjualan</h3>
        <p class="text-gray-600 mb-4">Mulai buka sesi kasir pertama Anda</p>
        <PermissionBasedAccess collection="sales_sessions" action="create">
          <button
            @click="showSessionModal = true"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Buka Sesi Kasir
          </button>
        </PermissionBasedAccess>
      </div>

      <!-- Pagination -->
      <div v-if="totalSessionPages > 1" class="mt-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Menampilkan {{ sessionPaginationInfo.start }} - {{ sessionPaginationInfo.end }} dari {{ sessionPaginationInfo.total }} sesi
          </div>
          <div class="flex items-center space-x-2">
            <select
              v-model="itemsPerPage"
              @change="changeItemsPerPage(itemsPerPage)"
              class="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                {{ option }} per halaman
              </option>
            </select>
            <div class="flex space-x-1">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <button
                v-for="page in Math.min(totalSessionPages, 5)"
                :key="page"
                @click="changePage(page)"
                :class="[
                  'px-3 py-1 border text-sm rounded',
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalSessionPages"
                class="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddSaleModal
      v-if="showAddModal"
      :show="showAddModal"
      :current-session="currentSession"
      @close="showAddModal = false"
      @save="handleAddSale"
    />

    <DetailSaleModal
      v-if="showDetailModal && currentSale"
      :show="showDetailModal"
      :sale="currentSale"
      @close="showDetailModal = false"
    />

    <OpenSessionModal
      v-if="showSessionModal"
      :isOpen="showSessionModal"
      @close="showSessionModal = false"
      @save="handleOpenSession"
    />

    <CloseSessionModal
      v-if="showCloseSessionModal && selectedSessionForModal"
      :isOpen="showCloseSessionModal"
      :session="selectedSessionForModal"
      :sales="sales.filter(s => s.sesi_penjualan?.id === selectedSessionForModal.id)"
      @close="showCloseSessionModal = false"
      @save="handleCloseSession"
    />

    <!-- Session Transactions Modal -->
    <Modal
      v-if="showSessionTransactionsModal && selectedSessionForModal"
      :isOpen="showSessionTransactionsModal"
      :title="`Transaksi Sesi #${selectedSessionForModal.id}`"
      size="2xl"
      @close="showSessionTransactionsModal = false"
    >
      <div class="space-y-4">
        <div v-if="sessionTransactions.length > 0">
          <SalesCard
            v-for="sale in sessionTransactions"
            :key="sale.id"
            :sale="sale"
            @view="viewSaleDetails"
          />
        </div>
        <div v-else class="text-center py-8">
          <p class="text-gray-600">Belum ada transaksi dalam sesi ini</p>
        </div>
      </div>
    </Modal>
    <SessionDetailModal
      :show="showSessionDetailModal"
      :session="selectedSessionForDetail"
      @close="closeSessionDetailModal"
    />
  </AppLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router' // Tambahkan import useRoute
import AppLayout from '../components/layout/AppLayout.vue'
import SalesCard from '../components/features/sales/SalesCard.vue'
import SalesSessionCard from '../components/features/sales/SalesSessionCard.vue'
import SalesFilters from '../components/features/sales/SalesFilters.vue'
import AddSaleModal from '../components/features/sales/modals/AddSaleModal.vue'
import DetailSaleModal from '../components/features/sales/modals/DetailSaleModal.vue'
import SessionDetailModal from '../components/features/sales/modals/SessionDetailModal.vue'
import OpenSessionModal from '../components/features/sales/modals/OpenSessionModal.vue'
import CloseSessionModal from '../components/features/sales/modals/CloseSessionModal.vue'
import Modal from '../components/ui/Modal.vue'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'
import { useSales } from '../composables/useSales'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import { useNotification } from '../composables/useNotification'
const { showNotification } = useNotification()
export default {
  name: 'Sales',
  components: {
    AppLayout,
    SalesCard,
    SalesSessionCard,
    SalesFilters,
    AddSaleModal,
    DetailSaleModal,
    OpenSessionModal,
    CloseSessionModal,
    Modal,
    PermissionBasedAccess,
    SessionDetailModal
  },
  setup() {
    const {
      isLoading,
      sales,
      salesSessions,
      currentSession,
      searchQuery,
      selectedSession,
      selectedPaymentMethod,
      dateFilter,
      currentPage,
      itemsPerPage,
      itemsPerPageOptions,
      paymentMethods,
      filteredSales,
      totalPages,
      paginatedSales,
      paginationInfo,
      sessionOptions,
      isSessionActive,
      loadData,
      loadSales,
      loadSalesSessions,
      loadCurrentSession,
      addSale,
      updateSale,
      deleteSale,
      openSalesSession, // Ganti dari openSession ke openSalesSession
      closeSalesSession, // Ganti dari closeSession ke closeSalesSession
      changePage,
      changeItemsPerPage,
      clearFilters,
      updateDateFilter
    } = useSales()

    const { isOffline } = useOfflineStatus()
    
    // Modals
    const showAddModal = ref(false)
    const showDetailModal = ref(false)
    const showSessionModal = ref(false)
    const showCloseSessionModal = ref(false)
    const showSessionTransactionsModal = ref(false)
    const currentSale = ref(null)
    const selectedSessionForModal = ref(null)
    const showSessionDetailModal = ref(false);
    const selectedSessionForDetail = ref(null);

    // Computed properties for sessions
    const filteredSalesSessions = computed(() => {
      // Tunggu hingga salesSessions benar-benar tersedia dan memiliki data
      if (!salesSessions?.value || !Array.isArray(salesSessions.value)) {
        return []
      }
      
      let filtered = salesSessions.value
      
      // Search filter
      if (searchQuery?.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(session => {
          return (
            session.id?.toString().includes(query) ||
            session.cashier?.first_name?.toLowerCase().includes(query) ||
            session.cashier?.last_name?.toLowerCase().includes(query)
          )
        })
      }
      
      // Date filter
      if (dateFilter?.value?.start) {
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.waktu_buka)
          const startDate = new Date(dateFilter.value.start)
          return sessionDate >= startDate
        })
      }
      
      if (dateFilter?.value?.end) {
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.waktu_buka)
          const endDate = new Date(dateFilter.value.end)
          endDate.setHours(23, 59, 59, 999)
          return sessionDate <= endDate
        })
      }

      return filtered
    })

    // Tambahkan computed property yang hilang
    const totalSessionPages = computed(() => {
      if (!filteredSalesSessions.value || !Array.isArray(filteredSalesSessions.value)) {
        return 0
      }
      if (!itemsPerPage?.value) {
        return 1
      }
      return Math.ceil(filteredSalesSessions.value.length / itemsPerPage.value)
    })

    const paginatedSalesSessions = computed(() => {
      // Pastikan filteredSalesSessions tersedia
      if (!filteredSalesSessions.value || !Array.isArray(filteredSalesSessions.value)) {
        return []
      }
      
      if (!currentPage?.value || !itemsPerPage?.value) {
        return filteredSalesSessions.value // Return all data if pagination not ready
      }
      
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredSalesSessions.value.slice(start, end)
    })
    
    const sessionPaginationInfo = computed(() => {
      // Pengecekan yang lebih robust
      if (!filteredSalesSessions || !filteredSalesSessions.value) return { start: 0, end: 0, total: 0 }
      if (!currentPage || !currentPage.value || !itemsPerPage || !itemsPerPage.value) return { start: 0, end: 0, total: 0 }
      
      const start = (currentPage.value - 1) * itemsPerPage.value + 1
      const end = Math.min(start + itemsPerPage.value - 1, filteredSalesSessions.value.length)
      return {
        start: filteredSalesSessions.value.length ? start : 0,
        end: filteredSalesSessions.value.length ? end : 0,
        total: filteredSalesSessions.value.length
      }
    })
    
    const sessionTransactions = computed(() => {
      if (!selectedSessionForModal || !selectedSessionForModal.value) return []
      if (!sales || !sales.value) return []
      return sales.value.filter(sale => 
        sale.sesi_penjualan?.id === selectedSessionForModal.value.id
      )
    })

    // Tambahkan useRoute untuk mendeteksi mode POS
    const route = useRoute()
    
    // Tambahkan computed properties untuk mode POS
    const isPosMode = computed(() => {
      return route.query.session !== undefined
    })
    
    const selectedSessionId = computed(() => {
      return route.query.session
    })
    
    // Functions
    function viewSaleDetails(sale) {
      currentSale.value = sale
      showDetailModal.value = true
    }

    function viewSessionTransactions(session) {
      selectedSessionForModal.value = session
      showSessionTransactionsModal.value = true
    }

    function openPosMode(session) {
      // Open POS mode in new tab
      const posUrl = `/pos?session=${session.id}`
      window.open(posUrl, '_blank')
    }

    function handleAddSale(saleData) {
      addSale(saleData)
      showAddModal.value = false
    }

    function handleOpenSession(sessionData) {
      openSalesSession(sessionData) // Ganti dari openSession ke openSalesSession
      showSessionModal.value = false
    }

    function handleCloseSession(sessionData) {
      console.log('Closing session with data:', sessionData)
      console.log('Selected session:', selectedSessionForModal.value)
      console.log('Sales for session:', sales.value.filter(s => s.sesi_penjualan?.id === selectedSessionForModal.value.id))
      
      // ✅ PERBAIKAN: Gunakan selectedSessionForModal bukan currentSession
      if (selectedSessionForModal.value?.id) {
        closeSalesSession(selectedSessionForModal.value.id, sessionData)
          .then(() => {
            showNotification('Sesi berhasil ditutup', 'success')
            showCloseSessionModal.value = false
            selectedSessionForModal.value = null // Reset selected session
            // Reload data setelah menutup sesi
            loadData()
          })
          .catch((error) => {
            console.error('Error closing session:', error)
            showNotification('Gagal menutup sesi', 'error')
          })
      } else {
        console.error('No selected session to close')
        showNotification('Tidak ada sesi yang dipilih untuk ditutup', 'error')
      }
    }

    // Tambahkan fungsi yang hilang
    function viewSessionDetail(session) {
      selectedSessionForDetail.value = session
      showSessionDetailModal.value = true
    }

    function closeSessionDetailModal() {
      showSessionDetailModal.value = false
      selectedSessionForDetail.value = null
    }

    // Tambahkan fungsi yang hilang
    function openCloseSessionModal(session) {
      selectedSessionForModal.value = session
      showCloseSessionModal.value = true
    }

    onMounted(() => {
      loadData()
    })

    return {
      // State
      isLoading,
      sales,
      salesSessions,
      currentSession,
      searchQuery,
      selectedSession,
      selectedPaymentMethod,
      dateFilter,
      currentPage,
      itemsPerPage,
      itemsPerPageOptions,
      paymentMethods,
      isOffline,
      
      // Computed
      filteredSales,
      totalPages,
      paginatedSales,
      paginationInfo,
      sessionOptions,
      isSessionActive,
      filteredSalesSessions,
      totalSessionPages,
      paginatedSalesSessions,
      sessionPaginationInfo,
      sessionTransactions,
      isPosMode,
      selectedSessionId,
      
      // Modals
      showAddModal,
      showDetailModal,
      showSessionModal,
      showCloseSessionModal,
      showSessionTransactionsModal,
      showSessionDetailModal,  // Tambahkan ini
      currentSale,
      selectedSessionForModal,
      selectedSessionForDetail,  // Tambahkan ini
      
      // Functions
      loadData,
      changePage,
      changeItemsPerPage,
      clearFilters,
      updateDateFilter,
      viewSaleDetails,
      viewSessionTransactions,
      openPosMode,
      handleAddSale,
      handleOpenSession,
      handleCloseSession,
      viewSessionDetail,
      closeSessionDetailModal,
      openCloseSessionModal,  // Tambahkan ini
    }
  }
}
</script>