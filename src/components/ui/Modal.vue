<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', '2xl', '3xl'].includes(value)
  }
})

const emit = defineEmits(['close'])

// Close modal on escape key
function handleEscKey(event) {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div 
      class="bg-white rounded-lg shadow-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
      :class="{
        'max-w-sm': size === 'sm',
        'max-w-md': size === 'md',
        'max-w-lg': size === 'lg',
        'max-w-2xl': size === 'xl',
        'max-w-4xl': size === '2xl',
        'max-w-6xl': size === '3xl'
      }"
    >
      <div class="px-6 py-4 border-b flex justify-between items-center flex-shrink-0">
        <div class="flex items-center gap-2">
          <slot name="icon"></slot>
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <div class="p-6">
          <slot></slot>
        </div>
      </div>
      
      <div v-if="$slots.footer" class="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>