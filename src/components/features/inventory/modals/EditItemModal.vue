<script setup>
import { ref, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import InventoryForm from '../InventoryForm.vue'
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
  categories: {
    type: Array,
    default: () => []
  },
  suppliers: {
    type: Array,
    default: () => []
  },
  unitOptions: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const editedItem = ref(null)

// Initialize form data when item changes
watch(() => props.item, (newItem) => {
  if (newItem) {
    editedItem.value = { ...newItem }
  }
}, { immediate: true, deep: true })

// Submit form
function handleSubmit() {
  emit('submit', editedItem.value)
}
</script>

<template>
  <Modal 
    :isOpen="isOpen" 
    :title="item ? `Edit Item - ${item.nama_item}` : 'Edit Item'" 
    size="3xl"
    @close="emit('close')"
  >
    <PermissionBasedAccess collection="raw_materials" action="update">
      <div v-if="item && editedItem">
        <InventoryForm
          :item="editedItem"
          :categories="categories"
          :suppliers="suppliers"
          :unitOptions="unitOptions"
          @update:item="(val) => editedItem = val"
          @save="handleSubmit"
        />
      </div>
    </PermissionBasedAccess>
    
    <template v-slot:fallback>
      <div class="p-6 text-center text-gray-500">
        Anda tidak memiliki akses untuk mengedit item ini.
      </div>
    </template>
    
    <template #footer>
      <PermissionBasedAccess collection="raw_materials" action="update">
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
            :disabled="isLoading || !editedItem?.nama_item || !editedItem?.kategori"
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