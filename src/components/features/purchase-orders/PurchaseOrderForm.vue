<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Order Number -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Nomor Order</label>
        <input 
          v-model="formData.orderNumber" 
          type="text" 
          placeholder="PO-001" 
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          required
        />
      </div>
      
      <!-- Supplier -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
        <Select
          v-model="formData.supplier"
          :options="supplierOptions"
          placeholder="Pilih Supplier"
          searchable
        />
      </div>
    </div>
    
    <!-- Items Section -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">Items Purchase Order</h3>
        <button 
          type="button"
          @click="addItem" 
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <PlusIcon class="w-4 h-4" />
          Tambah Item
        </button>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Raw Material</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Qty</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Unit</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Total Harga</th>
                <th class="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(item, index) in formData.items" :key="index" class="hover:bg-white transition-colors">
                <td class="px-4 py-3">
                  <Select
                    v-model="item.raw_material_id"
                    :options="rawMaterialOptions"
                    placeholder="Pilih Raw Material"
                    searchable
                    @update:modelValue="onRawMaterialSelect(index, $event)"
                  />
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-model.number="item.quantity" 
                    type="number" 
                    min="0" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-model="item.unit" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    readonly
                  />
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-model.number="item.total_price" 
                    type="number" 
                    min="0" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td class="px-4 py-3">
                  <button 
                    type="button"
                    @click="removeItem(index)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Total Section -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <span class="text-lg font-medium text-gray-900">Total Keseluruhan:</span>
            <span class="text-xl font-bold text-blue-600">{{ formatCurrency(totalAmount) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Notes -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan</label>
      <textarea 
        v-model="formData.notes" 
        rows="3" 
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        placeholder="Catatan tambahan untuk purchase order ini..."
      ></textarea>
    </div>
  </form>
</template>

<script setup>
import Select from '../../ui/Select.vue'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useInventory } from '../../../composables/useInventory'
import { formatCurrency } from '../../../utils/helpers'
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

// Flag to prevent recursive updates
const isUpdatingFromParent = ref(false)

function initFormData() {
  if (props.order && Object.keys(props.order).length > 0) {
    isUpdatingFromParent.value = true
    formData.value = {
      orderNumber: props.order.orderNumber || props.order.nomor_po || '',
      supplier: props.order.supplier ? parseInt(props.order.supplier) : '',
      status: props.order.status || 'Dibuat',
      orderDate: props.order.orderDate ? new Date(props.order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdBy: props.order.createdBy || 'Admin',
      notes: props.order.notes || '',
      items: props.order.items?.map(item => ({
        id: item.id,
        raw_material_id: normalizeId(item.raw_material_id ?? item.item),
        item: item.item_name || item.nama_item || item.item || '',
        quantity: item.jumlah_pesan || item.quantity || 0,
        unit: item.unit_name || item.unit || 'pcs',
        total_price: item.harga_satuan || item.total_price || 0
      })) || []
    }
    isUpdatingFromParent.value = false
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
watch(() => props.order, (newOrder) => {
  // Tambahkan flag untuk mencegah recursive updates
  if (isUpdatingFromParent.value) return
  const currentOrderData = {
    orderNumber: newOrder?.orderNumber || '',
    supplier: newOrder?.supplier ? parseInt(newOrder.supplier) : '',
    status: newOrder?.status || 'Dibuat',
    orderDate: newOrder?.orderDate ? new Date(newOrder.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdBy: newOrder?.createdBy || 'Admin',
    notes: newOrder?.notes || '',
    items: newOrder?.items?.map(item => ({
      id: item.id,
      raw_material_id: normalizeId(item.raw_material_id ?? item.item),
      item: item.item_name || item.nama_item || item.item || '',
      quantity: item.jumlah_pesan || item.quantity || 0,
      unit: item.unit_name || item.unit || 'pcs',
      total_price: item.harga_satuan || item.total_price || 0
    })) || []
  };
  // Hanya update jika data benar-benar berbeda
  if (JSON.stringify(formData.value) !== JSON.stringify(currentOrderData)) {
    isUpdatingFromParent.value = true
    formData.value = currentOrderData
    nextTick(() => {
      isUpdatingFromParent.value = false
    })
  }
}, { deep: true })

// Watch for changes in form data and emit update events
watch(formData, (newData) => {
  // Jangan emit jika sedang update dari parent
  if (!isUpdatingFromParent.value) {
    emit('update:order', newData)
  }
}, { deep: true })

// Load materials data on mount
onMounted(async () => {
  await loadMaterialsData()
})

// Get raw material by ID
function getRawMaterialById(id) {
  const idNum = typeof id === 'number' ? id : parseInt(id)
  return rawMaterials.value.find(material => material.id === idNum)
}

// Handle raw material selection
function onRawMaterialSelect(index, materialId) {
  const material = getRawMaterialById(materialId)
  
  if (material) {
    const item = formData.value.items[index]
    item.raw_material_id = normalizeId(materialId)
    item.item = material.nama_item
    item.unit = getUnitName(material.unit) || 'pcs'
  } else {
    console.warn('⚠️ Material not found for ID:', materialId)
  }
}

// Add item function - hapus field price dan total, ganti dengan total_price
function addItem() {
  formData.value.items.push({
    raw_material_id: '',
    item: '',
    quantity: 0,
    unit: 'pcs',
    total_price: 0
  })
}

// Reset item selections if supplier change invalidates current raw materials
watch(() => formData.value.supplier, () => {
  // Jangan reset saat sedang update dari parent (edit mode init)
  if (isUpdatingFromParent.value) return
  // Jangan reset jika data bahan baku belum selesai dimuat
  if (materialsLoading.value) return
  const options = rawMaterialOptions.value
  // Jika opsi belum tersedia, jangan lakukan apa-apa
  if (!options || options.length === 0) return

  const allowedIds = new Set(options.map(opt => Number(opt.value)))
  formData.value.items = formData.value.items.map(item => {
    const idNum = typeof item.raw_material_id === 'number' ? item.raw_material_id : parseInt(item.raw_material_id)
    if (!Number.isFinite(idNum) || !allowedIds.has(idNum)) {
      return { ...item, raw_material_id: '', item: '', unit: 'pcs', total_price: 0 }
    }
    return item
  })
})
// Remove item
function removeItem(index) {
  formData.value.items.splice(index, 1)
}

// Calculate total amount - jumlahkan semua total_price
const totalAmount = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
})

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

// Helper: normalize numeric ID
function normalizeId(val) {
  const num = typeof val === 'number' ? val : parseInt(val)
  return Number.isFinite(num) ? num : ''
}

const supplierOptions = computed(() => 
  props.suppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.nama_pt_toko
  }))
)

// Filter raw materials by selected supplier when available
const rawMaterialOptions = computed(() => {
  const supplierId = parseInt(formData.value.supplier)
  const filtered = rawMaterials.value.filter(rm => {
    if (!supplierId || Number.isNaN(supplierId)) return true
    const supplierByRelation = typeof rm.supplier_id === 'object' ? rm.supplier_id?.id : rm.supplier_id
    const supplierByPrimary = rm.supplier_utama
    return supplierByRelation === supplierId || supplierByPrimary === supplierId
  })
  const options = filtered.map(rm => ({
    value: rm.id,
    label: `${rm.nama_item} - ${getCategoryName(rm.kategori)}`
  }))
  // Urutkan secara abjad berdasarkan label (nama item + kategori)
  options.sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }))
  return options
})

</script>