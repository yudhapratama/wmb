<script setup>
import { ref } from 'vue'
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

// Submit form
function handleSubmit(order) {
  emit('submit', order)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Buat Purchase Order Baru" 
    size="xl"
    @close="emit('close')"
  >
    <PurchaseOrderForm
      :order="newOrder"
      :suppliers="suppliers"
      @update:order="(val) => newOrder = val"
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
          @click="handleSubmit(newOrder)"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          :disabled="isLoading || !newOrder.supplier"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buat Purchase Order
        </button>
      </div>
    </template>
  </Modal>
</template>