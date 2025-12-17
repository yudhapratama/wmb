<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="nama_item" class="block text-sm font-medium text-gray-700">Nama Item</label>
        <input
          id="nama_item"
          v-model="formData.nama_item"
          type="text"
          placeholder="Bawang Merah"
          class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label for="kategori" class="block text-sm font-medium text-gray-700">Kategori</label>
        <Select
          v-model="formData.kategori"
          :options="categoryOptions"
          placeholder="Pilih Kategori"
        />
      </div>
      
      <div>
        <label for="total_stock" class="block text-sm font-medium text-gray-700">Jumlah Stok</label>
        <input
          :value="formatNumber(formData.total_stock)"
          type="text"
          id="total_stock"
          inputmode="numeric"
          class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100 text-gray-500 cursor-not-allowed"
          @input="handleNumericInput($event, (val) => formData.total_stock = val)"
          placeholder="10"
          min="0"
          required
          disabled
          readonly
        />
      </div>
      
      <div>
      <div>
        <label for="unit" class="block text-sm font-medium text-gray-700">Unit</label>
        <Select
          v-model="formData.unit"
          :options="unitOptionsFormatted"
          placeholder="Pilih Unit"
        />
      </div>
      </div>
      
      <div>
        <label for="minimum_stock_level" class="block text-sm font-medium text-gray-700">Minimum Stok</label>
        <input
          :value="formatNumber(formData.minimum_stock_level)"
          type="text"
          id="minimum_stock_level"
          inputmode="numeric"
          class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @input="handleNumericInput($event, (val) => formData.minimum_stock_level = val)"
          placeholder="5"
          min="0"
          required
        />
      </div>
      
      <div>
        <label for="harga_rata_rata" class="block text-sm font-medium text-gray-700">Harga Rata-rata</label>
        <input
          :value="formatNumber(formData.harga_rata_rata)"
          type="text"
          id="harga_rata_rata"
          inputmode="numeric"
          class="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100 text-gray-500 cursor-not-allowed"
          @input="handleNumericInput($event, (val) => formData.harga_rata_rata = val)"
          placeholder="25000"
          min="0"
          required
          disabled
          readonly
        />
      </div>
      
      <div>
        <label for="supplier_utama" class="block text-sm font-medium text-gray-700">Supplier Utama</label>
        <Select
          v-model="formData.supplier_utama"
          :options="supplierOptions"
          placeholder="Pilih Supplier"
        />
      </div>
    </div>
    
    <!-- Removed the duplicate buttons that were here -->
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import Select from '../../ui/Select.vue'
import { formatNumber, handleNumericInput } from '../../../utils/helpers'
const props = defineProps({
  item: {
    type: Object,
    default: () => ({})
  },
  categories: {
    type: Array,
    default: () => []
  },
  suppliers: {
    type: Array,
    default: () => []
  },
  unitOptions: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:item', 'save', 'cancel'])

const formData = ref({
  nama_item: '',
  kategori: '',
  total_stock: 0,
  unit: '',
  minimum_stock_level: 0,
  harga_rata_rata: 0,
  supplier_utama: ''
})

// Initialize form data from props
function initFormData() {
  formData.value = {
    id: props.item.id, // Tambahkan ini
    nama_item: props.item.nama_item || '',
    kategori: props.item.kategori || '',
    total_stock: props.item.total_stock || 0,
    unit: props.item.unit || '',
    minimum_stock_level: props.item.minimum_stock_level || 0,
    harga_rata_rata: props.item.harga_rata_rata || 0,
    supplier_utama: props.item.supplier_utama || ''
  }
}

// Initialize on mount
initFormData()

// Watch for changes in the item prop
watch(() => props.item, (newItem) => {
  // Hindari pembaruan rekursif dengan memeriksa apakah nilai sudah sama
  if (JSON.stringify(formData.value) !== JSON.stringify({
    nama_item: newItem.nama_item || '',
    kategori: newItem.kategori || '',
    total_stock: newItem.total_stock || 0,
    unit: newItem.unit || '',
    minimum_stock_level: newItem.minimum_stock_level || 0,
    harga_rata_rata: newItem.harga_rata_rata || 0,
    supplier_utama: newItem.supplier_utama || ''
  })) {
    initFormData()
  }
}, { deep: true })

// Watch for changes in form data and emit update events
watch(formData, (newData) => {
  // Hindari update rekursif dengan hanya mengirim data yang berubah
  // tanpa menggabungkan dengan props.item
  emit('update:item', newData)
}, { deep: true })

function handleSubmit() {
  const data = { ...props.item, ...formData.value }
  emit('save', data)
}

const categoryOptions = computed(() => 
  props.categories.map(cat => ({ value: cat.id, label: cat.name }))
)

const unitOptionsFormatted = computed(() => 
  props.unitOptions.map(unit => ({ value: unit.id, label: unit.text }))
)

const supplierOptions = computed(() => [
  { value: '', label: 'Tidak Ada' },
  ...props.suppliers.map(supplier => ({ value: supplier.id, label: supplier.nama_pt_toko }))
])
</script>