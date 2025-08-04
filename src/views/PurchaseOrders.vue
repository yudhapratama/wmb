<template>
  <AppLayout title="Purchase Orders Management">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Purchase Orders</h1>
      <PermissionBasedAccess collection="purchase_orders" action="create">
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon class="w-5 h-5" />
          Tambah Purchase Order
        </button>
      </PermissionBasedAccess>
    </div>
    
    <!-- Filters -->
    <PurchaseOrderFilters
      :suppliers="suppliers"
      :selectedStatus="selectedStatus"
      @update:selectedStatus="selectedStatus = $event"
      :selectedSupplier="selectedSupplier"
      @update:selectedSupplier="selectedSupplier = $event"
      :searchQuery="searchQuery"
      @update:searchQuery="searchQuery = $event"
      :dateFilter="dateFilter"
      @update:dateFilter="updateDateFilter"
    />
    
    <!-- Pagination Info -->
    <div class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        Menampilkan {{ paginationInfo.start }} - {{ paginationInfo.end }} dari {{ paginationInfo.total }} purchase order
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">Tampilkan:</label>
        <select
          :value="itemsPerPage"
          @change="changeItemsPerPage(Number($event.target.value))"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <span class="text-sm text-gray-700">per halaman</span>
      </div>
    </div>
    
    <!-- Purchase Orders List -->
    <div class="mt-4 grid grid-cols-1 gap-6">
      <div v-if="isLoading" class="col-span-full text-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Loading purchase orders...</p>
      </div>
      
      <div v-else-if="paginatedOrders.length === 0" class="col-span-full text-center py-12">
        <ArchiveBoxIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600">Tidak ada purchase order yang ditemukan</p>
        <PermissionBasedAccess collection="purchase_orders" action="create">
          <button
            @click="showAddModal = true"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <PlusIcon class="w-5 h-5" />
            Buat Order Pertama
          </button>
        </PermissionBasedAccess>
      </div>
      
      <PurchaseOrderCard
        v-for="order in paginatedOrders"
        :key="order.id"
        :order="order"
        @edit="openEditModal"
        @delete="confirmDelete"
        @receive="openReceiveModal"
        @pay="openPayModal"
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
                ? 'text-blue-600 bg-blue-50 border-blue-500'
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
    <AddPurchaseOrderModal
      :isOpen="showAddModal"
      :suppliers="suppliers"
      :isLoading="isLoading"
      @close="showAddModal = false"
      @submit="handleAddOrder"
    />
    
    <EditPurchaseOrderModal
      :isOpen="showEditModal"
      :order="editingOrder"
      :suppliers="suppliers"
      :isLoading="isLoading"
      @close="showEditModal = false"
      @submit="handleUpdateOrder"
    />
    
    <ReceivePurchaseOrderModal
      :isOpen="showReceiveModal"
      :order="receivingOrder"
      :isLoading="isLoading"
      @close="showReceiveModal = false"
      @submit="handleReceiveOrder"
    />
    
    <PayPurchaseOrderModal
      :isOpen="showPayModal"
      :order="payingOrder"
      :isLoading="isLoading"
      @close="showPayModal = false"
      @submit="handlePayOrder"
    />
    
    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      v-if="isConfirmDeleteOpen"
      title="Hapus Purchase Order"
      message="Apakah Anda yakin ingin menghapus purchase order ini? Tindakan ini tidak dapat dibatalkan."
      @confirm="deleteOrder"
      @cancel="isConfirmDeleteOpen = false"
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

