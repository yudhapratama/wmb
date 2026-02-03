<template>
  <div class="pos-container">
    <!-- Header -->
    <div class="pos-header">
      <div class="header-content">
        <!-- Title Section -->
        <div class="header-title">
          <h1 class="text-2xl font-bold text-gray-800">Point of Sale</h1>
        </div>
        
        <!-- Info Section -->
        <div class="header-info">
          <div class="info-card">
            <div class="info-label">Kasir</div>
            <div class="info-value">{{ currentSession?.cashier?.first_name || 'Loading...' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Sesi Penjualan</div>
            <div class="info-value">#{{ currentSession?.id || 'Loading...' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">Item di Keranjang</div>
            <div class="info-value">{{ cartItemCount }} item(s)</div>
          </div>
        </div>
        
        <!-- Action Section -->
        <div class="header-actions">
          <router-link 
            to="/sales" 
            class="btn-back"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Kembali ke Riwayat Penjualan
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main POS Layout -->
    <div class="pos-main">
      <!-- Left Panel - Products (70%) -->
      <div class="pos-products-panel">
        <!-- Search and Filters -->
        <div class="search-section">
          <div class="search-bar">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari produk..."
                class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Category Shortcuts -->
          <div class="category-shortcuts">
            <button
              @click="selectCategory(null)"
              :class="[
                'category-btn',
                selectedCategoryId === null ? 'active' : ''
              ]"
            >
              Semua ({{ products.length }})
            </button>
            <button
              v-for="category in productCategories"
              :key="category.id"
              @click="selectCategory(category.id)"
              :class="[
                'category-btn',
                selectedCategoryId === category.id ? 'active' : ''
              ]"
            >
              {{ category.name }} ({{ getProductCountByCategory(category.id) }})
            </button>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="products-grid-container">
          <div v-if="isLoadingProducts" class="loading-state">
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p class="text-gray-600">Memuat produk...</p>
            </div>
          </div>
          <div v-else-if="filteredProducts.length === 0" class="empty-state">
            <div class="text-center py-8">
              <p class="text-gray-500">Tidak ada produk ditemukan</p>
            </div>
          </div>
          <!-- Update template bagian product card (sekitar baris 84-104) -->
          <div v-else>
          <div 
            v-for="product in filteredProducts" 
            :key="product.id" 
            class="product-card-horizontal"
            @click="handleAddToCart(product)"
            :class="{ 'out-of-stock': product.stock_quantity === 0 }"
          >
            <div class="product-image-container">
              <img
                :src="getProductImageSrc(product)"
                :alt="product.nama_produk"
                class="product-image"
                @error="handleImageError"
              />
              <div v-if="product.stock_quantity === 0" class="stock-overlay">
                <span class="stock-badge">Habis</span>
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name" :title="product.nama_produk">{{ product.nama_produk }}</h3>
              <p class="product-price">{{ formatCurrency(product.harga_jual) }}</p>
              <div class="product-meta">
                <span class="product-category">{{ getCategoryName(product.kategori.id) }}</span>
                <!--
                <span class="product-stock" :class="getStockClass(product.stock_quantity)">
                  {{ product.stock_quantity > 0 ? `Stok: ${product.stock_quantity}` : 'Habis' }}
                </span> 
                -->
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Cart (30%) -->
      <div class="pos-cart-panel">
        <div class="cart-header">
          <h2 class="text-xl font-semibold text-gray-800">Keranjang</h2>
          <button
            v-if="!isCartEmpty"
            @click="handleClearCart"
            class="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Kosongkan
          </button>
        </div>

        <!-- Cart Items -->
        <div class="cart-items">
          <div v-if="isCartEmpty" class="empty-cart">
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0L5.4 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <p class="mt-2 text-sm text-gray-500">Keranjang kosong</p>
              <p class="text-xs text-gray-400">Klik produk untuk menambahkan</p>
            </div>
          </div>
          
          <div v-else class="cart-items-list">
            <div
              v-for="item in cartItems"
              :key="item.id"
              class="cart-item"
            >
              <div class="item-info">
                <h4 class="item-name" :title="item.name">{{ item.name }}</h4>
                <p class="item-price">{{ formatCurrency(item.selling_price) }}</p>
              </div>
              <div class="item-controls">
                <button
                  @click="decreaseQuantity(item.id)"
                  class="quantity-btn"
                  :disabled="item.quantity <= 1"
                >
                  -
                </button>
                <span class="quantity">{{ item.quantity }}</span>
                <button
                  @click="increaseQuantity(item.id)"
                  class="quantity-btn"
                  :disabled="item.stock_quantity !== null && item.quantity >= item.stock_quantity"
                >
                  +
                </button>
              </div>
              <div class="item-total">
                {{ formatCurrency(item.selling_price * item.quantity) }}
              </div>
              <button
                @click="removeFromCart(item.id)"
                class="remove-btn"
                title="Hapus item"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Cart Summary -->
        <div v-if="!isCartEmpty" class="cart-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>{{ formatCurrency(cartSubtotal) }}</span>
          </div>
          <div v-if="cartDiscount > 0" class="summary-row discount">
            <span>Diskon:</span>
            <span>-{{ formatCurrency(cartDiscount) }}</span>
          </div>
          <div class="summary-row">
            <span>Pajak ({{ taxRate }}%):</span>
            <span>{{ formatCurrency(cartTax) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>{{ formatCurrency(cartTotal) }}</span>
          </div>
        </div>

        <!-- Payment Options -->
        <div v-if="!isCartEmpty" class="payment-section">
          <h3 class="payment-title">Metode Pembayaran</h3>
          <div class="payment-methods-grid">
            <button
              v-for="method in paymentMethods"
              :key="method.value"
              @click="selectedPaymentMethod = method.value"
              :class="[
                'payment-card',
                selectedPaymentMethod === method.value ? 'selected' : ''
              ]"
            >
              <div class="payment-icon">
                <svg v-if="method.value === 'Cash'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <svg v-else-if="method.value === 'Debit'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <span class="payment-label">{{ method.label }}</span>
            </button>
          </div>

          <div class="payment-input">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Dibayar
            </label>
            <input
              :value="formatNumber(amountPaid)"
              type="text"
              inputmode="numeric"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="handleNumericInput($event, (val) => amountPaid = val)"
            />
            <div class="payment-shortcuts">
              <button
                @click="setExactAmount"
                class="shortcut-btn"
              >
                Pas
              </button>
              <button
                v-for="amount in quickAmounts"
                :key="amount"
                @click="setQuickAmount(amount)"
                class="shortcut-btn"
              >
                {{ formatCurrency(amount) }}
              </button>
            </div>
          </div>

          <div v-if="change > 0" class="change-display">
            <span class="change-label">Kembalian:</span>
            <span class="change-amount">{{ formatCurrency(change) }}</span>
          </div>
        </div>

        <!-- Checkout Button -->
        <div class="checkout-section">
          <button
            @click="handleCheckout"
            :disabled="!canCheckout"
            :class="[
              'checkout-btn',
              canCheckout ? 'enabled' : 'disabled'
            ]"
          >
            <span v-if="isProcessing" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
            <span v-else>
              {{ isCartEmpty ? 'Keranjang Kosong' : `Bayar ${formatCurrency(cartTotal)}` }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProducts } from '@/composables/useProducts'
