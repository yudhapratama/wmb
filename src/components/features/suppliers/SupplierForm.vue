<script setup>
import { computed, ref } from 'vue'
import { supplierCategoryOptions } from '../../../constants/supplierCategories'
import Select from '../../../components/ui/Select.vue'

const props = defineProps({
  supplier: {
    type: Object,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  showValidation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:supplier', 'validation-change'])

// Validation state
const validationErrors = ref({})

// Check if field has error
const hasError = (field) => {
  return props.showValidation && validationErrors.value[field]
}

// Validate required fields
const validateForm = () => {
  const errors = {}
  
  if (!props.supplier.nama_pt_toko?.trim()) {
    errors.nama_pt_toko = true
  }
  
  if (!props.supplier.tempo_pembayaran) {
    errors.tempo_pembayaran = true
  }
  
  validationErrors.value = errors
  const isValid = Object.keys(errors).length === 0
  emit('validation-change', isValid)
  return isValid
}

// Expose validation function
defineExpose({
  validateForm
})

function updateSupplier(field, value) {
  const updatedSupplier = { ...props.supplier, [field]: value }
  emit('update:supplier', updatedSupplier)
}

const categoryOptions = computed(() => {
  return supplierCategoryOptions.map(category => ({
    value: category.value,
    label: category.text
  }))
})

const statusOptions = computed(() => [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
])

const paymentTypeOptions = computed(() => [
  { value: '1', label: 'Cash' },
  { value: '2', label: 'Tempo' }
])
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Supplier *</label>
        <input
          :value="supplier.nama_pt_toko"
          @input="updateSupplier('nama_pt_toko', $event.target.value)"
          type="text"
          placeholder="PT Sumber Rejeki"
          :class="[
            'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none',
            hasError('nama_pt_toko') 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          ]"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kontak</label>
        <input
          :value="supplier.no_telp_pic"
          @input="updateSupplier('no_telp_pic', $event.target.value)"
          type="text"
          placeholder="081234567890"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nama PIC</label>
        <input
          :value="supplier.nama_pic"
          @input="updateSupplier('nama_pic', $event.target.value)"
          type="text"
          placeholder="Nama Person in Charge"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Pembayaran *</label>
        <Select
          :modelValue="supplier.tempo_pembayaran"
          @update:modelValue="updateSupplier('tempo_pembayaran', $event)"
          :options="paymentTypeOptions"
          placeholder="Pilih jenis pembayaran"
          :class="hasError('tempo_pembayaran') ? 'border-red-500' : ''"
          :error="hasError('tempo_pembayaran')"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
        <input
          :value="supplier.nama_bank"
          @input="updateSupplier('nama_bank', $event.target.value)"
          type="text"
          placeholder="BCA, Mandiri, dll"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
        <input
          :value="supplier.nomor_rekening"
          @input="updateSupplier('nomor_rekening', $event.target.value)"
          type="text"
          placeholder="1234567890"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori Supplier</label>
        <Select
          :modelValue="supplier.kategori_supplier"
          @update:modelValue="updateSupplier('kategori_supplier', $event)"
          :options="categoryOptions"
          placeholder="Pilih kategori"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <Select
          :modelValue="supplier.status"
          @update:modelValue="updateSupplier('status', $event)"
          :options="statusOptions"
          placeholder="Pilih status"
        />
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
      <textarea
        :value="supplier.alamat_pt_toko"
        @input="updateSupplier('alamat_pt_toko', $event.target.value)"
        placeholder="Alamat lengkap supplier..."
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
      <textarea
        :value="supplier.catatan"
        @input="updateSupplier('catatan', $event.target.value)"
        placeholder="Catatan tambahan..."
        rows="2"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </div>
  </div>
</template>