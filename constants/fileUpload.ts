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
    DESCRIPTION: 'Upload a single creative file or ZIP with assets',
    PLACEHOLDER: 'Drop your creative file here or click to browse',
    REQUIREMENTS: [
      'For HTML creatives: ZIP files with assets are automatically detected',
      'Single HTML files with images should be packaged as ZIP'
    ]
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

// Single Creative View Constants
export const SINGLE_CREATIVE_VIEW_CONFIG = {
  MODAL: {
    MAX_WIDTH: 'max-w-7xl',
    HEIGHT: 'h-[90vh]',
    HEADER_HEIGHT: 'p-6',
    COLUMN_WIDTHS: {
      PREVIEW: 'flex-1',
      FEATURES: 'w-80',
      DETAILS: 'w-80'
    }
  },
  PREVIEW: {
    MIN_HEIGHT: 'min-h-[400px]',
    BACKGROUND: 'bg-gray-50',
    BORDER_RADIUS: 'rounded-lg'
  },
  FEATURES: {
    SPACING: 'space-y-4',
    CARD_PADDING: 'p-3',
    CARD_BORDER_RADIUS: 'rounded-lg'
  },
  ACTIONS: {
    BUTTON_VARIANTS: {
      PRIMARY: 'outline',
      SECONDARY: 'ghost',
      DANGER: 'ghost'
    },
    BUTTON_SIZES: {
      SMALL: 'sm',
      MEDIUM: 'default'
    }
  }
}
