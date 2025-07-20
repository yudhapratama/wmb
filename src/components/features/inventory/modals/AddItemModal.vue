<script setup>
import { ref } from 'vue'
import Modal from '../../../ui/Modal.vue'
import InventoryForm from '../InventoryForm.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['close', 'submit'])

const newItem = ref({
  nama_item: '',
  kategori: '',
  total_stock: 0,
  unit: '',
  minimum_stock_level: 0,
  harga_rata_rata: 0,
  supplier_utama: ''
})

// Reset form when modal opens
function resetForm() {
  newItem.value = {
    nama_item: '',
    kategori: '',
    total_stock: 0,
    unit: '',
    minimum_stock_level: 0,
    harga_rata_rata: 0,
    supplier_utama: ''
  }
}

// Submit form
function handleSubmit() {
  emit('submit', newItem.value)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Tambah Item Baru" 
    size="xl"
    @close="emit('close')"
  >
    <InventoryForm
      :item="newItem"
      :categories="categories"
      :suppliers="suppliers"
      :unitOptions="unitOptions"
      @update:item="(val) => newItem = val"
      @save="handleSubmit"
    />
    
    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          @click="emit('close')"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          :disabled="isLoading || !newItem.nama_item || !newItem.kategori"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Item
        </button>
      </div>
    </template>
  </Modal>
</template>