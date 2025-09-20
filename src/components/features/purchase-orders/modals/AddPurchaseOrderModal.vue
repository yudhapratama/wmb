<script setup>
import { ref, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import PurchaseOrderForm from '../PurchaseOrderForm.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  suppliers: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const newOrder = ref({
  orderNumber: '',
  supplier: '',
  status: 'Dibuat',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDelivery: new Date().toISOString().split('T')[0],
  createdBy: 'Admin',
  notes: '',
  items: []
})

// Reset form when modal opens
function resetForm() {
  newOrder.value = {
    orderNumber: '',
    supplier: '',
    status: 'Dibuat',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: new Date().toISOString().split('T')[0],
    createdBy: 'Admin',
    notes: '',
    items: []
  }
}

// Watch for modal open/close to reset form
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

// Submit form
function handleSubmit(order) {
  emit('submit', order)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Buat Purchase Order Baru" 
    size="3xl"
    @close="emit('close')"
  >
    <PurchaseOrderForm
      :order="newOrder"
      :suppliers="suppliers"
      @update:order="(val) => newOrder = val"
      @save="handleSubmit"
    />
    
    <template #footer>
      <div class="flex gap-3 w-full">
        <button
          @click="emit('close')"
          class="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          @click="handleSubmit(newOrder)"
          class="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-sm font-medium text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading || !newOrder.supplier"
        >
          <svg v-if="!isLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <svg v-else class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Memproses...' : 'Buat Purchase Order' }}
        </button>
      </div>
    </template>
  </Modal>
</template>