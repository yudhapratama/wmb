<script setup>
import { computed } from 'vue'
import Modal from '../../../ui/Modal.vue'
import InventoryDetailView from '../InventoryDetailView.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  },
  getCategoryName: {
    type: Function,
    required: true
  },
  getUnitName: {
    type: Function,
    required: true
  },
  getSupplierName: {
    type: Function,
    required: true
  },
  activeTab: {
    type: String,
    default: 'details'
  }
})

const emit = defineEmits(['close', 'edit', 'shrinkage', 'update:activeTab'])

const modalTitle = computed(() => {
  if (!props.item) return 'Detail Item'
  return `Detail Item - ${props.item.nama_item}`
})
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    :title="modalTitle" 
    size="xl"
    @close="emit('close')"
  >
    <div v-if="item">
      <InventoryDetailView
        :item="item"
        :getCategoryName="getCategoryName"
        :getUnitName="getUnitName"
        :getSupplierName="getSupplierName"
        :activeTab="activeTab"
        @update:activeTab="(tab) => emit('update:activeTab', tab)"
        @edit="() => emit('edit', item)"
      />
    </div>
    
    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          @click="emit('close')"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Tutup
        </button>
        <PermissionBasedAccess collection="raw_materials" action="delete">
          <button
            @click="emit('shrinkage', item)"
            class="px-4 py-2 bg-red-600 text-sm text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Catat Shrinkage
          </button>
        </PermissionBasedAccess>
        <PermissionBasedAccess collection="raw_materials" action="update">
          <button
            @click="emit('edit', item)"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Item
          </button>
        </PermissionBasedAccess>
      </div>
    </template>
  </Modal>
</template>