<script setup>
import { ref, onMounted, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import PurchaseOrderFilters from '../components/features/purchase-orders/PurchaseOrderFilters.vue'
import PurchaseOrderCard from '../components/features/purchase-orders/PurchaseOrderCard.vue'
import { usePurchaseOrders } from '../composables/usePurchaseOrders'
import { useSuppliers } from '../composables/useSuppliers'
import { useInventory } from '../composables/useInventory'
import AddPurchaseOrderModal from '../components/features/purchase-orders/modals/AddPurchaseOrderModal.vue'
import EditPurchaseOrderModal from '../components/features/purchase-orders/modals/EditPurchaseOrderModal.vue'
import ReceivePurchaseOrderModal from '../components/features/purchase-orders/modals/ReceivePurchaseOrderModal.vue'
import PayPurchaseOrderModal from '../components/features/purchase-orders/modals/PayPurchaseOrderModal.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'
import { 
  PlusIcon, 
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

// Load purchase orders
const {
  isLoading,
  purchaseOrders,
  filteredOrders,
  paginatedOrders,
  searchQuery,
  selectedStatus,
  selectedSupplier,
  loadData,
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  fetchOrderDetail,
  receivePurchaseOrder,
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
} = usePurchaseOrders()

// Load suppliers
const { 
  suppliers, 
  loadData: loadSuppliersData,
  isLoading: suppliersLoading 
} = useSuppliers()

// Load raw materials
const { loadData: loadMaterialsData } = useInventory()

// Load data on mount
onMounted(async () => {
  try {
    // Load suppliers data explicitly
    await loadSuppliersData()
    // Load raw materials data
    await loadMaterialsData()
    // Load purchase orders data
    await loadData()
  } catch (error) {
    console.error('Error loading data:', error)
    showErrorNotification('Failed to load data')
  }
})

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showReceiveModal = ref(false)
const showPayModal = ref(false)
const isConfirmDeleteOpen = ref(false)
const editingOrder = ref(null)
const receivingOrder = ref(null)
const payingOrder = ref(null)
const orderToDelete = ref(null)

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

// Open edit modal
async function openEditModal(order) {
  // Ambil detail order terlebih dahulu untuk mendapatkan data lengkap termasuk items
  const result = await fetchOrderDetail(order.id)
  console.log('ini data order detail ketika akan di edit:', result);
  if (result.success) {
    const orderData = result.data;
    console.log('ini data order detail ketika akan di edit:', orderData);
    // ✅ Perbaiki mapping data untuk EditPurchaseOrderModal
    editingOrder.value = {
      id: orderData.id,
      orderNumber: orderData.id.toString(),
      supplier: orderData.supplier?.id?.toString() || '', // ✅ Gunakan ID supplier, bukan nama
      status: orderData.status || 'Dibuat',
      orderDate: orderData.date_created ? new Date(orderData.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDelivery: orderData.tanggal_pembayaran ? new Date(orderData.tanggal_pembayaran).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdBy: orderData.pembuat_po?.first_name || 'Admin',
      notes: orderData.catatan_pembelian || '',
      // ✅ Perbaiki mapping items
      items: Array.isArray(orderData.items) ? orderData.items.map(item => ({
        raw_material_id: item.item?.id || item.item,
        item: item.item?.nama_item || item.item_name || '',
        quantity: item.jumlah_pesan || 1,
        unit: item.item?.unit?.abbreviation || item.unit_name || 'pcs',
        total_price: item.harga_satuan || 0
      })) : []
    };
    console.log('ini data order detail setelah di edit:', editingOrder.value);
    // Jika tidak ada items, tambahkan item kosong
    if (!editingOrder.value.items.length) {
      editingOrder.value.items.push({
        raw_material_id: '',
        item: '',
        quantity: 1,
        unit: 'pcs',
        total_price: 0
      });
    }
    
    showEditModal.value = true;
  } else {
    showErrorNotification(`Failed to fetch order details: ${result.error || 'Unknown error'}`);
  }
}

// Handle add order
async function handleAddOrder(order) {
  const result = await addPurchaseOrder(order)
  if (result.success) {
    showAddModal.value = false
    showSuccessNotification('Purchase order added successfully')
  } else {
    showErrorNotification(`Failed to add purchase order: ${result.error || 'Unknown error'}`)
  }
}

// Handle update order
async function handleUpdateOrder(order) {
  const result = await updatePurchaseOrder(order)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Purchase order updated successfully')
  } else {
    showErrorNotification(`Failed to update purchase order: ${result.error || 'Unknown error'}`)
  }
}

// Open receive modal
async function openReceiveModal(order) {
  // Ambil detail order terlebih dahulu untuk mendapatkan data lengkap termasuk items
  const result = await fetchOrderDetail(order.id)
  if (result.success) {
    const orderData = result.data;
    console.log('ini data order detail ketika akan di terima:', orderData);
    // Format data sesuai dengan struktur yang diharapkan oleh ReceivePurchaseOrderModal
    receivingOrder.value = {
      id: orderData.id,
      supplier: orderData.supplier,
      date_created: orderData.date_created,
      pembuat_po: orderData.pembuat_po,
      // Format items dari po_items untuk modal receive
      items: Array.isArray(orderData.items) ? orderData.items.map(item => ({
        id: item.id, // po_items.id
        nama_item: item.item?.nama_item || 'Unknown Item',
        unit: item.item?.unit?.abbreviation || item.unit_name || 'pcs',
        jumlah_pesan: item.jumlah_pesan || 0,
        harga_satuan: item.harga_satuan || 0,
        raw_material_id: item.item?.id
      })) : []
    };
    
    showReceiveModal.value = true;
  } else {
    showErrorNotification(`Failed to fetch order details: ${result.error || 'Unknown error'}`);
  }
}

// Handle receive order
async function handleReceiveOrder(receiptData) {
  const result = await receivePurchaseOrder(receiptData)
  if (result.success) {
    showReceiveModal.value = false
    showSuccessNotification('Purchase order received successfully')
  } else {
    showErrorNotification(`Failed to receive purchase order: ${result.error || 'Unknown error'}`)
  }
}

// Open pay modal
async function openPayModal(order) {
  // Ambil detail order terlebih dahulu untuk mendapatkan data lengkap termasuk items
  const result = await fetchOrderDetail(order.id)
  if (result.success) {
    const orderData = result.data
    console.log('ini data order detail ketika akan dibayar:', orderData)
    
    payingOrder.value = {
      id: orderData.id,
      supplier: orderData.supplier,
      pembuat_po: orderData.pembuat_po,
      penerima_barang: orderData.penerima_barang,
      date_created: orderData.date_created,
      date_updated: orderData.date_updated,
      items: Array.isArray(orderData.items) ? orderData.items.map(item => ({
        id: item.id,
        nama_item: item.item?.nama_item || 'Unknown Item',
        unit: item.item?.unit?.abbreviation || item.unit_name || 'pcs',
        jumlah_pesan: item.jumlah_pesan || 0,
        total_diterima: item.total_diterima || item.jumlah_pesan || 0,
        total_penyusutan: item.total_penyusutan || 0,
        alasan_penyusutan: item.alasan_penyusutan,
        harga_satuan: item.harga_satuan || 0,
        raw_material_id: item.item?.id
      })) : []
    }
    
    showPayModal.value = true
  } else {
    showErrorNotification(`Failed to fetch order details: ${result.error || 'Unknown error'}`)
  }
}

// Handle pay order
async function handlePayOrder(paymentData) {
  // Implementasi pembayaran akan ditambahkan ke usePurchaseOrders
  const result = await payPurchaseOrder(paymentData)
  if (result.success) {
    showPayModal.value = false
    showSuccessNotification('Purchase order berhasil dibayar dan diselesaikan')
  } else {
    showErrorNotification(`Failed to pay purchase order: ${result.error || 'Unknown error'}`)
  }
}

// Confirm delete
function confirmDelete(order) {
  orderToDelete.value = order
  isConfirmDeleteOpen.value = true
}

// Delete order
async function deleteOrder() {
  if (orderToDelete.value) {
    const result = await deletePurchaseOrder(orderToDelete.value.id)
    if (result.success) {
      isConfirmDeleteOpen.value = false
      orderToDelete.value = null
      showSuccessNotification('Purchase order deleted successfully')
    } else {
      showErrorNotification(`Failed to delete purchase order: ${result.error || 'Unknown error'}`)
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

// Watch for filter changes to reset pagination
watch([searchQuery, selectedStatus, selectedSupplier, dateFilter], () => {
  resetPagination()
}, { deep: true })
</script>