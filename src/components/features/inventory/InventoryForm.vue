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
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label for="kategori" class="block text-sm font-medium text-gray-700">Kategori</label>
        <select
          id="kategori"
          v-model="formData.kategori"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="" disabled>Pilih Kategori</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div>
        <label for="total_stock" class="block text-sm font-medium text-gray-700">Jumlah Stok</label>
        <input
          id="total_stock"
          v-model.number="formData.total_stock"
          type="number"
          min="0"
          placeholder="10"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
      <div>
        <label for="unit" class="block text-sm font-medium text-gray-700">Unit</label>
        <select
          id="unit"
          v-model="formData.unit"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="" disabled>Pilih Unit</option>
          <option v-for="unit in unitOptions" :key="unit.id" :value="unit.id">
            {{ unit.text }}
          </option>
        </select>
      </div>
      </div>
      
      <div>
        <label for="minimum_stock_level" class="block text-sm font-medium text-gray-700">Minimum Stok</label>
        <input
          id="minimum_stock_level"
          v-model.number="formData.minimum_stock_level"
          type="number"
          min="0"
          placeholder="5"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label for="harga_rata_rata" class="block text-sm font-medium text-gray-700">Harga Rata-rata</label>
        <input
          id="harga_rata_rata"
          v-model.number="formData.harga_rata_rata"
          type="number"
          min="0"
          placeholder="25000"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label for="supplier_utama" class="block text-sm font-medium text-gray-700">Supplier Utama</label>
        <select
          id="supplier_utama"
          v-model="formData.supplier_utama"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tidak Ada</option>
          <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
            {{ supplier.nama_pt_toko }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Removed the duplicate buttons that were here -->
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'

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
</script>