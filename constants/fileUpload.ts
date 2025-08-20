// File upload configuration interface
interface FileUploadConfigItem {
  ALLOWED_TYPES: string[]
  MAX_SIZE_MB: number
  ACCEPT_EXTENSIONS: string
  LABEL: string
  DESCRIPTION: string
  PLACEHOLDER: string
  REQUIREMENTS: string[]
}

// File upload configurations
export const FILE_UPLOAD_CONFIG: Record<string, FileUploadConfigItem> = {
  SINGLE_CREATIVE: {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/html', 'application/zip'],
    MAX_SIZE_MB: Infinity,
    ACCEPT_EXTENSIONS: '.jpg,.jpeg,.png,.gif,.webp,.html,.zip',
    LABEL: 'Single Creative',
    DESCRIPTION: 'Upload a single creative file',
    PLACEHOLDER: 'Drop your creative file here or click to browse',
    REQUIREMENTS: []
    // TODO: BACKEND INTEGRATION - Update file type validation
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. These are client-side validations only
    // 2. Server-side validation MUST be implemented
    // 3. Consider adding: .svg, .pdf, .docx for broader support
    // 4. Implement MIME type checking on server
    // 5. Add file signature validation (magic bytes)
    // 6. Consider file content analysis for security
    // 7. Add virus scanning for all uploaded files
    // 8. Implement file size limits based on user tier
    // 9. Add file format conversion capabilities
    // 10. Consider implementing file preview generation
  },
  MULTIPLE_CREATIVES: {
    ALLOWED_TYPES: ['application/zip'],
    MAX_SIZE_MB: Infinity,
    ACCEPT_EXTENSIONS: '.zip',
    LABEL: 'Multiple Creatives',
    DESCRIPTION: 'Upload multiple creatives in a ZIP file',
    PLACEHOLDER: 'Drop your ZIP file here or click to browse',
    REQUIREMENTS: [
      'Supported formats: JPEG, PNG, GIF, WebP, HTML',
      'All files will be extracted and processed'
    ]
    // TODO: BACKEND INTEGRATION - ZIP file processing
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. Implement ZIP file extraction on server
    // 2. Validate each extracted file individually
    // 3. Handle nested ZIP files (ZIP within ZIP)
    // 4. Implement file path sanitization
    // 5. Add ZIP bomb protection
    // 6. Limit maximum files per ZIP
    // 7. Implement file deduplication
    // 8. Add progress tracking for large ZIPs
    // 9. Handle corrupted ZIP files gracefully
    // 10. Implement batch processing for extracted files
  }
}

// Upload status messages
export const UPLOAD_STATUS_MESSAGES = {
  IDLE: {
    SINGLE: 'Drop your creative file here or click to browse',
    MULTIPLE: 'Drop your ZIP file here or click to browse'
  },
  UPLOADING: {
    SINGLE: 'Uploading...',
    MULTIPLE: 'Processing ZIP...'
  },
  SUCCESS: {
    SINGLE: 'Creative uploaded successfully!',
    MULTIPLE: 'Multiple creatives uploaded successfully!'
  },
  ERROR: {
    SINGLE: 'Upload failed. Please try again.',
    MULTIPLE: 'Upload failed. Please try again.'
  }
}

// File type icons
export const FILE_TYPE_ICONS = {
  IMAGE: '🖼️',
  HTML: '🌐',
  ZIP: '📦',
  UNKNOWN: '📄'
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// File type detection
export const getFileType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image'
    case 'html':
    case 'htm':
      return 'html'
    case 'zip':
      return 'zip'
    default:
      return 'unknown'
  }
}

// File validation rules
export const FILE_VALIDATION_RULES = {
  IMAGE: {
    MAX_DIMENSIONS: { width: 4096, height: 4096 },
    MIN_DIMENSIONS: { width: 100, height: 100 },
    ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  HTML: {
    MAX_SIZE_KB: 500,
    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'button']
  },
  ZIP: {
    MAX_FILES: 100,
    MAX_DEPTH: 5,
    ALLOWED_CONTENT: ['image', 'html']
  }
}
