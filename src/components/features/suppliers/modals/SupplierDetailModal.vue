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
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama PIC</label>
          <p class="text-gray-900">{{ supplier.nama_pic || '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Pembayaran</label>
          <p class="text-gray-900">{{ supplier.tempo_pembayaran === 1 ? 'Cash' : supplier.tempo_pembayaran === 2 ? 'Tempo' : '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
          <p class="text-gray-900">{{ supplier.nama_bank || '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
          <p class="text-gray-900">{{ supplier.nomor_rekening || '-' }}</p>
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
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <p class="text-gray-900">{{ supplier.catatan || '-' }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <div class="flex gap-3">
          <PermissionBasedAccess collection="suppliers" action="update">
            <button
              @click="$emit('assignMaterials', supplier)"
              class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Assign Materials
            </button>
          </PermissionBasedAccess>
          <PermissionBasedAccess collection="suppliers" action="update">
            <button
              @click="$emit('edit', supplier)"
              class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </PermissionBasedAccess>
        </div>
        <div class="flex gap-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
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

defineEmits(['close', 'edit', 'assignMaterials'])
</script>