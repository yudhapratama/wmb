<script setup>
import { ref } from 'vue'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'
import { formatNumber, handleNumericInput } from '../../../../utils/helpers'
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  },
  getUnitName: {
    type: Function,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const shrinkageForm = ref({
  quantity: 0,
  reason: '',
  notes: '',
  image: ''
})

const reasonOptions = [
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'damaged', label: 'Rusak' },
  { value: 'lost', label: 'Hilang' },
  { value: 'theft', label: 'Pencurian' },
  { value: 'other', label: 'Lainnya' }
]

// Reset form when modal opens
function resetForm() {
  shrinkageForm.value = {
    quantity: 0,
    reason: '',
    notes: '',
    image: ''
  }
}

// Handle image upload
function handleShrinkageImageUpload(event) {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      shrinkageForm.value.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Submit form
function handleSubmit() {
  emit('submit', shrinkageForm.value)
}
</script>

<template>
  <Modal :isOpen="isOpen" @close="$emit('close')" size="3xl" title="Catat Shrinkage">
    <form @submit.prevent="handleSubmit">
      <div v-if="item" class="space-y-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-1">Stock yang dapat digunakan saat ini:</div>
          <div class="text-lg font-bold text-blue-600">
            {{ formatNumber(item.total_stock) }} {{ getUnitName(item.unit) }}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Shrinkage *</label>
          <input
            :value="formatNumber(shrinkageForm.quantity)"
            type="text"
            inputmode="numeric"
            :max="item.total_stock"
            placeholder="Masukkan jumlah shrinkage"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            @input="handleNumericInput($event, (val) => shrinkageForm.quantity = val)"
            required
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Alasan</label>
          <Select
            v-model="shrinkageForm.reason"
            :options="reasonOptions"
            placeholder="Pilih alasan shrinkage"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            v-model="shrinkageForm.notes"
            placeholder="Catatan tambahan tentang shrinkage..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>
        
        <!-- Photo Upload Feature -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Foto Bukti</label>
          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="$refs.shrinkageFileInput.click()"
              class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ambil Foto
            </button>
            <input
              ref="shrinkageFileInput"
              type="file"
              accept="image/*"
              @change="handleShrinkageImageUpload"
              class="hidden"
            />
            <img
              v-if="shrinkageForm.image"
              :src="shrinkageForm.image"
              alt="Shrinkage evidence"
              class="w-20 h-20 object-cover rounded border"
            />
          </div>
        </div>
      </div>
    </form>
      
    <template #footer>
      <div class="flex gap-2 w-full">
        <button
          @click="emit('close')"
          class="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-sm text-white rounded-md hover:bg-red-700"
          :class="{'cursor-not-allowed' : isLoading || !shrinkageForm.quantity || !shrinkageForm.reason || shrinkageForm.quantity > item.total_stock}"
          :disabled="isLoading || !shrinkageForm.quantity || !shrinkageForm.reason || shrinkageForm.quantity > item.total_stock"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Catat Shrinkage
        </button>
      </div>
    </template>
  </Modal>
</template>