<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4 py-12">
    <div class="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
      <h1 class="text-6xl font-bold text-indigo-600 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
      <p class="text-gray-600 mb-8">Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
      
      <div class="flex justify-center space-x-4">
        <button 
          @click="goBack" 
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          Kembali
        </button>
        <button 
          @click="goHome" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Ke Beranda
        </button>
      </div>
    </div>
  </div>
</template>