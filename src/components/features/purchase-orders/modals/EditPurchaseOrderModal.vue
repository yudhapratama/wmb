<script setup>
import { ref, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import PurchaseOrderForm from '../PurchaseOrderForm.vue'
import db from '../../../../services/db'

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
const originalItemsSnapshot = ref([]) // ✅ Snapshot data asli

// Initialize form data when order changes
watch(() => props.order, async (newOrder) => {
  if (newOrder) {
    editedOrder.value = { ...newOrder }
    
    // ✅ PENTING: Ambil snapshot data asli SEGERA saat modal edit dibuka
    if (newOrder.orderNumber || newOrder.id) {
      const orderId = newOrder.orderNumber || newOrder.id
      try {
        // ✅ Perbaiki: Gunakan ID yang benar untuk query
        const actualId = newOrder.id || parseInt(newOrder.orderNumber)
        originalItemsSnapshot.value = await db.po_items.where('purchase_order').equals(actualId).toArray()
        // console.log('📸 Snapshot original items saat modal edit dibuka:', originalItemsSnapshot.value)
        // console.log('🔍 Query dengan ID:', actualId)
      } catch (error) {
        // console.error('Error mengambil snapshot original items:', error)
        originalItemsSnapshot.value = []
      }
    }
  }
}, { immediate: true, deep: true })

// Submit form
function handleSubmit(order) {
  // ✅ Kirim data order beserta snapshot original items
  const orderWithSnapshot = {
    ...order,
    _originalItemsSnapshot: originalItemsSnapshot.value
  }
  emit('submit', orderWithSnapshot)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    :title="order ? `Edit Purchase Order - ${order.orderNumber}` : 'Edit Purchase Order'" 
    size="3xl"
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