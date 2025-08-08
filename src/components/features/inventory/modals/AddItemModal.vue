<script setup>
import { ref } from 'vue'
import Modal from '../../../ui/Modal.vue'
import InventoryForm from '../InventoryForm.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

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
    size="3xl"
    @close="$emit('close')"
  >
    <PermissionBasedAccess collection="raw_materials" action="create">
      <InventoryForm
        :categories="categories"
        :suppliers="suppliers"
        :unitOptions="unitOptions"
        :isLoading="isLoading"
        @update:item="newItem = $event"
        @save="handleSubmit"
      />
    </PermissionBasedAccess>
    
    <template v-slot:fallback>
      <div class="p-6 text-center text-gray-500">
        Anda tidak memiliki akses untuk menambahkan item baru.
      </div>
    </template>
    
    <template #footer>
      <PermissionBasedAccess collection="raw_materials" action="create">
        <div class="flex gap-2 w-full">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            @click="handleSubmit"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
            :disabled="isLoading || !newItem?.nama_item || !newItem?.kategori"
          >
            <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ isLoading ? 'Menyimpan...' : 'Simpan' }}</span>
          </button>
        </div>
      </PermissionBasedAccess>
    </template>
  </Modal>
</template>