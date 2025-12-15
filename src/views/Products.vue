<script setup>
import { ref, onMounted, watch } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import ProductCard from '../components/features/products/ProductCard.vue'
import ProductFilters from '../components/features/products/ProductFilters.vue'
import AddProductModal from '../components/features/products/modals/AddProductModal.vue'
import EditProductModal from '../components/features/products/modals/EditProductModal.vue'
import DetailProductModal from '../components/features/products/modals/DetailProductModal.vue'
import { useProducts } from '../composables/useProducts'
import { useOfflineStatus } from '../composables/useOfflineStatus'
import PermissionBasedAccess from '../components/ui/PermissionBasedAccess.vue'
import ConfirmationModal from '../components/ui/ConfirmationModal.vue'
import { useSuppliers } from '../composables/useSuppliers'
import { useCookedItems } from '../composables/useCookedItems'
import { useRecipeItems } from '../composables/useRecipeItems'

// Get offline status
const { isOffline } = useOfflineStatus()

// Use suppliers composable
const { suppliers, loadData: loadSuppliersData } = useSuppliers()

// Use cooked items composable untuk bahan setengah jadi sebagai bahan baku
const { 
  cookedItems, 
  reduceStock,
  units, 
  loadData: loadCookedItemsData 
} = useCookedItems()

// Use products composable
const {
  isLoading,
  products,
  categories,
  searchQuery,
  selectedCategory,
  selectedType,
  selectedConsignment,
  filteredProducts,
  paginatedProducts,
  loadData,
  getCategoryName,
  addProduct,
  updateProduct,
  deleteProduct,
  // Pagination
  currentPage,
  itemsPerPage,
  itemsPerPageOptions,
  totalPages,
  paginationInfo,
  changePage,
  changeItemsPerPage,
  resetPagination,
  // Date filter
  dateFilter,
  updateDateFilter
} = useProducts()

// Modal state
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const currentProduct = ref(null)
const isConfirmDeleteOpen = ref(false)
const productToDelete = ref(null)

const activeTab = ref('details')

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success') // 'success' or 'error'

// Watch for filter changes to reset pagination
watch([searchQuery, selectedCategory, dateFilter], () => {
  resetPagination()
}, { deep: true })

// Add useRecipeItems composable
const { 
  addRecipeItems, 
  getRecipeItemsByProduct, 
  loadData: loadRecipeItemsData 
} = useRecipeItems(false) // false = don't auto-load

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadData(),
    loadSuppliersData(),
    loadCookedItemsData(),
    loadRecipeItemsData() // Tambahkan ini
  ])
})

// View product details
function viewProductDetails(product) {
  // Tambahkan recipe_items ke produk
  const productWithRecipe = {
    ...product,
    recipe_items: getRecipeItemsByProduct.value(product.id)
  }
  currentProduct.value = productWithRecipe
  activeTab.value = 'details'
  showDetailModal.value = true
}

// Edit product
function editProduct(product) {
  // Tambahkan recipe_items ke produk seperti di showDetails
  const productWithRecipe = {
    ...product,
    recipe_items: getRecipeItemsByProduct.value(product.id)
  }
  currentProduct.value = productWithRecipe
  showEditModal.value = true
}

// Confirm delete product
function confirmDelete(product) {
  productToDelete.value = product
  isConfirmDeleteOpen.value = true
}

// Handle add product with recipe items and stock reduction
async function handleAddProduct(newProduct) {
  try {
    // 1. Add the product first
    const result = await addProduct(newProduct)
    
    if (result.success) {
      // If recipe-based product, save recipe_items separately and reduce stock
      if (newProduct.tipe_produk === 'recipe' && newProduct.recipe_items?.length > 0) {
        // 2. Add recipe items
        const recipeResult = await addRecipeItems(result.id, newProduct.recipe_items)
        
        if (recipeResult.success) {
          // 3. Reduce stock for each cooked item used in recipe
          let stockReductionErrors = []
          
          for (const recipeItem of newProduct.recipe_items) {
            if (recipeItem.cooked_items_id && recipeItem.jumlah_dibutuhkan > 0) {
              try {
                await reduceStock(recipeItem.cooked_items_id, recipeItem.jumlah_dibutuhkan)
              } catch (stockError) {
                console.error(`Failed to reduce stock for cooked item ${recipeItem.cooked_items_id}:`, stockError)
                stockReductionErrors.push(`${getCookedItemName(recipeItem.cooked_items_id)}: ${stockError.message}`)
              }
            }
          }
          
          // Show appropriate success message
          if (stockReductionErrors.length > 0) {
            showErrorNotification(`Produk dan resep berhasil ditambahkan, tetapi ada masalah pengurangan stok: ${stockReductionErrors.join(', ')}`)
          } else {
            showSuccessNotification('Produk berhasil ditambahkan dan stok bahan telah diperbarui')
          }
        } else {
          showErrorNotification(`Produk berhasil ditambahkan, tetapi gagal menyimpan resep: ${recipeResult.error}`)
        }
      } else {
        // Basic product (non-recipe)
        showSuccessNotification('Produk berhasil ditambahkan')
      }
      
      // Close modal and reload data
      showAddModal.value = false
      await loadData()
      
    } else {
      showErrorNotification(`Gagal menambahkan produk: ${result.error || 'Unknown error'}`)
    }
    
  } catch (error) {
    console.error('Error adding product:', error)
    showErrorNotification('Gagal menambahkan produk')
  }
}

