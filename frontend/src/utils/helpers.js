import { CONSTANTS } from '../config/constants'

/**
 * Get language color class for badges
 * @param {string} language - Programming language name
 * @returns {string} CSS classes for language badge
 */
export const getLanguageColor = (language) => {
  return CONSTANTS.LANGUAGE_COLORS[language] || CONSTANTS.LANGUAGE_COLORS.DEFAULT
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Get appropriate icon for file type
 * @param {string} fileName - Name of the file
 * @returns {JSX.Element} Icon component
 */
export const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  if (CONSTANTS.FILE_TYPES.CODE_EXTENSIONS.includes(ext)) {
    return 'code'
  } else if (CONSTANTS.FILE_TYPES.CONFIG_EXTENSIONS.includes(ext)) {
    return 'settings'
  } else if (CONSTANTS.FILE_TYPES.MARKUP_EXTENSIONS.includes(ext)) {
    return 'file-text'
  } else if (CONSTANTS.FILE_TYPES.STYLE_EXTENSIONS.includes(ext)) {
    return 'palette'
  }
  
  return 'file'
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = CONSTANTS.UI.MAX_FILE_PREVIEW_SIZE) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Format date in a human readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
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
 * Check if a file is a code file that can be tested
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if file can be tested
 */
export const isTestableFile = (filePath) => {
  const ext = filePath.split('.').pop()?.toLowerCase()
  return CONSTANTS.FILE_TYPES.CODE_EXTENSIONS.includes(ext)
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

/**
 * Download text as file
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} contentType - MIME type
 */
export const downloadFile = (content, filename, contentType = 'text/plain') => {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default {
  getLanguageColor,
  formatFileSize,
  getFileIcon,
  truncateText,
  formatDate,
  debounce,
  isTestableFile,
  generateId,
  copyToClipboard,
  downloadFile
}