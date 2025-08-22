<template>
  <Modal :isOpen="isOpen" @close="$emit('close')" size="md">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">Buka Sesi Penjualan</h3>
    </template>
    
    <!-- Gunakan slot default (tanpa nama) untuk konten form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Modal Awal Kasir</label>
        <input
          v-model.number="formData.modal_awal"
          type="number"
          step="0.01"
          min="0"
          placeholder="Masukkan modal awal kasir..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p class="text-xs text-gray-500 mt-1">Modal awal yang tersedia di kasir untuk kembalian</p>
      </div>
      
      <div class="bg-blue-50 p-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">Informasi</h3>
            <div class="mt-2 text-sm text-blue-700">
              <p>Sesi penjualan akan dimulai dengan waktu saat ini. Pastikan modal awal sudah sesuai dengan uang yang tersedia di kasir.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
    
    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buka Sesi
        </button>
      </div>
    </template>
  </Modal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'

export default {
  name: 'OpenSessionModal',
  components: {
    Modal
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const formData = ref({
      modal_awal: 0
    })
    
    const canSubmit = computed(() => {
      return formData.value.modal_awal >= 0
    })
    
    const handleSubmit = () => {
      if (!canSubmit.value) return
      
      const submitData = {
        modal_awal: formData.value.modal_awal,
        waktu_buka: new Date().toISOString()
      }
      
      emit('save', submitData)
    }
    
    // Reset form when modal closes
    watch(() => props.isOpen, (newIsOpen) => {
      if (!newIsOpen) {
        formData.value = {
          modal_awal: 0
        }
      }
    })
    
    return {
      formData,
      canSubmit,
      handleSubmit
    }
  }
}
</script>