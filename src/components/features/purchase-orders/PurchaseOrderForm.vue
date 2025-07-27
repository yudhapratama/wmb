<template>
  <form @submit.prevent="handleSubmit">
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
        <Select
          v-model="formData.supplier"
          :options="supplierOptions"
          placeholder="Pilih Supplier"
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
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raw Material</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in formData.items" :key="index">
              <td class="px-3 py-2">
                <Select
                  v-model="item.raw_material_id"
                  :options="rawMaterialOptions"
                  placeholder="Pilih Raw Material"
                  @update:modelValue="onRawMaterialSelect(index, $event)"
                />
              </td>
              <td class="px-3 py-2">
                <input 
                  v-model.number="item.quantity" 
                  type="number" 
                  min="1" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </td>
              <td class="px-3 py-2">
                <input 
                  v-model="item.unit" 
                  type="text" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  readonly
                />
              </td>
              <td class="px-3 py-2">
                <input 
                  v-model.number="item.total_price" 
                  type="number" 
                  min="0" 
                  class="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  placeholder="Total harga untuk item ini"
                />
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
              <td colspan="3" class="px-3 py-2 text-right font-medium">Total Keseluruhan:</td>
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
import Select from '../../ui/Select.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useInventory } from '../../../composables/useInventory'

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

// Load raw materials data
const { 
  rawMaterials, 
  isLoading: materialsLoading, 
  loadData: loadMaterialsData,
  getCategoryName,
  getUnitName
} = useInventory()

const formData = ref({
  orderNumber: '',
  supplier: '',
  status: 'Dibuat',
  orderDate: new Date().toISOString().split('T')[0],
  createdBy: 'Admin',
  notes: '',
  items: []
})

// Initialize form data from props
function initFormData() {
  if (props.order && Object.keys(props.order).length > 0) {
    formData.value = {
      ...props.order,
      // ✅ Konversi supplier ke integer
      supplier: props.order.supplier ? parseInt(props.order.supplier) : '',
      orderDate: props.order.orderDate ? new Date(props.order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: props.order.items ? props.order.items.map(item => ({
        ...item,
        total_price: item.total_price || item.total || (item.price * item.quantity) || 0
      })) : []
    }
  } else {
    formData.value = {
      orderNumber: '',
      supplier: '',
      status: 'Dibuat',
      orderDate: new Date().toISOString().split('T')[0],
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
// Di watch untuk newOrder, perbaiki mapping items
// Watch for changes in the order prop
watch(() => props.order, (newOrder) => {
  const currentOrderData = {
    orderNumber: newOrder?.orderNumber || '',
    // ✅ Konversi supplier ke integer
    supplier: newOrder?.supplier ? parseInt(newOrder.supplier) : '',
    status: newOrder?.status || 'Dibuat',
    orderDate: newOrder?.orderDate ? new Date(newOrder.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdBy: newOrder?.createdBy || 'Admin',
    notes: newOrder?.notes || '',
    items: newOrder?.items?.map(item => ({
      raw_material_id: item.item || item.raw_material_id,
      item: item.item_name || item.item,
      quantity: item.jumlah_pesan || item.quantity || 1,
      unit: item.unit_name || item.unit || 'pcs',
      total_price: item.harga_satuan || item.total_price || 0
    })) || []
  };
  
  if (JSON.stringify(formData.value) !== JSON.stringify(currentOrderData)) {
    initFormData();
  }
}, { deep: true })

// Watch for changes in form data and emit update events
watch(formData, (newData) => {
  emit('update:order', newData)
}, { deep: true })

// Load materials data on mount
onMounted(async () => {
  await loadMaterialsData()
})

// Get raw material by ID
function getRawMaterialById(id) {
  return rawMaterials.value.find(material => material.id === id)
}

// Handle raw material selection
function onRawMaterialSelect(index, materialId) {
  const material = getRawMaterialById(materialId)
  if (material) {
    const item = formData.value.items[index]
    item.raw_material_id = materialId
    item.item = material.nama_item
    item.unit = getUnitName(material.unit) || 'pcs'
    // Tidak lagi mengisi harga otomatis, biarkan user input total harga
  }
}

// Add item function - hapus field price dan total, ganti dengan total_price
function addItem() {
  formData.value.items.push({
    raw_material_id: '',
    item: '',
    quantity: 1,
    unit: 'pcs',
    total_price: 0
  })
}

// Remove item
function removeItem(index) {
  formData.value.items.splice(index, 1)
}

// Calculate total amount - jumlahkan semua total_price
const totalAmount = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
})

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Dalam handleSubmit atau emit save
function handleSubmit() {
  // Validasi supplier
  if (!formData.value.supplier) {
    alert('Silakan pilih supplier')
    return
  }
  
  const orderData = {
    ...formData.value,
    supplier: parseInt(formData.value.supplier), // Pastikan integer
    totalAmount: totalAmount.value
  }
  
  emit('save', orderData)
}

const supplierOptions = computed(() => 
  props.suppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.nama_pt_toko
  }))
)

const rawMaterialOptions = computed(() => 
  rawMaterials.value.map(material => ({
    value: material.id,
    label: `${material.nama_item} - ${getCategoryName(material.kategori)}`
  }))
)
</script>