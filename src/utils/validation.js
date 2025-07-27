export const validatePurchaseOrder = (data) => {
  const errors = []
  
  if (!data.supplier || typeof data.supplier !== 'number') {
    errors.push('Supplier ID harus berupa number')
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push('Minimal harus ada 1 item')
  }
  
  data.items?.forEach((item, index) => {
    if (!item.raw_material_id) {
      errors.push(`Item ${index + 1}: raw_material_id diperlukan`)
    }
  })
  
  return errors
}