/**
 * Utility functions for handling images
 */

/**
 * Convert a file to a base64 data URL
 * @param {File} file - The image file to convert
 * @returns {Promise<string>} A promise that resolves with the base64 data URL
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    
    reader.onerror = (e) => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Handle image upload from an input element
 * @param {Event} event - The change event from the file input
 * @returns {Promise<string|null>} A promise that resolves with the image data URL or null if no file selected
 */
export async function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return null
  
  try {
    return await fileToDataUrl(file)
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

/**
 * Resize an image to specified dimensions
 * @param {string} dataUrl - The data URL of the image
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} A promise that resolves with the resized image data URL
 */
export function resizeImage(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width
      let height = img.height
      
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width))
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = Math.round(width * (maxHeight / height))
        height = maxHeight
      }
      
      // Create canvas and resize
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to data URL
      const resizedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(resizedDataUrl)
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'))
    }
    
    img.src = dataUrl
  })
}