// Handle update product
async function handleUpdateProduct(updatedProduct) {
  const result = await updateProduct(updatedProduct)
  if (result.success) {
    showEditModal.value = false
    showSuccessNotification('Produk berhasil diperbarui')
  } else {
    showErrorNotification(`Gagal memperbarui produk: ${result.error || 'Unknown error'}`)
  }
}

// Handle delete product
async function handleDeleteProduct() {
  if (!productToDelete.value) return
  
  const result = await deleteProduct(productToDelete.value.id)
  if (result.success) {
    isConfirmDeleteOpen.value = false
    productToDelete.value = null
    showSuccessNotification('Produk berhasil dihapus')
  } else {
    showErrorNotification(`Gagal menghapus produk: ${result.error || 'Unknown error'}`)
  }
}

// Notification functions
function showSuccessNotification(message) {
  notificationMessage.value = message
  notificationType.value = 'success'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

function showErrorNotification(message) {
  notificationMessage.value = message
  notificationType.value = 'error'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 5000)
}

// Helper functions
function getCookedItemName(cookedItemId) {
  const item = cookedItems.value.find(c => c.id === cookedItemId)
  return item ? item.name : 'Unknown Item'
}

function getSupplierName(supplierId) {
  const supplier = suppliers.value.find(s => s.id === supplierId)
  return supplier ? (supplier.nama_supplier || supplier.nama_pt_toko || 'Unknown Supplier') : 'Unknown Supplier'
}

function getUnitName(unitId) {
  const unit = units.value.find(u => u.id === unitId)
  return unit ? (unit.abbreviation || unit.name || 'Unknown Unit') : 'Unknown Unit'
}

// Get raw material name by ID
function getRawMaterialName(rawMaterialId) {
  const material = rawMaterials.value.find(rm => rm.id === rawMaterialId)
  return material ? material.nama_item : 'Unknown'
}
</script>

<template>
  <AppLayout title="Produk dan Resep">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Produk dan Resep</h1>
      <PermissionBasedAccess collection="products" action="create">
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Produk
        </button>
      </PermissionBasedAccess>
    </div>
    
    <!-- Filters -->
    <ProductFilters
    :categories="categories"
    :selectedCategory="selectedCategory"
    :selectedType="selectedType"
    :selectedConsignment="selectedConsignment"
    :searchQuery="searchQuery"
    @update:selectedCategory="selectedCategory = $event"
    @update:selectedType="selectedType = $event"
    @update:selectedConsignment="selectedConsignment = $event"
    @update:searchQuery="searchQuery = $event"
    />
    
    <!-- Pagination Info -->
    <div class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        Menampilkan {{ paginationInfo.start }} - {{ paginationInfo.end }} dari {{ paginationInfo.total }} produk
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-700">Tampilkan:</label>
        <select
          :value="itemsPerPage"
          @change="changeItemsPerPage(Number($event.target.value))"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[70px]"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Products Grid -->
    <div v-else-if="paginatedProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      <ProductCard
        v-for="product in paginatedProducts"
        :key="product.id"
        :product="product"
        :getCategoryName="getCategoryName"
        @view="viewProductDetails"
        @edit="editProduct"
        @delete="confirmDelete"
      />
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada produk</h3>
      <p class="mt-1 text-sm text-gray-500">Mulai dengan menambahkan produk pertama Anda.</p>
      <PermissionBasedAccess collection="products" action="create">
        <button
          @click="showAddModal = true"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Produk Pertama
        </button>
      </PermissionBasedAccess>
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
          v-for="page in Math.min(totalPages, 5)"
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
    
    <!-- Modals -->
    <AddProductModal
      v-if="showAddModal"
      :isOpen="showAddModal"
      :categories="categories"
      :suppliers="suppliers"
      :cookedItems="cookedItems"
      :units="units"
      :isLoading="isLoading"
      @close="showAddModal = false"
      @submit="handleAddProduct"
    />
    
    <EditProductModal
      v-if="showEditModal"
      :product="currentProduct"
      :categories="categories"
      :cookedItems="cookedItems"
      :units="units"
      :isLoading="isLoading"
      @close="showEditModal = false"
      @save="handleUpdateProduct"
    />
    
    <DetailProductModal
      v-if="showDetailModal"
      :product="currentProduct"
      :getCategoryName="getCategoryName"
      :getSupplierName="getSupplierName"
      :getCookedItemName="getCookedItemName"
      :getUnitName="getUnitName"
      :cookedItems="cookedItems"
      :units="units"
      v-model:activeTab="activeTab"
      @close="showDetailModal = false"
      @edit="editProduct"
    />
    
    <!-- Confirmation Modal for Delete -->
    <ConfirmationModal
      :isOpen="isConfirmDeleteOpen"
      title="Hapus Produk"
      :message="`Apakah Anda yakin ingin menghapus produk '${productToDelete?.nama_produk}'? Tindakan ini tidak dapat dibatalkan.`"
      confirmText="Hapus"
      cancelText="Batal"
      type="danger"
      @confirm="handleDeleteProduct"
      @cancel="isConfirmDeleteOpen = false; productToDelete = null"
    />
    
    <!-- Notification -->
    <div
      v-if="showNotification"
      :class="[
        'fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 transition-all duration-300',
        notificationType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      ]"
    >
      <div class="flex items-center gap-2">
        <svg v-if="notificationType === 'success'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        {{ notificationMessage }}
      </div>
    </div>
    
    <!-- Offline Indicator -->
    <div v-if="isOffline" class="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        Mode Offline - Data akan disinkronkan saat online
      </div>
    </div>
  </AppLayout>
</template>
