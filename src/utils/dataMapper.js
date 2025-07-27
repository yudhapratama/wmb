// Mapping antara form data dan Directus structure
export const mapFormToDirectus = {
  purchaseOrder: (formData) => ({
    status: formData.status || 'Dibuat',
    supplier: formData.supplier, // Pastikan ini ID
    catatan_pembelian: formData.notes || '',
    date_created: new Date().toISOString()
  }),
  
  poItem: (item) => ({
    item: item.raw_material_id,
    jumlah_pesan: item.quantity,
    harga_satuan: item.total_price
  })
}

export const mapDirectusToForm = {
  purchaseOrder: (directusData) => ({
    status: directusData.status,
    supplier: directusData.supplier,
    notes: directusData.catatan_pembelian,
    orderDate: directusData.date_created
  })
}