import { useProductCategories } from '@/composables/useProductCategories'
import { useCart } from '@/composables/useCart'
import { useNotification } from '@/composables/useNotification'
import { useSales } from '@/composables/useSales' // ✅ TAMBAHKAN IMPORT INI
import { formatCurrency, formatNumber, handleNumericInput } from '../utils/helpers'
const router = useRouter()
const route = useRoute()
const { showNotification } = useNotification()

// ✅ PERBAIKI: Tambahkan currentSession ke destructuring useSales
const { loadCurrentSession, currentSession, isLoadingSession } = useSales()

// ✅ PERBAIKAN: Gunakan currentSession langsung, bukan sessionId dari route
const sessionId = computed(() => currentSession.value?.id || null)

// Products and Categories
const { 
  products, 
  isLoading: isLoadingProducts, 
  loadData: loadProducts 
} = useProducts()

// Product Categories Management
const { 
  categories: productCategories,
  loadData: loadCategories,
  getCategoryName
} = useProductCategories()

// Cart Management
const {
  // State
  cartItems,
  isProcessing,
  selectedPaymentMethod,
  amountPaid,
  taxRate,
  paymentMethods,
  
  // Computed
  cartSubtotal,
  cartDiscount,
  cartTax,
  cartTotal,
  change,
  cartItemCount,
  isCartEmpty,
  canCheckout,
  
  // Methods
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  processCheckout
} = useCart()

