import { ref } from 'vue'
import { validateFile, createFilePreview, getFileInfo, getAllowedFileTypes } from '../utils/fileUtils'
import api from '../services/api'

/**
 * Composable for handling file uploads with organized folder structure
 * @param {Object} options - Configuration options
 * @returns {Object} - File upload utilities
 */
export function useFileUpload(options = {}) {
  const {
    multiple = false,
    autoUpload = false,
    folder = 'uploads',
    featureName = 'general', // New: feature name for folder organization
    dataId = null // New: data ID for file naming
  } = options

  const files = ref([])
  const previews = ref([])
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const errors = ref([])

  // Cache for created folders to avoid duplicate API calls
  const folderCache = new Map()

  /**
   * Generate organized folder path
   * @returns {string} - Folder path like "Expenses/13082025"
   */
  const generateFolderPath = () => {
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, '') // Format: DDMMYYYY
    return `${featureName}/${dateStr}`
  }

  /**
   * Generate organized filename
   * @param {File} file - Original file
   * @param {string|number} recordId - ID of the data record
   * @returns {string} - New filename
   */
  const generateFileName = (file, recordId) => {
    const now = new Date()
    const timestamp = now.toTimeString().slice(0, 8).replace(/:/g, '') // Format: HHMMSS
    const originalName = file.name.replace(/\s+/g, '_').toLowerCase() // Replace spaces with underscores
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
    const extension = originalName.substring(originalName.lastIndexOf('.'))
    
    return `${nameWithoutExt}-${recordId}-${timestamp}${extension}`
  }

  /**
   * Find existing folder by name and parent
   * @param {string} folderName - Name of the folder to find
   * @param {string|null} parentId - ID of parent folder
   * @returns {Promise<Object|null>} - Folder object or null if not found
   */
  const findFolder = async (folderName, parentId = null) => {
    try {
      const params = {
        filter: {
          name: { _eq: folderName },
          parent: parentId ? { _eq: parentId } : { _null: true }
        }
      }
      
      const response = await api.get('/folders', { params })
      return response.data?.data?.[0] || null
    } catch (error) {
      console.error('Error finding folder:', error)
      return null
    }
  }

  /**
   * Create folder if it doesn't exist
   * @param {string} folderName - Name of the folder to create
   * @param {string|null} parentId - ID of parent folder
   * @returns {Promise<string>} - Folder ID
   */
  const createFolderIfNotExists = async (folderName, parentId = null) => {
    const cacheKey = `${folderName}-${parentId || 'root'}`
    
    // Check cache first
    if (folderCache.has(cacheKey)) {
      return folderCache.get(cacheKey)
    }

    // Check if folder already exists
    let folder = await findFolder(folderName, parentId)
    
    if (!folder) {
      // Create new folder
      try {
        const folderData = {
          name: folderName
        }
        
        if (parentId) {
          folderData.parent = parentId
        }
        
        const response = await api.post('/folders', folderData)
        folder = response.data?.data
        
        if (!folder?.id) {
          throw new Error('Failed to create folder')
        }
      } catch (error) {
        console.error('Error creating folder:', error)
        throw error
      }
    }
    
    // Cache the folder ID
    folderCache.set(cacheKey, folder.id)
    return folder.id
  }

  /**
   * Create nested folder structure
   * @param {string} folderPath - Path like "Expenses/13082025"
   * @returns {Promise<string>} - Final folder ID
   */
  const createNestedFolders = async (folderPath) => {
    const folders = folderPath.split('/')
    let currentParentId = null
    
    for (const folderName of folders) {
      currentParentId = await createFolderIfNotExists(folderName, currentParentId)
    }
    
    return currentParentId
  }

  /**
   * Handle file selection
   * @param {Event} event - File input change event
   */
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    errors.value = []
    
    if (!multiple && selectedFiles.length > 1) {
      errors.value.push('Hanya dapat memilih satu file')
      return
    }

    const validFiles = []
    const newPreviews = []

    for (const file of selectedFiles) {
      const validation = validateFile(file)
      
      if (validation.isValid) {
        validFiles.push(file)
        
        // Create preview for image files
        if (file.type.startsWith('image/')) {
          try {
            const preview = await createFilePreview(file)
            newPreviews.push({
              file,
              preview,
              info: getFileInfo(file)
            })
          } catch (error) {
            console.error('Error creating preview:', error)
          }
        }
      } else {
        errors.value.push(validation.error)
      }
    }

    if (multiple) {
      files.value.push(...validFiles)
      previews.value.push(...newPreviews)
    } else {
      files.value = validFiles
      previews.value = newPreviews
    }

    // Auto upload if enabled
    if (autoUpload && validFiles.length > 0) {
      await uploadFiles()
    }
  }

  /**
   * Upload files to server with organized structure
   * @param {string|number} recordId - ID of the data record for filename
   * @returns {Promise<Array>} - Array of uploaded file IDs
   */
  const uploadFiles = async (recordId = dataId) => {
    if (files.value.length === 0) return []

    isUploading.value = true
    uploadProgress.value = 0
    const uploadedIds = []

    try {
      const folderPath = generateFolderPath()
      
      // Create nested folder structure
      const folderId = await createNestedFolders(folderPath)
      console.log('Created folder ID:', folderId) // Debug log
      
      for (let i = 0; i < files.value.length; i++) {
        const file = files.value[i]
        const formData = new FormData()
        
        // Generate organized filename if recordId is provided
        const fileName = recordId ? generateFileName(file, recordId) : file.name
        
        // Create a new file with the organized name
        const renamedFile = new File([file], fileName, { type: file.type })
        
        // IMPORTANT: Append folder FIRST, then file
        formData.append('folder', folderId)
        formData.append('title', fileName)
        formData.append('file', renamedFile) // File must be last

        console.log('Uploading file:', fileName, 'to folder:', folderId) // Debug log

        const response = await api.post('/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              ((i + (progressEvent.loaded / progressEvent.total)) / files.value.length) * 100
            )
            uploadProgress.value = progress
          }
        })

        console.log('Upload response:', response.data) // Debug log

        if (response.data?.data?.id) {
          uploadedIds.push(response.data.data.id)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      errors.value.push('Gagal mengunggah file')
    } finally {
      isUploading.value = false
      uploadProgress.value = 0
    }

    return uploadedIds
  }

  /**
   * Remove file from selection
   * @param {number} index - Index of file to remove
   */
  const removeFile = (index) => {
    files.value.splice(index, 1)
    previews.value.splice(index, 1)
  }

  /**
   * Clear all files
   */
  const clearFiles = () => {
    files.value = []
    previews.value = []
    errors.value = []
  }

  /**
   * Get file URL from Directus
   * @param {string} fileId - File ID from Directus
   * @returns {string} - File URL
   */
  const getFileUrl = (fileId) => {
    if (!fileId) return ''
    return `${import.meta.env.VITE_API_URL}/assets/${fileId}`
  }

  return {
    files,
    previews,
    isUploading,
    uploadProgress,
    errors,
    handleFileSelect,
    uploadFiles,
    removeFile,
    clearFiles,
    getFileUrl,
    getAllowedFileTypes,
    generateFolderPath,
    generateFileName
  }
}