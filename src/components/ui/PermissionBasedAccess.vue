<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  collection: {
    type: String,
    required: true
  },
  action: {
    type: String,
    default: 'read'
  },
  fallback: {
    type: Boolean,
    default: false
  }
})

const authStore = useAuthStore()
const hasAccess = computed(() => {
  const access = authStore.hasPermission(props.collection, props.action)
  // console.log(`Permission check for ${props.collection}.${props.action}:`, {
  //   access,
  //   userRole: authStore.userRole,
  //   permissionData: authStore.permissions?.[props.collection]?.[props.action],
  //   fullPermissions: authStore.permissions
  // })
  return access
})

// onMounted(() => {
//   console.log(`PermissionBasedAccess mounted for ${props.collection}.${props.action}`)
// })
</script>

<template>
  <template v-if="hasAccess">
    <slot></slot>
  </template>
  <template v-else-if="fallback">
    <slot name="fallback">
      <div class="p-4 bg-gray-100 rounded-md text-gray-500 text-center">
        Anda tidak memiliki akses untuk {{ action }} {{ collection }}.
      </div>
    </slot>
  </template>
</template>