// Search and Filter
const searchQuery = ref('')
const selectedCategoryId = ref(null)

// Quick payment amounts
const quickAmounts = computed(() => {
  const total = cartTotal.value
  const amounts = []
  
  // Add common round numbers above total
  const roundNumbers = [50000, 100000, 200000, 500000]
  roundNumbers.forEach(amount => {
    if (amount > total) {
      amounts.push(amount)
    }
  })
  
  return amounts.slice(0, 3) // Limit to 3 quick amounts
})

// Computed Properties
const filteredProducts = computed(() => {
  let filtered = products.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.nama_produk?.toLowerCase().includes(query) ||
      product.deskripsi?.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (selectedCategoryId.value && selectedCategoryId.value !== 'all') {
    filtered = filtered.filter(product => product.kategori.id === selectedCategoryId.value)
  }

  return filtered
})

// Methods
const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
}

const handleAddToCart = (product) => {
  // Validasi stok
  if (product.stock_quantity !== null && product.stock_quantity <= 0) {
    showNotification('Produk habis!', 'warning')
    return
  }
  
  // Format data produk untuk keranjang
  const cartProduct = {
    id: product.id,
    nama_produk: product.nama_produk,
    harga_jual: product.harga_jual,
    harga_pokok: product.harga_pokok || 0, // Pastikan HPP tersedia
    stock_quantity: product.stock_quantity,
    category_id: product.kategori.id,
    image: product.image
  }
  
  // Tambahkan ke keranjang
  addToCart(cartProduct)
}

// Update getProductCountByCategory dengan null safety
const getProductCountByCategory = (categoryId) => {
  if (!products.value || !Array.isArray(products.value)) {
    return 0
  }
  return products.value.filter(product => product.kategori.id === categoryId).length
}

const getStockClass = (stock) => {
  if (stock === null) return 'unlimited'
  if (stock === 0) return 'out-of-stock'
  if (stock <= 5) return 'low-stock'
  return 'in-stock'
}

const handleClearCart = () => {
  if (confirm('Yakin ingin mengosongkan keranjang?')) {
    clearCart()
  }
}

const handleCheckout = async () => {
  if (!canCheckout.value) return
  
  // ✅ PERBAIKAN: Tunggu session loading selesai
  if (isLoadingSession.value) {
    showNotification('Sedang memuat sesi kasir, silakan tunggu...', 'info')
    return
  }
  
  // ✅ PERBAIKAN: Validasi currentSession dengan lebih detail
  if (!currentSession.value || !currentSession.value.id) {
    showNotification('Tidak ada sesi kasir aktif. Silakan buka sesi kasir terlebih dahulu.', 'error')
    console.error('❌ No active session:', currentSession.value)
    return
  }

  // ✅ PERBAIKAN: Validasi metode pembayaran
  if (!selectedPaymentMethod.value) {
    showNotification('Silakan pilih metode pembayaran terlebih dahulu.', 'warning')
    return
  }

  // ✅ PERBAIKAN: Validasi jumlah dibayar
  if (!amountPaid.value || amountPaid.value < cartTotal.value) {
    showNotification('Jumlah dibayar tidak boleh kurang dari total belanja.', 'warning')
    return
  }
  
  console.log('✅ Processing checkout with session:', currentSession.value.id)
  
  // ✅ PERBAIKAN: Kirim paymentData sebagai parameter
  const paymentData = {
    paymentMethod: selectedPaymentMethod.value,
    amountPaid: amountPaid.value
  }
  
  const result = await processCheckout(paymentData)
  
  if (result.success) {
    showNotification(
      `Transaksi berhasil! Total: ${formatCurrency(result.total)}${result.change > 0 ? `, Kembalian: ${formatCurrency(result.change)}` : ''}`,
      'success'
    )
  }
}

