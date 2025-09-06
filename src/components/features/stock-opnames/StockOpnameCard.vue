<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <!-- Header -->
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">
          Stock Opname #{{ opname.id }}
        </h3>
      </div>
      
      <!-- Status Badge -->
      <span :class="getStatusBadgeClass(opname.status)">
        {{ opname.status || 'Draft' }}
      </span>
    </div>
    
    <!-- Details -->
    <div class="space-y-3 mb-4">
      <!-- Created By -->
      <div class="flex items-center text-sm">
        <UserIcon class="w-4 h-4 text-gray-400 mr-2" />
        <span class="text-gray-600">Dicatat oleh:</span>
        <span class="ml-1 font-medium text-gray-900">
          {{ opname.dicatat_oleh_name || opname.dicatat_oleh?.first_name || 'Admin' }}
        </span>
      </div>
      
      <!-- Items Count -->
      <div class="flex items-center text-sm">
        <ClipboardDocumentListIcon class="w-4 h-4 text-gray-400 mr-2" />
        <span class="text-gray-600">Jumlah Item:</span>
        <span class="ml-1 font-medium text-gray-900">
          {{ opname.items_opname?.length || 0 }} item
        </span>
      </div>
      
      <!-- Notes -->
      <div v-if="opname.catatan_keseluruhan" class="flex items-start text-sm">
        <DocumentTextIcon class="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
        <div>
          <span class="text-gray-600">Catatan:</span>
          <p class="mt-1 text-gray-900 text-sm leading-relaxed">
            {{ opname.catatan_keseluruhan }}
          </p>
        </div>
      </div>
      
      <!-- Created Date -->
      <div class="flex items-center text-sm">
        <CalendarIcon class="w-4 h-4 text-gray-400 mr-2" />
        <span class="text-gray-600">Tanggal Opname:</span>
        <span class="ml-1 text-gray-900">
          {{ formatDate(opname.tanggal_opname) }}
        </span>
      </div>
      
      <!-- Last Updated -->
      <div v-if="opname.date_updated && opname.date_updated !== opname.date_created" class="flex items-center text-sm">
        <ClockIcon class="w-4 h-4 text-gray-400 mr-2" />
        <span class="text-gray-600">Diperbarui:</span>
        <span class="ml-1 text-gray-900">
          {{ formatDateTime(opname.date_updated) }}
        </span>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex justify-between items-center pt-4 border-t border-gray-100">
      <!-- View Details Button -->
      <button
        @click="$emit('detail', opname)"
        class="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm"
      >
        <EyeIcon class="w-4 h-4" />
        Detail
      </button>
      
      <!-- Action Buttons (right side) -->
      <div class="flex space-x-2">
        <!-- Manage Items (only for Draft status) -->
        <PermissionBasedAccess collection="stock_opnames" action="update">
          <button
            v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
            @click="$emit('manage-items', opname)"
            class="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
            title="Kelola Item"
          >
            <ClipboardDocumentListIcon class="w-4 h-4" />
          </button>
        </PermissionBasedAccess>
        
        <!-- Edit (only for Draft status) -->
        <PermissionBasedAccess collection="stock_opnames" action="update">
          <button
            v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
            @click="$emit('edit', opname)"
            class="p-2 text-green-600 hover:bg-green-50 rounded-md"
            title="Edit"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
        </PermissionBasedAccess>
        
        <!-- Complete (only for Draft status) -->
        <PermissionBasedAccess collection="stock_opnames" action="update">
          <button
            v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
            @click="$emit('complete', opname)"
            class="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
            title="Selesaikan"
          >
            <CheckIcon class="w-4 h-4" />
          </button>
        </PermissionBasedAccess>
        
        <!-- Delete (only for Draft status) -->
        <PermissionBasedAccess collection="stock_opnames" action="delete">
          <button
            v-if="!opname.status || opname.status.toLowerCase() === 'draft'"
            @click="$emit('delete', opname)"
            class="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Hapus"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </PermissionBasedAccess>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  UserIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import PermissionBasedAccess from '../../ui/PermissionBasedAccess.vue'

// Props
defineProps({
  opname: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['detail', 'edit', 'complete', 'delete', 'manage-items'])

// Methods
function formatDate(dateString) {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return '-'
  }
}

function formatDateTime(dateString) {
  if (!dateString) return '-'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return '-'
  }
}

function getStatusBadgeClass(status) {
  const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium'
  
  // Default to Draft if no status
  const currentStatus = status || 'Draft'
  
  switch (currentStatus.toLowerCase()) {
    case 'draft':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'selesai':
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'dibatalkan':
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}
</script>