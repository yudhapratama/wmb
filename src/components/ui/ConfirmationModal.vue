<template>
  <Modal :isOpen="true" :title="title" size="sm" @close="$emit('cancel')">
    <div class="mb-6">
      <p class="text-gray-700">{{ message }}</p>
    </div>
    
    <div class="flex justify-end gap-3">
      <button 
        type="button" 
        @click="$emit('cancel')" 
        class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      >
        Batal
      </button>
      <button 
        type="button" 
        @click="$emit('confirm')" 
        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Konfirmasi
      </button>
    </div>
  </Modal>
</template>

<script setup>
import Modal from './Modal.vue'

// Props
defineProps({
  title: {
    type: String,
    default: 'Konfirmasi'
  },
  message: {
    type: String,
    required: true
  }
})

// Emits
defineEmits(['confirm', 'cancel'])
</script>