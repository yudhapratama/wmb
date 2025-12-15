<template>
<div class="bg-white shadow rounded-lg border border-gray-200 p-6">
  <!-- Pagination Info -->
  <div class="flex justify-between items-center">
    <div class="text-sm text-gray-700">
      Menampilkan {{ paginationInfo.start }} - {{ paginationInfo.end }} dari {{ paginationInfo.total }} data
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-700">Tampilkan:</label>
      <select
        :value="itemsPerPage"
        @change="onChangeItemsPerPage($event)"
        class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px]"
      >
        <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="flex justify-center items-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>

  <!-- Table -->
  <div v-else-if="paginatedData.length > 0" class="overflow-x-auto">
    <table class="min-w-full border border-gray-200 rounded-lg overflow-hidden">
      <thead class="bg-gray-50">
        <slot name="thead" />
      </thead>
      <tbody class="divide-y divide-gray-200">
        <slot name="tbody" :data="paginatedData" />
      </tbody>
    </table>
  </div>

  <!-- Empty State -->
  <div v-else class="text-center py-12">
    <slot name="empty">
      <h3 class="text-sm font-medium text-gray-900">Tidak ada data</h3>
      <p class="mt-1 text-sm text-gray-500">Data belum tersedia.</p>
    </slot>
  </div>

  <!-- Pagination -->
  <div v-if="totalPages > 1" class="mt-6 flex justify-center">
    <nav class="flex items-center space-x-2">
      <button
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <button
        v-for="page in visiblePages"
        :key="page"
        @click="changePage(page)"
        :class="[
          'px-3 py-2 text-sm font-medium border rounded-md',
          page === currentPage
            ? 'text-blue-600 bg-blue-50 border-blue-500'
            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
        ]"
      >
        {{ page }}
      </button>

      <button
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </nav>
  </div>
</div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [10, 25, 50]
  },
  defaultItemsPerPage: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['page-change', 'items-per-page-change'])

const currentPage = ref(1)
const itemsPerPage = ref(props.defaultItemsPerPage)

const totalPages = computed(() =>
  Math.ceil(props.data.length / itemsPerPage.value)
)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return props.data.slice(start, start + itemsPerPage.value)
})

const paginationInfo = computed(() => {
  if (props.data.length === 0) {
    return { start: 0, end: 0, total: 0 }
  }

  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(start + itemsPerPage.value - 1, props.data.length)

  return {
    start,
    end,
    total: props.data.length
  }
})

const visiblePages = computed(() => {
  const max = Math.min(totalPages.value, 5)
  return Array.from({ length: max }, (_, i) => i + 1)
})

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  emit('page-change', page)
}

function onChangeItemsPerPage(event) {
  itemsPerPage.value = Number(event.target.value)
  currentPage.value = 1
  emit('items-per-page-change', itemsPerPage.value)
}

watch(() => props.data, () => {
  currentPage.value = 1
})
</script>

<!--
========================
USAGE EXAMPLE
========================

<Datatables
  :data="suppliers"
  :loading="isLoading"
>
  <template #thead>
    <tr>
      <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama</th>
      <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
      <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
    </tr>
  </template>

  <template #tbody="{ data }">
    <tr v-for="item in data" :key="item.id" class="hover:bg-gray-50">
      <td class="px-4 py-3 text-sm text-gray-700">{{ item.name }}</td>
      <td class="px-4 py-3 text-sm text-gray-700">{{ item.email }}</td>
      <td class="px-4 py-3 text-sm">
        <button @click="edit(item)" class="text-blue-600 hover:underline">Edit</button>
      </td>
    </tr>
  </template>

  <template #empty>
    <p class="text-sm text-gray-500">Supplier belum tersedia.</p>
  </template>
</Datatables>

-->
