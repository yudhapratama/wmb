/**
 * File upload utilities with environment-based configuration
 */

// Get configuration from environment variables
const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_FILE_MAX_SIZE) || 5242880 // 5MB default
const ALLOWED_TYPES = (import.meta.env.VITE_FILE_ALLOWED_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',')
const UPLOAD_FOLDER = import.meta.env.VITE_FILE_UPLOAD_FOLDER || 'uploads'

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result with isValid and error message
 */
export function validateFile(file) {
  if (!file) {
    return { isValid: false, error: 'Tidak ada file yang dipilih' }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
    return { 
      isValid: false, 
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.` 
    }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    const allowedExtensions = ALLOWED_TYPES.map(type => type.split('/')[1]).join(', ')
    return { 
      isValid: false, 
      error: `Tipe file tidak didukung. Format yang diizinkan: ${allowedExtensions.toUpperCase()}` 
    }
  }

  return { isValid: true, error: null }
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get allowed file types for input accept attribute
 * @returns {string} - Comma-separated file types
 */
export function getAllowedFileTypes() {
  return ALLOWED_TYPES.join(',')
}

/**
 * Get max file size
 * @returns {number} - Max file size in bytes
 */
export function getMaxFileSize() {
  return MAX_FILE_SIZE
}

/**
 * Get upload folder
 * @returns {string} - Upload folder name
 */
export function getUploadFolder() {
  return UPLOAD_FOLDER
}

/**
 * Create file preview URL
 * @param {File} file - The file to create preview for
 * @returns {Promise<string>} - Promise that resolves to preview URL
 */
export function createFilePreview(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Get file info for display
 * @param {File} file - The file to get info for
 * @returns {Object} - File information
 */
export function getFileInfo(file) {
  if (!file) return null
  
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type,
    lastModified: new Date(file.lastModified).toLocaleDateString('id-ID')
  }
}