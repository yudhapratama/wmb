<template>
  <AppLayout title="Purchase Orders Management">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Purchase Orders Management</h1>
      <button
        @click="openAddModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
      >
        <PlusIcon class="w-5 h-5" />
        Tambah Order
      </button>
    </div>
    
    <!-- Filters -->
    <div class="bg-white shadow rounded-lg border border-gray-200 p-6">
      <div class="flex gap-4">
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari nomor order atau supplier..." 
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select 
          v-model="selectedStatus" 
          class="w-64 px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Semua Status</option>
          <option value="Dibuat">Dibuat</option>
          <option value="Diterima">Diterima</option>
          <option value="Selesai">Selesai</option>
        </select>
        
        <select 
          v-model="selectedSupplier" 
          class="w-64 px-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Semua Supplier</option>
          <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.nama_pt_toko">
            {{ supplier.nama_pt_toko }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Purchase Orders List -->
    <div class="mt-6 grid grid-cols-1 gap-6">
      <div v-if="isLoading" class="col-span-full text-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Loading purchase orders...</p>
      </div>
      
      <div v-else-if="filteredOrders.length === 0" class="col-span-full text-center py-12">
        <ArchiveBoxIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600">Tidak ada purchase order yang ditemukan</p>
        <button
          @click="openAddModal"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <PlusIcon class="w-5 h-5" />
          Buat Order Pertama
        </button>
      </div>
      
      <div 
        v-else
        v-for="order in filteredOrders" 
        :key="order.id" 
        class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div :class="getStatusBadgeClass(order.status)" class="p-2 rounded-lg">
                <component :is="getStatusIcon(order.status)" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-semibold text-lg text-gray-900">{{ order.id }}</h3>
                <div class="flex items-center gap-4 mt-1 text-sm">
                  <div class="flex items-center gap-1">
                    <BuildingOfficeIcon class="w-4 h-4" /> 
                    {{ order.supplier?.nama_pt_toko }}
                  </div>
                  <span :class="getStatusTextClass(order.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ getStatusLabel(order.status) }}
                  </span>
                  <span class="text-gray-500">oleh {{ order.pembuat_po?.first_name }}</span>
                </div>
                <div class="flex items-center gap-6 mt-2 text-sm">
                  <div class="flex items-center gap-1 text-gray-500">
                    <CalendarIcon class="w-4 h-4" />
                    Order: {{ formatDate(order.date_created) }}
                  </div>
                  <div class="flex items-center gap-1 text-gray-500">
                    <ArchiveBoxIcon class="w-4 h-4" />
                    Delivery: {{ formatDate(order.tanggal_pembayaran || order.date_created) }}
                  </div>
                </div>
                <div class="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <HashtagIcon class="w-4 h-4" />
                  {{ order.po_items?.length || 0 }} items
                </div>
                <p v-if="order.catatan_pembelian" class="text-xs text-gray-500 mt-1 truncate max-w-md">
                  Note: {{ order.catatan_pembelian }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-600 mb-3">
                {{ formatCurrency(order.total_pembayaran || 0) }}
              </div>
              <div class="flex gap-2">
                <button 
                  @click="openEditModal(order)" 
                  class="p-2.5 border border-gray-300 rounded-md text-yellow-600 hover:bg-yellow-50"
                >
                  <PencilIcon class="w-4 h-4" />
                </button>
                <button 
                  @click="confirmDelete(order)" 
                  class="p-2.5 border border-gray-300 rounded-md text-red-600 hover:bg-red-50"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { ref, onMounted } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import { usePurchaseOrders } from '../composables/usePurchaseOrders'
import { useSuppliers } from '../composables/useSuppliers'
import AddPurchaseOrderModal from '../components/features/purchase-orders/modals/AddPurchaseOrderModal.vue'
import EditPurchaseOrderModal from '../components/features/purchase-orders/modals/EditPurchaseOrderModal.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArchiveBoxIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  HashtagIcon, 
  CheckCircleIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/vue/24/outline'

// Load purchase orders
const {
  isLoading,
  purchaseOrders,
  filteredOrders,
  searchQuery,
  selectedStatus,
  selectedSupplier,
  addPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  fetchOrderDetail
} = usePurchaseOrders()

// Load suppliers
const { suppliers } = useSuppliers()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const isConfirmDeleteOpen = ref(false)
const editingOrder = ref(null)
const orderToDelete = ref(null)

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

// Load data on mount
onMounted(async () => {
  // Data loading is handled by the composable
})

// Open add modal
function openAddModal() {
  editingOrder.value = null
  showAddModal.value = true
}

// Open edit modal
async function openEditModal(order) {
  // Ambil detail order terlebih dahulu untuk mendapatkan data lengkap termasuk items
  const result = await fetchOrderDetail(order.id)
  if (result.success) {
    const orderData = result.data;
    
    // Format data sesuai dengan struktur yang diharapkan oleh EditPurchaseOrderModal
    editingOrder.value = {
      id: orderData.id,
      orderNumber: orderData.id, // Gunakan ID sebagai nomor order
      supplier: orderData.supplier?.nama_pt_toko || '',
      status: orderData.status || 'Dibuat',
      orderDate: orderData.date_created ? new Date(orderData.date_created).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDelivery: orderData.tanggal_pembayaran ? new Date(orderData.tanggal_pembayaran).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdBy: orderData.pembuat_po?.first_name || 'Admin',
      notes: orderData.catatan_pembelian || '',
      // Format items dari po_items
      items: Array.isArray(orderData.po_items) ? orderData.po_items.map(item => ({
        item: item.item || '',
        quantity: item.jumlah_pesan || 1,
        unit: item.unit || 'pcs',
        price: item.harga_satuan || 0,
        total: (item.jumlah_pesan || 1) * (item.harga_satuan || 0)
      })) : []
    };
    
    // Jika tidak ada items, tambahkan item kosong
    if (!editingOrder.value.items.length) {
      editingOrder.value.items.push({
        item: '',
        quantity: 1,
        unit: 'pcs',
        price: 0,
        total: 0
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

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Format date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID')
}

// Get status icon
function getStatusIcon(status) {
  switch (status) {
    case 'Dibuat': return ClockIcon
    case 'Diterima': return CheckCircleIcon
    case 'Selesai': return TruckIcon
    default: return ClockIcon
  }
}

// Get status badge class
function getStatusBadgeClass(status) {
  switch (status) {
    case 'Dibuat': return 'bg-gray-100'
    case 'Diterima': return 'bg-blue-100'
    case 'Selesai': return 'bg-green-100'
    default: return 'bg-gray-100'
  }
}

// Get status text class
function getStatusTextClass(status) {
  switch (status) {
    case 'Dibuat': return 'bg-gray-100 text-gray-800'
    case 'Diterima': return 'bg-blue-100 text-blue-800'
    case 'Selesai': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Get status label
function getStatusLabel(status) {
  return status // Langsung gunakan status dari API
}
</script>