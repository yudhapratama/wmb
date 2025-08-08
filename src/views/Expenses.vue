<script setup>
import { ref, onMounted, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import ExpenseCard from '../components/features/expenses/ExpenseCard.vue'
import ExpenseFilters from '../components/features/expenses/ExpenseFilters.vue'
import AddExpenseModal from '../components/features/expenses/modals/AddExpenseModal.vue'
import EditExpenseModal from '../components/features/expenses/modals/EditExpenseModal.vue'
import DetailModal from '../components/features/expenses/modals/DetailModal.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import { useExpenses } from '../composables/useExpenses'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'

// Get offline status
const { isOffline } = useOfflineStatus()

// Use expenses composable
const {
  isLoading,
  expenses,
  categories,
  searchQuery,
  selectedCategory,
  selectedDateFilter,
  filteredExpenses,
  paginatedExpenses,
  totalExpenses,
  loadData,
  addExpense,
  updateExpense,
  deleteExpense,
  getCategoryName,
  formatCurrency,
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
  updateDateFilter
} = useExpenses()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const currentExpense = ref(null)
const expenseToDelete = ref(null)

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

// Watch for filter changes to reset pagination
watch([searchQuery, selectedCategory, selectedDateFilter, dateFilter], () => {
  resetPagination()
}, { deep: true })

// Load data on mount
onMounted(async () => {
  await loadData()
})

// View expense details
function viewExpenseDetails(expense) {
  currentExpense.value = { ...expense }
  showDetailModal.value = true
}

// Edit expense
function editExpense(expense) {
  currentExpense.value = { ...expense }
  showEditModal.value = true
}

// Confirm delete
function confirmDelete(expense) {
  expenseToDelete.value = expense
  showDeleteModal.value = true
}

// Handle add expense
// In the handleAddExpense function
const handleAddExpense = async (submitData) => {
  try {
    // First create the expense
    const result = await addExpense(submitData.data)
    
    if (result.success && result.data) {
      // Then upload file with the expense ID
      if (submitData.uploadFile) {
        const fileId = await submitData.uploadFile(result.data.id)
        
        // Update expense with file ID if uploaded
        if (fileId) {
          await updateExpense({
            ...result.data,
            bukti_pembayaran: fileId
          })
        }
      }
      
      showAddModal.value = false
      showSuccessNotification('Pengeluaran berhasil ditambahkan')
    } else {
      showErrorNotification(`Gagal menambahkan pengeluaran: ${result.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error adding expense:', error)
    showErrorNotification('Gagal menambahkan pengeluaran')
  }
}

// Handle update expense
async function handleUpdateExpense(updatedExpense) {
  const result = await updateExpense(updatedExpense)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Pengeluaran berhasil diperbarui')
  } else {
    showErrorNotification(`Gagal memperbarui pengeluaran: ${result.error || 'Unknown error'}`)
  }
}

// Handle delete expense
async function handleDeleteExpense() {
  if (expenseToDelete.value) {
    const result = await deleteExpense(expenseToDelete.value.id)
    if (result.success) {
      showDeleteModal.value = false
      expenseToDelete.value = null
      showSuccessNotification('Pengeluaran berhasil dihapus')
    } else {
      showErrorNotification(`Gagal menghapus pengeluaran: ${result.error || 'Unknown error'}`)
    }
  }
}

function showSuccessNotification(message) {
  notificationMessage.value = message
  notificationType.value = 'success'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

function showErrorNotification(message) {
  notificationMessage.value = message
  notificationType.value = 'error'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}
</script>

<template>
  <AppLayout>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tracking Pengeluaran</h1>
        <p class="text-gray-600">Catat dan monitor pengeluaran operasional harian</p>
      </div>
      <PermissionBasedAccess collection="expenses" action="create">
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Pengeluaran
        </button>
      </PermissionBasedAccess>
    </div>
    
    
    <!-- Filters -->
    <ExpenseFilters
      :categories="categories"
      :selectedCategory="selectedCategory"
      @update:selectedCategory="selectedCategory = $event"
      :selectedDateFilter="selectedDateFilter"
      @update:selectedDateFilter="selectedDateFilter = $event"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
    />
    
    <!-- Pagination Info -->
    <div class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        Menampilkan {{ paginationInfo.start }} - {{ paginationInfo.end }} dari {{ paginationInfo.total }} pengeluaran
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">Tampilkan:</label>
        <select
          :value="itemsPerPage"
          @change="changeItemsPerPage(Number($event.target.value))"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[70px]"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <span class="text-sm text-gray-700">per halaman</span>
      </div>
    </div>
    
    <!-- Expenses List -->
    <div class="mt-4 grid grid-cols-1 gap-6">
      <div v-if="isLoading" class="col-span-full text-center py-12">
        <svg class="animate-spin h-8 w-8 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Loading expenses...</p>
      </div>
      
      <div v-else-if="paginatedExpenses.length === 0" class="col-span-full text-center py-12">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600">Tidak ada pengeluaran yang ditemukan</p>
        <PermissionBasedAccess collection="expenses" action="create">
          <button
            @click="showAddModal = true"
            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Pengeluaran Pertama
          </button>
        </PermissionBasedAccess>
      </div>
      
      <ExpenseCard
        v-for="expense in paginatedExpenses"
        :key="expense.id"
        :expense="expense"
        :getCategoryName="getCategoryName"
        :formatCurrency="formatCurrency"
        @view="viewExpenseDetails"
        @edit="editExpense"
        @delete="confirmDelete"
      />
    </div>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <nav class="flex items-center gap-2">
        <!-- Previous button -->
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sebelumnya
        </button>
        
        <!-- Page numbers -->
        <template v-for="page in Math.min(totalPages, 7)" :key="page">
          <button
            v-if="page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)"
            @click="changePage(page)"
            :class="[
              'px-3 py-2 text-sm font-medium border rounded-md',
              page === currentPage
                ? 'text-red-600 bg-red-50 border-red-500'
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <span v-else-if="page === currentPage - 3 || page === currentPage + 3" class="px-2 py-2 text-gray-500">
            ...
          </span>
        </template>
        
        <!-- Next button -->
        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Selanjutnya
        </button>
      </nav>
    </div>
    
    <!-- Modals -->
    <AddExpenseModal
      :isOpen="showAddModal"
      :categories="categories"
      :isLoading="isLoading"
      @close="showAddModal = false"
      @submit="handleAddExpense"
    />
    
    <EditExpenseModal
      :isOpen="showEditModal"
      :expense="currentExpense"
      :categories="categories"
      :isLoading="isLoading"
      @close="showEditModal = false"
      @submit="handleUpdateExpense"
    />
    
    <DetailModal
      :isOpen="showDetailModal"
      :expense="currentExpense"
      :categories="categories"
      @close="showDetailModal = false"
      @edit="editExpense"
    />
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="showDeleteModal"
      title="Hapus Pengeluaran"
      message="Apakah Anda yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan."
      @confirm="handleDeleteExpense"
      @cancel="showDeleteModal = false"
    />
    
    <!-- Notification -->
    <div 
      v-if="showNotification" 
      :class="[notificationType === 'success' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800']"
      class="fixed bottom-4 right-4 px-4 py-3 rounded-md border-l-4 shadow-md"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg v-if="notificationType === 'success'" class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">{{ notificationMessage }}</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>