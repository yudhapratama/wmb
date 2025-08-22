import { ref, computed } from 'vue'
import api from '../services/api'
import salesService from '../services/salesService'
import { useNotification } from './useNotification'
import { useAuthStore } from '../stores/auth'
import { useSales } from './useSales' // ✅ TAMBAHKAN IMPORT INI

export function useCart() {
  const { showNotification } = useNotification()
  const authStore = useAuthStore()
  const user = computed(() => authStore.user)
  const { currentSession } = useSales() // ✅ TAMBAHKAN INI UNTUK MENDAPATKAN currentSession

  // Cart State
  const cartItems = ref([])
  const isProcessing = ref(false)
  const selectedPaymentMethod = ref('cash')
  const amountPaid = ref(0)
  const taxRate = ref(10) // 10% tax
  const discountAmount = ref(0)
  const discountPercentage = ref(0)

  // Payment Methods
  const paymentMethods = [
    { value: 'cash', label: 'Tunai' },
    { value: 'card', label: 'Kartu Debit/Kredit' },
    { value: 'transfer', label: 'Transfer Bank' },
    { value: 'qris', label: 'QRIS' },
    { value: 'ovo', label: 'OVO' },
    { value: 'gopay', label: 'GoPay' },
    { value: 'dana', label: 'DANA' }
  ]

  // Computed Properties
  const cartSubtotal = computed(() => {
    return cartItems.value.reduce((total, item) => {
      return total + (item.selling_price * item.quantity)
    }, 0)
  })

  const cartDiscount = computed(() => {
    if (discountPercentage.value > 0) {
      return cartSubtotal.value * (discountPercentage.value / 100)
    }
    return discountAmount.value
  })

  const cartTax = computed(() => {
    const subtotalAfterDiscount = cartSubtotal.value - cartDiscount.value
    return subtotalAfterDiscount * (taxRate.value / 100)
  })

  const cartTotal = computed(() => {
    return cartSubtotal.value - cartDiscount.value + cartTax.value
  })

  const change = computed(() => {
    return Math.max(0, amountPaid.value - cartTotal.value)
  })

  const cartItemCount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0)
  })

  const isCartEmpty = computed(() => {
    return cartItems.value.length === 0
  })

  const canCheckout = computed(() => {
    return !isCartEmpty.value && 
           amountPaid.value >= cartTotal.value && 
           selectedPaymentMethod.value &&
           !isProcessing.value
  })

  // Cart Methods
  const addToCart = (product) => {
    try {
      // Check if product has sufficient stock
      if (product.stock_quantity !== null && product.stock_quantity <= 0) {
        showNotification('Stok produk tidak tersedia', 'warning')
        return false
      }

      const existingItem = cartItems.value.find(item => item.id === product.id)
      
      if (existingItem) {
        // Check stock limit
        if (product.stock_quantity !== null && 
            existingItem.quantity >= product.stock_quantity) {
          showNotification(`Stok tidak mencukupi. Tersedia: ${product.stock_quantity}`, 'warning')
          return false
        }
        existingItem.quantity += 1
      } else {
        cartItems.value.push({
          id: product.id,
          name: product.nama_produk || product.name,
          selling_price: product.harga_jual || product.selling_price,
          harga_pokok: product.harga_pokok || 0, // Tambahkan HPP
          stock_quantity: product.stock_quantity,
          category_id: product.category_id,
          image: product.image,
          quantity: 1
        })
      }

      showNotification(`${product.name} ditambahkan ke keranjang`, 'success')
      return true
    } catch (error) {
      console.error('Error adding to cart:', error)
      showNotification('Gagal menambahkan produk ke keranjang', 'error')
      return false
    }
  }

  const removeFromCart = (productId) => {
    try {
      const index = cartItems.value.findIndex(item => item.id === productId)
      if (index > -1) {
        const removedItem = cartItems.value[index]
        cartItems.value.splice(index, 1)
        showNotification(`${removedItem.name} dihapus dari keranjang`, 'info')
        return true
      }
      return false
    } catch (error) {
      console.error('Error removing from cart:', error)
      showNotification('Gagal menghapus produk dari keranjang', 'error')
      return false
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        return removeFromCart(productId)
      }

      const item = cartItems.value.find(item => item.id === productId)
      if (!item) return false

      // Check stock limit
      if (item.stock_quantity !== null && newQuantity > item.stock_quantity) {
        showNotification(`Stok tidak mencukupi. Tersedia: ${item.stock_quantity}`, 'warning')
        return false
      }

      item.quantity = newQuantity
      return true
    } catch (error) {
      console.error('Error updating quantity:', error)
      showNotification('Gagal mengupdate jumlah produk', 'error')
      return false
    }
  }

  const increaseQuantity = (productId) => {
    const item = cartItems.value.find(item => item.id === productId)
    if (item) {
      return updateQuantity(productId, item.quantity + 1)
    }
    return false
  }

  const decreaseQuantity = (productId) => {
    const item = cartItems.value.find(item => item.id === productId)
    if (item) {
      return updateQuantity(productId, item.quantity - 1)
    }
    return false
  }

  const clearCart = () => {
    try {
      cartItems.value = []
      amountPaid.value = 0
      discountAmount.value = 0
      discountPercentage.value = 0
      selectedPaymentMethod.value = 'cash'
      showNotification('Keranjang dikosongkan', 'info')
      return true
    } catch (error) {
      console.error('Error clearing cart:', error)
      showNotification('Gagal mengosongkan keranjang', 'error')
      return false
    }
  }

  const applyDiscount = (type, value) => {
    try {
      if (type === 'percentage') {
        discountPercentage.value = Math.max(0, Math.min(100, value))
        discountAmount.value = 0
      } else if (type === 'amount') {
        discountAmount.value = Math.max(0, Math.min(cartSubtotal.value, value))
        discountPercentage.value = 0
      }
      return true
    } catch (error) {
      console.error('Error applying discount:', error)
      showNotification('Gagal menerapkan diskon', 'error')
      return false
    }
  }

  const removeDiscount = () => {
    discountAmount.value = 0
    discountPercentage.value = 0
  }

  // Checkout Process
  // Di dalam processCheckout function
  async function processCheckout(paymentData) {
    try {
      isProcessing.value = true
    
      console.log('🔄 Starting checkout process...')
      console.log('📊 Current session:', currentSession.value)
      
      // Hitung total dari cart
      const total = cartTotal.value
      
      // ✅ PERBAIKAN: Validasi dengan logging yang lebih detail
      if (!currentSession.value) {
        console.error('❌ currentSession is null or undefined')
        throw new Error('Tidak ada sesi aktif. Silakan buka sesi kasir terlebih dahulu.')
      }
      
      if (!currentSession.value.id) {
        console.error('❌ currentSession.id is missing:', currentSession.value)
        throw new Error('ID sesi tidak valid. Silakan refresh halaman.')
      }
      
      const sessionId = currentSession.value.id
      console.log('✅ Using session ID:', sessionId)
      
      // Prepare sales data
      const salesData = {
        sesi_penjualan: sessionId,
        mekanisme_pembayaran: paymentData.paymentMethod,
        total: total,
        dibayarkan: paymentData.amountPaid,
        kembalian: paymentData.amountPaid - total,
        items: cartItems.value.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          harga_jual_saat_transaksi: item.selling_price, // ✅ Ubah dari item.harga_jual
          hpp_saat_transaksi: item.harga_pokok || 0,
          margin_saat_transaksi: (item.selling_price - (item.harga_pokok || 0)) // ✅ Ubah dari item.harga_jual
        }))
      }
      
      console.log('📦 Sales data:', salesData)
      
      // Create sales transaction
      const result = await salesService.createSalesTransaction(salesData)
      
      if (result.success) {
        // Clear cart setelah transaksi berhasil
        clearCart()
        
        showNotification('Transaksi berhasil disimpan!', 'success')
        
        return {
          success: true,
          saleId: result.salesId,
          total: cartTotal.value,
          change: change.value
        }
      } else {
        throw new Error(result.error || 'Gagal menyimpan transaksi')
      }
    } catch (error) {
      console.error('❌ Checkout error:', error)
      const errorMessage = error.message || 'Terjadi kesalahan saat memproses transaksi'
      showNotification(errorMessage, 'error')
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isProcessing.value = false
    }
  }

  // Utility Methods
  const getCartSummary = () => {
    return {
      itemCount: cartItemCount.value,
      subtotal: cartSubtotal.value,
      discount: cartDiscount.value,
      tax: cartTax.value,
      total: cartTotal.value,
      amountPaid: amountPaid.value,
      change: change.value
    }
  }

  const validateCart = () => {
    const errors = []
    
    if (isCartEmpty.value) {
      errors.push('Keranjang kosong')
    }
    
    // Check stock availability
    cartItems.value.forEach(item => {
      if (item.stock_quantity !== null && item.quantity > item.stock_quantity) {
        errors.push(`Stok ${item.name} tidak mencukupi`)
      }
    })
    
    if (amountPaid.value < cartTotal.value) {
      errors.push('Jumlah pembayaran kurang')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  return {
    // State
    cartItems,
    isProcessing,
    selectedPaymentMethod,
    amountPaid,
    taxRate,
    discountAmount,
    discountPercentage,
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
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,
    processCheckout,
    getCartSummary,
    validateCart
  }
}