const setExactAmount = () => {
  amountPaid.value = cartTotal.value
}

const setQuickAmount = (amount) => {
  amountPaid.value = amount
}

// Helper function untuk placeholder image
const getPlaceholderImage = (text = 'IMG') => {
  const canvas = document.createElement('canvas')
  canvas.width = 80
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  
  // Background
  ctx.fillStyle = '#e5e7eb'
  ctx.fillRect(0, 0, 80, 80)
  
  // Text
  ctx.fillStyle = '#9ca3af'
  ctx.font = '14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.substring(0, 3), 40, 40)
  
  return canvas.toDataURL()
}

const getProductImageSrc = (product) => {
  if (product.image) {
    return product.image
  }
  const text = product.nama_produk?.substring(0, 3) || 'IMG'
  return getPlaceholderImage(text)
}

// Update handleImageError function
const handleImageError = (event) => {
  event.target.src = getPlaceholderImage('No Image')
}

// Watch for cart total changes to update amount paid
watch(cartTotal, (newTotal) => {
  if (amountPaid.value < newTotal) {
    amountPaid.value = newTotal
  }
})

// Lifecycle
onMounted(async () => {
  try {
    console.log('🔄 Loading POS data...')
    
    await Promise.all([
      loadProducts(),
      loadCategories(),
      loadCurrentSession()
    ])
    
    console.log('✅ POS data loaded. Current session:', currentSession.value)
    
    if (!currentSession.value) {
      showNotification('Tidak ada sesi kasir aktif. Silakan buka sesi kasir terlebih dahulu.', 'warning')
    }
    
    // Set initial amount paid
    amountPaid.value = cartTotal.value || 0
  } catch (error) {
    console.error('❌ Error loading POS data:', error)
    showNotification('Gagal memuat data POS', 'error')
  }
})
</script>

<style scoped>
/* Container & Layout */
.pos-container {
  @apply min-h-screen bg-gray-50;
}

.pos-main {
  @apply flex flex-col lg:flex-row lg:h-[calc(100vh-80px)] min-h-0;
}

.pos-products-panel {
  @apply flex-1 p-3 sm:p-4 flex flex-col lg:overflow-hidden;
}

.pos-cart-panel {
  @apply w-full bg-white border-t border-gray-200 p-3 sm:p-4 flex flex-col lg:w-96 lg:border-t-0 lg:border-l lg:overflow-y-auto;
}

/* Header Styles */
.pos-header {
  @apply bg-white shadow-sm border-b border-gray-200 p-4;
}

.header-content {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3;
}

.header-info {
  @apply flex flex-wrap items-center gap-3 sm:gap-6;
}

.info-card {
  @apply text-center;
}

.info-label {
  @apply text-xs text-gray-500 uppercase tracking-wide;
}

.info-value {
  @apply text-sm font-semibold text-gray-800 mt-1;
}

.btn-back {
  @apply flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium;
}

/* Search Section */
.search-section {
  @apply mb-6;
}

.search-bar {
  @apply mb-4;
}

.category-shortcuts {
  @apply flex flex-wrap gap-2;
}

.category-btn {
  @apply px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors;
}

.category-btn.active {
  @apply bg-blue-600 text-white border-blue-600;
}

/* Products Grid */
.products-grid-container {
  @apply flex-1 overflow-y-visible lg:overflow-y-auto;
}

