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
import { formatDateLong } from '../utils/helpers'
import DatatablesVue from './Datatables.vue'
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

function getPaymentMethodLabel(method) {
  const methods = {
    'cash': 'Cash',
    'transfer': 'Transfer',
    'debit': 'Kartu Debit'
  }
  return methods[method] || method
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
      @update:selectedCategory="selectedCategory = $event.toString()"
      :selectedDateFilter="selectedDateFilter"
      @update:selectedDateFilter="selectedDateFilter = $event"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
      :dateFilter="dateFilter"
      @update:dateFilter="console.log($event);dateFilter = $event"
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

    <div class="mt-6 grid grid-cols-1 gap-6">
      <DatatablesVue
        :data="paginatedExpenses"
        :loading="isLoading"
        :defaultItemsPerPage="itemsPerPage"
        @page-change="changePage($event)"
        @items-per-page-change="changeItemsPerPage(Number($event))"
      >
        <template #thead>
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Pengeluaran</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Tanggal</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Kategori</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Cara Bayar</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
          </tr>
        </template>

        <template #tbody="{ data }">
          <tr v-for="(expense, idx) in data" :key="expense.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ ((currentPage - 1) * itemsPerPage) + idx + 1 }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <div class="flex gap-2 items-center">
                <div class="p-2 rounded-lg">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                {{ expense.nama_pengeluaran }}
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 12a2 2 0 002 2h6a2 2 0 002-2L15 7" />
                </svg>
                {{ formatDateLong(expense.tanggal) }}
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ getCategoryName(expense.kategori?.id) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ getPaymentMethodLabel(expense.metode_pembayaran) }}
            </td>
            <td>
              <div class="flex gap-2">
                <button 
                  @click="viewExpenseDetails(expense)"
                  class="p-2.5 border border-gray-300 rounded-md text-blue-600 hover:bg-blue-50"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <PermissionBasedAccess collection="suppliers" action="update">
                  <button 
                    @click="editExpense(expense)"
                    class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </PermissionBasedAccess>
                <PermissionBasedAccess collection="suppliers" action="delete">
                  <button 
                    @click="confirmDelete(expense)"
                    class="p-2.5 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </PermissionBasedAccess>
              </div>
            </td>
          </tr>
        </template>

        <template #empty>
          <div class="col-span-full text-center py-12">
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
        </template>
      </DatatablesVue>
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