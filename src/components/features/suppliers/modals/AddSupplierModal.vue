<script setup>
import { ref, computed } from 'vue'
import Modal from '../../../ui/Modal.vue'
import SupplierForm from '../SupplierForm.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const newSupplier = ref({
  nama_pt_toko: '',
  no_telp_pic: '',
  kategori_supplier: '',
  alamat_pt_toko: '',
  status: 'active',
  catatan: '',
  nama_bank: '',
  nama_pic: '',
  nomor_rekening: '',
  tempo_pembayaran: ''
})

// Form validation state
const showValidation = ref(false)
const supplierFormRef = ref(null)

// Reset form when modal opens
function resetForm() {
  newSupplier.value = {
    nama_pt_toko: '',
    no_telp_pic: '',
    kategori_supplier: '',
    alamat_pt_toko: '',
    status: 'active',
    catatan: '',
    nama_bank: '',
    nama_pic: '',
    nomor_rekening: '',
    tempo_pembayaran: ''
  }
  showValidation.value = false
}

// Submit form
function handleSubmit() {
  showValidation.value = true
  
  if (supplierFormRef.value && supplierFormRef.value.validateForm()) {
    emit('submit', newSupplier.value)
  }
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    title="Tambah Supplier Baru" 
    size="xl"
    @close="$emit('close')"
  >
    <PermissionBasedAccess collection="suppliers" action="create">
      <SupplierForm
        ref="supplierFormRef"
        :supplier="newSupplier"
        :isLoading="isLoading"
        :showValidation="showValidation"
        @update:supplier="newSupplier = $event"
      />
    </PermissionBasedAccess>
    
    <template v-slot:fallback>
      <div class="p-6 text-center text-gray-500">
        Anda tidak memiliki akses untuk menambahkan supplier baru.
      </div>
    </template>
    
    <template #footer>
      <PermissionBasedAccess collection="suppliers" action="create">
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
            :disabled="isLoading || !newSupplier?.nama_pt_toko || !newSupplier?.tempo_pembayaran"
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