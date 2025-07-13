<script setup>
import { supplierCategoryOptions } from '../../../constants/supplierCategories'

const props = defineProps({
  supplier: {
    type: Object,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:supplier'])

function updateSupplier(field, value) {
  const updatedSupplier = { ...props.supplier, [field]: value }
  emit('update:supplier', updatedSupplier)
}
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
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kontak *</label>
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
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori Supplier</label>
        <select
          :value="supplier.kategori_supplier"
          @change="updateSupplier('kategori_supplier', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="" disabled>Pilih kategori</option>
          <option v-for="category in supplierCategoryOptions" :key="category.id" :value="category.value">
            {{ category.text }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          :value="supplier.status"
          @change="updateSupplier('status', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
  </div>
</template>