<script setup>
import { ref, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import SupplierForm from '../SupplierForm.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  supplier: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const editedSupplier = ref(null)

// Initialize form data when supplier changes
watch(() => props.supplier, (newSupplier) => {
  if (newSupplier) {
    editedSupplier.value = { ...newSupplier }
  }
}, { immediate: true, deep: true })

// Submit form
function handleSubmit() {
  emit('submit', editedSupplier.value)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    :title="supplier ? `Edit Supplier - ${supplier.nama_pt_toko}` : 'Edit Supplier'" 
    size="xl"
    @close="emit('close')"
  >
    <PermissionBasedAccess collection="suppliers" action="update">
      <div v-if="supplier && editedSupplier">
        <SupplierForm
          :supplier="editedSupplier"
          :isLoading="isLoading"
          @update:supplier="(val) => editedSupplier = val"
        />
      </div>
    </PermissionBasedAccess>
    
    <template v-slot:fallback>
      <div class="p-6 text-center text-gray-500">
        Anda tidak memiliki akses untuk mengedit supplier ini.
      </div>
    </template>
    
    <template #footer>
      <PermissionBasedAccess collection="suppliers" action="update">
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
            :disabled="isLoading || !editedSupplier?.nama_pt_toko || !editedSupplier?.no_telp_pic"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Simpan Perubahan
          </button>
        </div>
      </PermissionBasedAccess>
    </template>
  </Modal>
</template>