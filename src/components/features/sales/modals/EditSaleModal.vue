<template>
  <Modal :show="show" @close="$emit('close')" size="xl">
    <template #header>
      <h3 class="text-lg font-medium text-gray-900">Edit Transaksi #{{ sale?.id }}</h3>
    </template>
    
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-6" v-if="sale">
        <!-- Transaction Info (Read-only) -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ID Transaksi</label>
              <p class="text-lg font-semibold text-gray-900">#{{ sale.id }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Waktu Transaksi</label>
              <p class="text-sm text-gray-900">{{ formatDateTime(sale.waktu_transaksi) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Editable Items -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-4">Item Transaksi</h4>
          <div class="space-y-3">
            <div 
              v-for="(item, index) in formData.items" 
              :key="index"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{{ getProductName(item.product_id) }}</h4>
                <p class="text-sm text-gray-500">{{ formatCurrency(item.harga_jual_saat_transaksi) }} per item</p>
              </div>
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    @click="decreaseQuantity(index)"
                    class="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                  >
                    -
                  </button>
                  <input
                    v-model.number="item.jumlah"
                    type="number"
                    min="1"
                    class="w-16 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @input="updateItemCalculations(index)"
                  />
                  <button
                    type="button"
                    @click="increaseQuantity(index)"
                    class="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                  >
                    +
                  </button>
                </div>
                <div class="text-right min-w-[100px]">
                  <p class="font-medium">{{ formatCurrency(item.harga_jual_saat_transaksi * item.jumlah) }}</p>
                </div>
                <button
                  type="button"
                  @click="removeItem(index)"
                  class="w-8 h-8 flex items-center justify-center bg-gray-100 text-red-600 rounded-full hover:bg-gray-200"
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
        <div class="bg-gray-50 p-4 rounded-lg">
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
    </template>
    
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
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simpan Perubahan
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
import { formatCurrency, formatDateTime } from '@/utils/helpers'

export default {
  name: 'EditSaleModal',
  components: {
    Modal,
    Select
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
    sale: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const { products } = useProducts()
    
    const formData = ref({
      id: null,
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
    
    const increaseQuantity = (index) => {
      formData.value.items[index].jumlah += 1
      updateItemCalculations(index)
    }
    
    const decreaseQuantity = (index) => {
      if (formData.value.items[index].jumlah > 1) {
        formData.value.items[index].jumlah -= 1
        updateItemCalculations(index)
      }
    }
    
    const removeItem = (index) => {
      formData.value.items.splice(index, 1)
    }
    
    const updateItemCalculations = (index) => {
      // Recalculate margin based on new quantity
      const item = formData.value.items[index]
      if (item.jumlah < 1) {
        item.jumlah = 1
      }
    }
    
    const handleSubmit = () => {
      if (!canSubmit.value) return
      
      const submitData = {
        ...formData.value,
        total_transaksi: totalTransaksi.value,
        kembalian: kembalian.value
      }
      
      emit('save', submitData)
    }
    
    // Initialize form data when sale prop changes
    watch(() => props.sale, (newSale) => {
      if (newSale && props.show) {
        formData.value = {
          id: newSale.id,
          mekanisme_pembayaran: newSale.mekanisme_pembayaran,
          dibayarkan: newSale.dibayarkan,
          items: [...newSale.items] // Create a copy to avoid mutating original
        }
      }
    }, { immediate: true })
    
    // Reset form when modal closes
    watch(() => props.show, (newShow) => {
      if (!newShow) {
        formData.value = {
          id: null,
          mekanisme_pembayaran: '',
          dibayarkan: 0,
          items: []
        }
      }
    })
    
    return {
      formData,
      paymentMethodOptions,
      totalTransaksi,
      kembalian,
      canSubmit,
      getProductName,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      updateItemCalculations,
      handleSubmit,
      formatCurrency,
      formatDateTime
    }
  }
}
</script>