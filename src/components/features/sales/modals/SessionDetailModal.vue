<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Detail Transaksi Sesi #{{ session?.id }}</h2>
          <p class="text-sm text-gray-500 mt-1">{{ session?.cashier?.first_name }} {{ session?.cashier?.last_name }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <!-- Summary Section -->
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Ringkasan Penjualan</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Total Rupiah -->
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600 font-medium">Total Penjualan</div>
              <div class="text-2xl font-bold text-green-700">{{ formatCurrency(summary.totalRevenue) }}</div>
            </div>
            
            <!-- Total HPP -->
            <div class="bg-orange-50 p-4 rounded-lg">
              <div class="text-sm text-orange-600 font-medium">Total HPP</div>
              <div class="text-2xl font-bold text-orange-700">{{ formatCurrency(summary.totalCOGS) }}</div>
            </div>
            
            <!-- Total Margin -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600 font-medium">Total Margin</div>
              <div class="text-2xl font-bold text-blue-700">{{ formatCurrency(summary.totalMargin) }}</div>
            </div>
            
            <!-- Margin Percentage -->
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600 font-medium">Margin %</div>
              <div class="text-2xl font-bold text-purple-700">{{ summary.marginPercentage }}%</div>
            </div>
          </div>

          <!-- Items per Category -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Total Item per Kategori</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div v-for="(count, category) in summary.itemsByCategory" :key="category" 
                   class="bg-white p-3 rounded border">
                <div class="text-sm text-gray-600">{{ category }}</div>
                <div class="text-lg font-bold text-gray-900">{{ count }} item</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction Table -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Detail Transaksi per Item</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga per Item</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HPP</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Transaksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in transactionItems" :key="`${item.sales_id}-${item.product_id}`" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.product_name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ item.jumlah }}</td>
                  <td class="px-4 py-3 text-sm text-gray-900">{{ formatCurrency(item.harga_jual_saat_transaksi) }}</td>
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ formatCurrency(item.total_harga) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ formatCurrency(item.hpp_saat_transaksi) }}</td>
                  <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ formatCurrency(item.margin_saat_transaksi) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ formatDateTime(item.date_created) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end p-6 border-t bg-gray-50">
        <button @click="$emit('close')" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { formatCurrency, formatDateTime } from '@/utils/helpers'
import { useSales } from '@/composables/useSales'
import { useProducts } from '@/composables/useProducts'

export default {
  name: 'SessionDetailModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    session: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props) {
    const { sales, loadSales } = useSales()
    const { products, categories, loadData: loadProductData } = useProducts()
    
    const transactionItems = ref([])
    
    // Fetch data when session changes
    watch(() => props.session, async (newSession) => {
      if (newSession && props.show) {
        await loadSessionData(newSession.id)
      }
    }, { immediate: true })
    
    watch(() => props.show, async (show) => {
      if (show && props.session) {
        await loadSessionData(props.session.id)
      }
    })
    
    const loadSessionData = async (sessionId) => {
      try {
        // Fetch sales for this session
        await loadSales()           // Gunakan loadSales dari useSales
        await loadProductData()     // Gunakan loadData dari useProducts (alias sebagai loadProductData)
        
        // Filter sales for this session
        const sessionSales = sales.value.filter(sale => sale.sesi_penjualan?.id === sessionId)
        
        // Get all sales items from the sales data (sudah termasuk dalam response loadSales)
        const allSalesItems = []
        sessionSales.forEach(sale => {
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
              allSalesItems.push({
                ...item,
                sales_id: sale.id,
                product_id: item.product_id?.id || item.product_id
              })
            })
          }
        })
        
        // Enrich with product and sales data
        transactionItems.value = allSalesItems.map(item => {
          const sale = sessionSales.find(s => s.id === item.sales_id)
          const product = products.value.find(p => p.id === item.product_id) || item.product_id
          const category = categories.value.find(c => c.id === product?.kategori?.id || product?.kategori)
          
          return {
            ...item,
            product_name: product?.nama_produk || 'Produk Tidak Ditemukan',
            category_name: category?.nama_kategori || product?.kategori?.name || 'Kategori Tidak Diketahui',
            total_harga: item.jumlah * item.harga_jual_saat_transaksi,
            date_created: sale?.date_created
          }
        })
      } catch (error) {
        console.error('Error loading session data:', error)
      }
    }
    
    // Summary calculations
    const summary = computed(() => {
      const totalRevenue = transactionItems.value.reduce((sum, item) => 
        sum + (item.jumlah * item.harga_jual_saat_transaksi), 0
      )
      
      const totalCOGS = transactionItems.value.reduce((sum, item) => 
        sum + (item.jumlah * (item.hpp_saat_transaksi || 0)), 0
      )
      
      const totalMargin = totalRevenue - totalCOGS
      const marginPercentage = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(1) : 0
      
      // Group by category
      const itemsByCategory = {}
      transactionItems.value.forEach(item => {
        const category = item.category_name || 'Lainnya'
        itemsByCategory[category] = (itemsByCategory[category] || 0) + item.jumlah
      })
      
      return {
        totalRevenue,
        totalCOGS,
        totalMargin,
        marginPercentage,
        itemsByCategory
      }
    })
    
    return {
      transactionItems,
      summary,
      formatCurrency,
      formatDateTime
    }
  }
}
</script>