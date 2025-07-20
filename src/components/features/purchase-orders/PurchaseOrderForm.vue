<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <!-- Order Number -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Order</label>
        <input 
          v-model="formData.orderNumber" 
          type="text" 
          placeholder="PO-001" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <!-- Supplier -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
        <select 
          v-model="formData.supplier" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="" disabled>Pilih Supplier</option>
          <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.nama_pt_toko">
            {{ supplier.nama_pt_toko }}
          </option>
        </select>
      </div>
      
      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select 
          v-model="formData.status" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="Dibuat">Dibuat</option>
          <option value="Diterima">Diterima</option>
          <option value="Selesai">Selesai</option>
        </select>
      </div>
      
      <!-- Expected Delivery -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengiriman</label>
        <input 
          v-model="formData.expectedDelivery" 
          type="date" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
    </div>
    
    <!-- Items -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-medium">Items</h3>
        <button 
          type="button"
          @click="addItem" 
          class="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Item
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in formData.items" :key="index">
              <td class="px-3 py-2">
                <input 
                  v-model="item.item" 
                  type="text" 
                  placeholder="Nama item" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </td>
              <td class="px-3 py-2">
                <input 
                  v-model.number="item.quantity" 
                  type="number" 
                  min="1" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  @input="updateItemTotal(index)"
                />
              </td>
              <td class="px-3 py-2">
                <select 
                  v-model="item.unit" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="pcs">pcs</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="liter">liter</option>
                  <option value="ml">ml</option>
                </select>
              </td>
              <td class="px-3 py-2">
                <input 
                  v-model.number="item.price" 
                  type="number" 
                  min="0" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  @input="updateItemTotal(index)"
                />
              </td>
              <td class="px-3 py-2">
                <div class="text-right font-medium">
                  {{ formatCurrency(item.total) }}
                </div>
              </td>
              <td class="px-3 py-2 text-right">
                <button 
                  type="button"
                  @click="removeItem(index)" 
                  class="text-red-600 hover:text-red-800"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="px-3 py-2 text-right font-medium">Total:</td>
              <td class="px-3 py-2 text-right font-bold text-blue-600">
                {{ formatCurrency(totalAmount) }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    
    <!-- Notes -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
      <textarea 
        v-model="formData.notes" 
        rows="3" 
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Catatan tambahan..."
      ></textarea>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  order: {
    type: Object,
    default: () => ({})
  },
  suppliers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:order', 'save'])

const formData = ref({
  orderNumber: '',
  supplier: '',
  status: 'Dibuat',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDelivery: new Date().toISOString().split('T')[0],
  createdBy: 'Admin',
  notes: '',
  items: []
})

// Initialize form data from props
function initFormData() {
  if (props.order && Object.keys(props.order).length > 0) {
    formData.value = {
      ...props.order,
      orderDate: props.order.orderDate ? new Date(props.order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDelivery: props.order.expectedDelivery ? new Date(props.order.expectedDelivery).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: props.order.items ? props.order.items.map(item => ({
        ...item,
        total: item.price * item.quantity
      })) : []
    }
  } else {
    formData.value = {
      orderNumber: '',
      supplier: '',
      status: 'Dibuat',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: new Date().toISOString().split('T')[0],
      createdBy: 'Admin',
      notes: '',
      items: []
    }
    
    // Add an empty item for new orders
    if (formData.value.items.length === 0) {
      addItem()
    }
  }
}

// Initialize on mount
initFormData()

// Watch for changes in the order prop
watch(() => props.order, (newOrder) => {
  // Hindari pembaruan rekursif dengan memeriksa apakah perlu memperbarui formData
  const currentOrderData = {
    orderNumber: newOrder?.orderNumber || '',
    supplier: newOrder?.supplier || '',
    status: newOrder?.status || 'Dibuat',
    orderDate: newOrder?.orderDate ? new Date(newOrder.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expectedDelivery: newOrder?.expectedDelivery ? new Date(newOrder.expectedDelivery).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdBy: newOrder?.createdBy || 'Admin',
    notes: newOrder?.notes || '',
    items: newOrder?.items || []
  };
  
  // Hanya perbarui jika data berbeda
  if (JSON.stringify(formData.value) !== JSON.stringify(currentOrderData)) {
    initFormData();
  }
}, { deep: true })

// Watch for changes in form data and emit update events
watch(formData, (newData) => {
  // Hindari update rekursif dengan hanya mengirim data yang berubah
  // tanpa menggabungkan dengan props.order
  emit('update:order', newData)
}, { deep: true })

// Add new item
function addItem() {
  formData.value.items.push({
    item: '',
    quantity: 1,
    unit: 'pcs',
    price: 0,
    total: 0
  })
}

// Remove item
function removeItem(index) {
  formData.value.items.splice(index, 1)
}

// Update item total
function updateItemTotal(index) {
  const item = formData.value.items[index]
  item.total = item.quantity * item.price
}

// Calculate total amount
const totalAmount = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + item.total, 0)
})

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

function handleSubmit() {
  const orderData = {
    ...formData.value,
    totalAmount: totalAmount.value
  }
  
  emit('save', orderData)
}
</script>s