.product-card-horizontal {
  @apply flex items-center p-3 mb-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer;
}

.product-card-horizontal.out-of-stock {
  @apply opacity-60 cursor-not-allowed;
}

.product-image-container {
  @apply relative w-16 h-16 mr-3 flex-shrink-0;
}

.product-image {
  @apply w-full h-full object-cover rounded-md;
}

.stock-overlay {
  @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md;
}

.stock-badge {
  @apply text-xs text-white font-medium;
}

.product-info {
  @apply flex-1 min-w-0;
}

.product-name {
  @apply font-medium text-gray-900 truncate;
}

.product-price {
  @apply text-sm text-blue-600 font-semibold;
}

.product-meta {
  @apply flex items-center justify-between mt-1;
}

.product-category {
  @apply text-xs text-gray-500;
}

.product-stock {
  @apply text-xs font-medium;
}

.product-stock.low-stock {
  @apply text-orange-600;
}

.product-stock.out-of-stock {
  @apply text-red-600;
}

/* Cart Styles */
.cart-header {
  @apply flex items-center justify-between mb-4;
}

.cart-items {
  @apply flex-1 overflow-y-visible lg:overflow-y-auto mb-4;
}

.empty-cart {
  @apply text-center py-8;
}

.cart-items-list {
  @apply space-y-3;
}

.cart-item {
  @apply flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg;
}

.item-info {
  @apply flex-1 min-w-0;
}

.item-name {
  @apply font-medium text-gray-900 text-sm truncate;
}

.item-price {
  @apply text-xs text-gray-600;
}

.item-controls {
  @apply flex items-center gap-2;
}

.quantity-btn {
  @apply w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.quantity {
  @apply text-sm font-medium min-w-[2rem] text-center;
}

.item-total {
  @apply text-sm font-semibold text-gray-900;
}

.remove-btn {
  @apply w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 font-bold;
}

/* Cart Summary */
.cart-summary {
  @apply border-t border-gray-200 pt-4 mb-4 space-y-2;
}

.summary-row {
  @apply flex justify-between text-sm;
}

.summary-row.discount {
  @apply text-green-600;
}

.summary-row.total {
  @apply font-semibold text-lg border-t border-gray-200 pt-2;
}

/* Payment Section */
.payment-section {
  @apply border-t border-gray-200 pt-4 mb-4;
}

.payment-title {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.payment-methods-grid {
  @apply grid grid-cols-2 gap-2 mb-3;
}

.payment-card {
  @apply flex flex-col items-center p-2 border-2 border-gray-200 rounded-md hover:border-blue-300 transition-all cursor-pointer bg-white;
}

.payment-card.selected {
  @apply border-blue-500 bg-blue-50 text-blue-700;
}

.payment-icon {
  @apply mb-1;
}

.payment-label {
  @apply text-xs font-medium;
}

.payment-card:hover {
  @apply shadow-sm;
}

.payment-card.selected .payment-icon {
  @apply text-blue-600;
}

/* Payment Section - Spacing lebih kompak */
.payment-section {
  @apply border-t border-gray-200 pt-3 mb-3;
}

.payment-title {
  @apply text-sm font-medium text-gray-700 mb-2;
}

.payment-input {
  @apply mb-4;
}

.payment-shortcuts {
  @apply flex flex-wrap gap-2 mt-2;
}

.shortcut-btn {
  @apply px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors;
}

.change-display {
  @apply flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg mb-4;
}

.change-label {
  @apply text-sm font-medium text-green-700;
}

.change-amount {
  @apply text-lg font-bold text-green-800;
}

/* Checkout Button */
.checkout-section {
  @apply border-t border-gray-200 pt-4;
}

.checkout-btn {
  @apply w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors;
}

.checkout-btn.enabled {
  @apply bg-blue-600 hover:bg-blue-700;
}

.checkout-btn.disabled {
  @apply bg-gray-400 cursor-not-allowed;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  @apply flex items-center justify-center h-64;
}
</style>
