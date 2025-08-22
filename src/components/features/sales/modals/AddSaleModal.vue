<template>
  <Modal :isOpen="show" @close="$emit('close')" size="xl">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">Transaksi Baru</h3>
    </template>
    
    <!-- Gunakan slot default (tanpa nama) untuk konten form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Product Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Produk</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <input
              v-model="productSearch"
              type="text"
              placeholder="Cari produk..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <Select
              v-model="selectedCategory"
              :options="categoryOptions"
              placeholder="Filter kategori..."
              class="w-full"
            />
          </div>
        </div>
        
        <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            @click="addProduct(product)"
            class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          >
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-medium text-gray-900">{{ product.nama_produk }}</h4>
                <p class="text-sm text-gray-500">{{ product.kategori?.name || 'No Category' }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-green-600">{{ formatCurrency(product.harga_jual) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Selected Items -->
      <div v-if="formData.items.length > 0">
        <label class="block text-sm font-medium text-gray-700 mb-2">Item Terpilih</label>
        <div class="space-y-2">
          <div 
            v-for="(item, index) in formData.items" 
            :key="index"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
          >
            <div class="flex-1">
              <h4 class="font-medium text-gray-900">{{ getProductName(item.product_id) }}</h4>
              <p class="text-sm text-gray-500">{{ formatCurrency(item.harga_jual_saat_transaksi) }} per item</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                type="button"
                @click="decreaseQuantity(index)"
                class="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
              >
                -
              </button>
              <span class="w-12 text-center font-medium">{{ item.jumlah }}</span>
              <button
                type="button"
                @click="increaseQuantity(index)"
                class="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200"
              >
                +
              </button>
              <button
                type="button"
                @click="removeItem(index)"
                class="w-8 h-8 flex items-center justify-center bg-gray-100 text-red-600 rounded-full hover:bg-gray-200 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Payment Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
          <Select
            v-model="formData.mekanisme_pembayaran"
            :options="paymentMethodOptions"
            placeholder="Pilih metode pembayaran"
            class="w-full"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dibayarkan</label>
          <input
            v-model.number="formData.dibayarkan"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <!-- Transaction Summary -->
      <div class="bg-gray-50 p-4 rounded-md">
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Subtotal:</span>
            <span class="font-medium">{{ formatCurrency(totalTransaksi) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Dibayarkan:</span>
            <span class="font-medium">{{ formatCurrency(formData.dibayarkan || 0) }}</span>
          </div>
          <div class="flex justify-between border-t pt-2">
            <span class="font-medium">Kembalian:</span>
            <span class="font-bold" :class="kembalian >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(kembalian) }}
            </span>
          </div>
        </div>
      </div>
    </form>
    
    <template #footer>
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simpan Transaksi
        </button>
      </div>
    </template>
  </Modal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Modal from '../../../ui/Modal.vue'
import Select from '../../../ui/Select.vue'
import { useProducts } from '@/composables/useProducts'
import { useProductCategories } from '@/composables/useProductCategories'
import { formatCurrency } from '@/utils/helpers'

export default {
  name: 'AddSaleModal',
  components: {
    Modal,
    Select
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    currentSession: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const { products } = useProducts()
    const { categories } = useProductCategories()
    
    const productSearch = ref('')
    const selectedCategory = ref('all')
    
    const formData = ref({
      sesi_penjualan: props.currentSession?.id || null,
      mekanisme_pembayaran: '',
      dibayarkan: 0,
      items: []
    })
    
    const paymentMethodOptions = [
      { value: 'Cash', label: 'Tunai' },
      { value: 'BRI', label: 'BRI' },
      { value: 'BNI', label: 'BNI' },
      { value: 'OVO', label: 'OVO' },
      { value: 'QR', label: 'QR Code' }
    ]
    
    const categoryOptions = computed(() => [
      { value: 'all', label: 'Semua Kategori' },
      ...categories.value.map(category => ({
        value: category.id,
        label: category.nama_kategori
      }))
    ])
    
    const filteredProducts = computed(() => {
      let filtered = products.value
      
      if (productSearch.value) {
        filtered = filtered.filter(product => 
          product.nama_produk.toLowerCase().includes(productSearch.value.toLowerCase())
        )
      }
      
      if (selectedCategory.value !== 'all') {
        filtered = filtered.filter(product => product.kategori === selectedCategory.value)
      }
      
      return filtered
    })
    
    const totalTransaksi = computed(() => {
      return formData.value.items.reduce((total, item) => {
        return total + (item.harga_jual_saat_transaksi * item.jumlah)
      }, 0)
    })
    
    const kembalian = computed(() => {
      return (formData.value.dibayarkan || 0) - totalTransaksi.value
    })
    
    const canSubmit = computed(() => {
      return formData.value.items.length > 0 && 
             formData.value.mekanisme_pembayaran && 
             formData.value.dibayarkan >= totalTransaksi.value
    })
    
    const getProductName = (productId) => {
      const product = products.value.find(p => p.id === productId)
      return product ? product.nama_produk : 'Unknown Product'
    }
    
    const addProduct = (product) => {
      const existingIndex = formData.value.items.findIndex(item => item.product_id === product.id)
      
      if (existingIndex >= 0) {
        formData.value.items[existingIndex].jumlah += 1
      } else {
        formData.value.items.push({
          product_id: product.id,
          jumlah: 1,
          harga_jual_saat_transaksi: product.harga_jual,
          hpp_saat_transaksi: product.tipe_produk === 'basic' ? product.harga_pokok : product.total_harga_bahan,
          margin_saat_transaksi: product.harga_jual - (product.tipe_produk === 'basic' ? product.harga_pokok : product.total_harga_bahan)
        })
      }
    }
    
    const increaseQuantity = (index) => {
      formData.value.items[index].jumlah += 1
    }
    
    const decreaseQuantity = (index) => {
      if (formData.value.items[index].jumlah > 1) {
        formData.value.items[index].jumlah -= 1
      }
    }
    
    const removeItem = (index) => {
      formData.value.items.splice(index, 1)
    }
    
    const handleSubmit = () => {
      if (!canSubmit.value) return
      
      const submitData = {
        ...formData.value,
        total_transaksi: totalTransaksi.value,
        kembalian: kembalian.value,
        waktu_transaksi: new Date().toISOString()
      }
      
      emit('save', submitData)
    }
    
    // Reset form when modal closes
    watch(() => props.show, (newShow) => {
      if (!newShow) {
        formData.value = {
          sesi_penjualan: props.currentSession?.id || null,
          mekanisme_pembayaran: '',
          dibayarkan: 0,
          items: []
        }
        productSearch.value = ''
        selectedCategory.value = 'all'
      }
    })
    
    return {
      formData,
      productSearch,
      selectedCategory,
      paymentMethodOptions,
      categoryOptions,
      filteredProducts,
      totalTransaksi,
      kembalian,
      canSubmit,
      getProductName,
      addProduct,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      handleSubmit,
      formatCurrency
    }
  }
}
</script>