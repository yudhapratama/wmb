# Warung Bakso ERP - Frontend

Aplikasi ERP (Enterprise Resource Planning) untuk manajemen Warung Bakso. Aplikasi ini dibangun dengan Vue 3 dan Vite, dengan dukungan PWA (Progressive Web App) untuk penggunaan offline.

## Fitur

- **Manajemen Inventaris**: Kelola bahan baku, kategori, dan stok
- **Pembelian**: Buat dan kelola pesanan pembelian ke supplier
- **Dapur**: Persiapan dapur dan pencatatan limbah
- **Penjualan**: Sistem POS (Point of Sale) untuk transaksi penjualan
- **Keuangan**: Pencatatan pengeluaran dan laporan keuangan
- **PWA**: Dukungan offline dan sinkronisasi data

## Teknologi

- **Vue 3**: Framework JavaScript progresif untuk membangun UI
- **Vite**: Build tool yang cepat untuk pengembangan modern
- **Pinia**: State management untuk Vue
- **Vue Router**: Routing untuk aplikasi Vue
- **Tailwind CSS**: Framework CSS utility-first
- **Dexie.js**: Wrapper IndexedDB untuk penyimpanan offline
- **Axios**: HTTP client untuk API requests
- **Workbox**: Library untuk PWA dan service worker
- **Vue Query**: Data fetching dan caching

## Persyaratan

- Node.js (versi 18 atau lebih tinggi)
- NPM atau Yarn

## Instalasi

1. Clone repositori:
   ```bash
   git clone https://github.com/username/warung-erp.git
   cd warung-erp/warung_fe
   ```

2. Install dependensi:
   ```bash
   npm install
   # atau
   yarn
   ```

3. Salin file `.env.example` ke `.env.local` dan sesuaikan konfigurasi:
   ```bash
   cp .env.example .env.local
   ```

4. Jalankan server pengembangan:
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

5. Buka browser di `http://localhost:3000`

## Build untuk Produksi

```bash
cd warung_fe
npm run build
# atau
yarn build
```

Hasil build akan tersedia di direktori `dist`.

## Fitur PWA

Aplikasi ini mendukung Progressive Web App (PWA) dengan fitur:

- **Offline Mode**: Aplikasi dapat digunakan tanpa koneksi internet
- **Installable**: Dapat diinstal di perangkat mobile dan desktop
- **Sinkronisasi Data**: Data akan disinkronkan saat koneksi internet tersedia
- **Notifikasi Update**: Pemberitahuan saat versi baru tersedia

## Struktur Proyek

```
src/
├── assets/         # Aset statis (gambar, font, dll)
├── components/     # Komponen Vue
│   ├── layout/     # Komponen layout
│   ├── modules/    # Komponen spesifik modul
│   └── ui/         # Komponen UI umum
├── composables/    # Composables Vue
├── router/         # Konfigurasi Vue Router
├── services/       # Layanan (API, DB, dll)
├── stores/         # Pinia stores
├── utils/          # Fungsi utilitas
├── views/          # Komponen halaman
├── App.vue         # Komponen root
├── main.js         # Entry point
└── sw.js           # Service worker
```


## Troubleshooting

### Masalah Pengalihan ke Dashboard

Jika pengguna dengan peran tertentu (misalnya 'cashier') dialihkan ke dashboard meskipun memiliki izin yang diperlukan untuk mengakses halaman tertentu, periksa konfigurasi `allowedRoles` di file `router/index.js`.

#### Masalah

Di `router/index.js`, ada dua pengecekan yang dilakukan:

1. **Pengecekan Permission** - Memeriksa apakah pengguna memiliki izin 'read' untuk semua koleksi yang diperlukan
2. **Pengecekan Role** - Memeriksa apakah peran pengguna ada dalam daftar `allowedRoles`

Untuk beberapa rute seperti Inventory, peran tertentu mungkin tidak ada dalam daftar `allowedRoles`, sehingga meskipun pengguna memiliki semua izin yang diperlukan, mereka akan dialihkan ke dashboard karena peran mereka tidak diizinkan.

#### Solusi

Tambahkan peran yang diperlukan ke daftar `allowedRoles` untuk rute yang sesuai di `router/index.js`. Contoh:

```javascript
{
  path: '/inventory',
  name: 'inventory',
  component: Inventory,
  meta: { 
    requiresAuth: true,
    allowedRoles: ['superadmin', 'admin', 'warehouse', 'kitchen', 'cashier'],
    requiredCollections: ['raw_materials', 'item_categories', 'suppliers', 'units']
  }
}
```

## Lisensi

MIT
