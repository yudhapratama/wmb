<script setup>
import { ref, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import PurchaseOrderForm from '../PurchaseOrderForm.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    default: null
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

const editedOrder = ref(null)

// Initialize form data when order changes
watch(() => props.order, (newOrder) => {
  if (newOrder) {
    editedOrder.value = { ...newOrder }
  }
}, { immediate: true, deep: true })

// Submit form
function handleSubmit(order) {
  emit('submit', order)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    :title="order ? `Edit Purchase Order - ${order.orderNumber}` : 'Edit Purchase Order'" 
    size="xl"
    @close="emit('close')"
  >
    <div v-if="order && editedOrder">
      <PurchaseOrderForm
        :order="editedOrder"
        :suppliers="suppliers"
        @update:order="(val) => editedOrder = val"
        @save="handleSubmit"
      />
    </div>
    
    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          @click="emit('close')"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Batal
        </button>
        <button
          @click="handleSubmit(editedOrder)"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          :disabled="isLoading || !editedOrder?.supplier"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Simpan Perubahan
        </button>
      </div>
    </template>
  </Modal>
</template>