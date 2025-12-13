/**
 * Format a number as Indonesian Rupiah
 * @param {number} value - The number to format
 * @param {boolean} showDecimal - Whether to show decimal places
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, showDecimal = false) {
  const minimumFractionDigits = showDecimal ? 2 : 0
  const maximumFractionDigits = showDecimal ? 2 : 0
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value)
}

/**
 * Format a date using specified format
 * @param {Date|string} date - The date to format
 * @param {string} format - The format to use (default: 'DD/MM/YYYY')
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return ''
  
  const d = new Date(date)
  
  // Simple date formatter (for more complex formatting, use a library like day.js)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} ISO formatted date string (YYYY-MM-DD)
 */
export function formatDateISO(date) {
  if (!date) return ''
  
  const d = new Date(date)
  
  // Check if date is valid
  if (isNaN(d.getTime())) return ''
  
  // Return ISO date string (YYYY-MM-DD format)
  return d.toISOString().split('T')[0]
}

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Check if the device is currently online
 * @returns {boolean} True if online, false otherwise
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * Truncate a string to a specified length
 * @param {string} str - The string to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, length = 30) {
  if (!str) return ''
  return str.length > length ? str.substring(0, length) + '...' : str
}

/**
 * Format datetime to Indonesian format (dd mm yyyy hh:mm)
 * @param {Date|string} datetime - The datetime to format
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(datetime, includeTime = true) {
  if (!datetime) return ''
  
  const d = new Date(datetime)
  
  // Check if date is valid
  if (isNaN(d.getTime())) return ''
  
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  
  const dateString = `${day}/${month}/${year}`
  
  if (!includeTime) {
    return dateString
  }
  
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${dateString} ${hours}:${minutes}`
}

/**
 * Format datetime to Indonesian format with month name
 * @param {Date|string} datetime - The datetime to format
 * @param {boolean} includeTime - Whether to include time (default: true)
 * @returns {string} Formatted datetime string with month name
 */
export function formatDateTimeIndonesian(datetime, includeTime = true) {
  if (!datetime) return ''
  
  const d = new Date(datetime)
  
  // Check if date is valid
  if (isNaN(d.getTime())) return ''
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const day = d.getDate()
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()
  
  const dateString = `${day} ${month} ${year}`
  
  if (!includeTime) {
    return dateString
  }
  
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  
  return `${dateString} ${hours}:${minutes}`
}