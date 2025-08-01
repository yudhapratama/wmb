<template>
  <Modal :isOpen="isOpen" title="Detail Supplier" @close="$emit('close')" size="xl">
    <div v-if="supplier" class="space-y-6">
      <!-- Header Info -->
      <div class="flex items-center gap-4">
        <div class="p-3 bg-blue-100 rounded-lg">
          <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900">{{ supplier.nama_pt_toko }}</h3>
          <span :class="supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-1 rounded-full text-xs font-medium">
            {{ supplier.status === 'active' ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Supplier</label>
          <p class="text-gray-900">{{ supplier.nama_pt_toko || '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kontak</label>
          <p class="text-gray-900">{{ supplier.no_telp_pic || '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <p class="text-gray-900">{{ supplier.kategori_supplier || '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <p class="text-gray-900">{{ supplier.status === 'active' ? 'Active' : 'Inactive' }}</p>
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
          <p class="text-gray-900">{{ supplier.alamat_pt_toko || '-' }}</p>
        </div>
      </div>

      <!-- Timestamps -->
      <div class="border-t pt-4">
        <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <span class="font-medium">Created:</span> {{ formatDate(supplier.date_created) }}
          </div>
          <div>
            <span class="font-medium">Updated:</span> {{ formatDate(supplier.date_updated) }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Tutup
        </button>
        <PermissionBasedAccess collection="suppliers" action="update">
          <button
            @click="$emit('edit', supplier)"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Supplier
          </button>
        </PermissionBasedAccess>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '../../../ui/Modal.vue'
import PermissionBasedAccess from '../../../ui/PermissionBasedAccess.vue'

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  supplier: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'edit'])

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>