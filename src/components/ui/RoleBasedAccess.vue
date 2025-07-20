<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  roles: {
    type: Array,
    required: true
  },
  fallback: {
    type: Boolean,
    default: false
  }
})

const authStore = useAuthStore()
const userRole = computed(() => authStore.role?.name?.toLowerCase() || '')
const hasAccess = computed(() => props.roles.includes(userRole.value))
</script>

<template>
  <template v-if="hasAccess">
    <slot></slot>
  </template>
  <template v-else-if="fallback">
    <slot name="fallback">
      <div class="p-4 bg-gray-100 rounded-md text-gray-500 text-center">
        Anda tidak memiliki akses ke konten ini.
      </div>
    </slot>
  </template>
</template>