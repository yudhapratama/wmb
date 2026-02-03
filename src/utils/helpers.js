/**
 * Format a number as Indonesian Rupiah
 * @param {number} value - The number to format
 * @param {boolean} showDecimal - Whether to show decimal places
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, showDecimal = false) {
  if (!value) return 'Rp 0'
  const minimumFractionDigits = showDecimal ? 2 : 0
  const maximumFractionDigits = showDecimal ? 2 : 0
  
  const price = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value || 0)
  return price.replace('Rp', 'Rp ')
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
 * Formats a date into a localized long-date string (Indonesian).
 *
 * @param {string|Date} dateString
 *   Date input (ISO string, date string, or Date object)
 *
 * @returns {string}
 *   Localized long date (e.g. "13 Desember 2025")
 */
export function formatDateLong(dateString) {
  if (!dateString) return ''

  const raw = typeof dateString === 'string' ? dateString : ''
  if (raw && raw.includes('T')) {
    const date = new Date(raw)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const datePart = raw ? raw.slice(0, 10) : ''
  const [year, month, day] = datePart ? datePart.split('-') : []

  if (!year || !month || !day) {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const localDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  )

  return localDate.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
 * Flexible Indonesian datetime formatter
 *
 * @param {Date|string} datetime
 *   Date input (ISO string, date string, or Date object)
 * @param {boolean} includeTime
 *   Whether to include time (default: true)
 * @param {Object} options
 *   Additional formatting options
 * @param {'long'|'short'|'numeric'} [options.month='long']
 *   Month format
 * @param {'numeric'|'2-digit'} [options.year='numeric']
 *   Year format
 * @param {'numeric'|'2-digit'} [options.day='numeric']
 *   Day format
 * @param {'long'|'short'} [options.weekday]
 *   Weekday format
 *
 * @returns {string}
 *   Formatted Indonesian datetime string
 */
export function formatDateTimeIndonesian(datetime, includeTime = true, options = {}) {
  if (!datetime) return ''

  const d = new Date(datetime)
  if (isNaN(d.getTime())) return ''

  const {
    month = 'long',
    year = 'numeric',
    day = 'numeric',
    weekday
  } = options

  const dateOptions = {
    day,
    month,
    year,
    ...(weekday && { weekday })
  }

  const dateString = d.toLocaleDateString('id-ID', dateOptions)

  if (!includeTime) {
    return dateString
  }

  const timeString = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${dateString} ${timeString}`
}


export function formatNumber(value, rounded = false) {
  if (value === null || value === undefined || value === '') return '0'
  let num = Number(value)
  if (isNaN(num)) return '0'
  if (rounded) {
    num = Math.round(num)
  }
  return new Intl.NumberFormat('id-ID').format(num)
}
/**
 * 
 * @param {*} value 
 * @returns 
 * how to use
 * const amountPaidFormatted = computed({
    get: () => formatNumber(amountPaid.value),
    set: (val) => {
      amountPaid.value = inputFormatNumber(val)
    }
  })
 */
export function inputFormatNumber(value) {
  if (!value) return 0
  return Number(String(value).replace(/\D/g, ''))
}

/**
 * UI HELPER: Coordinates logic with the Vue event system.
 * Use this in your @input templates.
 */
export function handleNumericInput(event, updateCallback) {
  const rawValue = event.target.value;
  const cleanValue = inputFormatNumber(rawValue);
  updateCallback(cleanValue);
  event.target.value = formatNumber(cleanValue); 
}


export function formatPercentage(value) {
  return `${(value || 0).toFixed(2)}%`
}
