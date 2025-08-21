// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  UPLOAD = 'UPLOAD',
  AUTHENTICATION = 'AUTHENTICATION',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: unknown
  timestamp: Date
}

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_TELEGRAM_ID: 'Please enter a valid Telegram ID',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_FILE_TYPE: 'File type not supported',
    INVALID_OFFER: 'Please select a valid offer'
  },
  NETWORK: {
    CONNECTION_FAILED: 'Connection failed. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    API_UNAVAILABLE: 'Service temporarily unavailable.'
  },
  UPLOAD: {
    FAILED: 'File upload failed. Please try again.',
    INCOMPLETE: 'Upload incomplete. Please try again.',
    STORAGE_FULL: 'Storage limit reached. Please contact support.',
    VIRUS_DETECTED: 'File rejected due to security concerns.'
  },
  AUTHENTICATION: {
    INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
    SESSION_EXPIRED: 'Session expired. Please log in again.',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
    ACCOUNT_LOCKED: 'Account temporarily locked. Please contact support.'
  }
}

// Error creation
export const createError = (
  type: ErrorType,
  message: string,
  code?: string,
  details?: unknown
): AppError => {
  return {
    type,
    message,
    code,
    details,
    timestamp: new Date()
  }
}

// Error handling functions
export const handleValidationError = (fieldName: string, value: string): AppError => {
  if (!value.trim()) {
    return createError(
      ErrorType.VALIDATION,
      ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD,
      'REQUIRED_FIELD'
    )
  }
  
  if (fieldName === 'email' && !isValidEmail(value)) {
    return createError(
      ErrorType.VALIDATION,
      ERROR_MESSAGES.VALIDATION.INVALID_EMAIL,
      'INVALID_EMAIL'
    )
  }
  
  if (fieldName === 'telegramId' && !isValidTelegramId(value)) {
    return createError(
      ErrorType.VALIDATION,
      ERROR_MESSAGES.VALIDATION.INVALID_TELEGRAM_ID,
      'INVALID_TELEGRAM_ID'
    )
  }
  
  return createError(
    ErrorType.VALIDATION,
    `Invalid ${fieldName}`,
    'INVALID_FIELD'
  )
}

export const handleUploadError = (error: { code?: string }): AppError => {
  if (error.code === 'FILE_TOO_LARGE') {
    return createError(
      ErrorType.UPLOAD,
      ERROR_MESSAGES.UPLOAD.FAILED,
      'FILE_TOO_LARGE'
    )
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return createError(
      ErrorType.UPLOAD,
      ERROR_MESSAGES.UPLOAD.FAILED,
      'INVALID_FILE_TYPE'
    )
  }
  
  return createError(
    ErrorType.UPLOAD,
    ERROR_MESSAGES.UPLOAD.FAILED,
    'UPLOAD_FAILED'
  )
}

export const handleNetworkError = (error: { code?: string }): AppError => {
  if (error.code === 'NETWORK_ERROR') {
    return createError(
      ErrorType.NETWORK,
      ERROR_MESSAGES.NETWORK.CONNECTION_FAILED,
      'NETWORK_ERROR'
    )
  }
  
  if (error.code === 'TIMEOUT') {
    return createError(
      ErrorType.NETWORK,
      ERROR_MESSAGES.NETWORK.TIMEOUT,
      'TIMEOUT'
    )
  }
  
  return createError(
    ErrorType.NETWORK,
    ERROR_MESSAGES.NETWORK.SERVER_ERROR,
    'SERVER_ERROR'
  )
}

// Helper functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidTelegramId = (telegramId: string): boolean => {
  if (!telegramId || telegramId === '@') return false
  const telegramRegex = /^@[a-zA-Z0-9_]{5,32}$/
  return telegramRegex.test(telegramId)
}

// Error logging
export const logError = (error: AppError): void => {
  console.error('Application Error:', {
    type: error.type,
    message: error.message,
    code: error.code,
    timestamp: error.timestamp,
    details: error.details
  })
}

// User-friendly error messages
export const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.VALIDATION:
      return error.message
    case ErrorType.NETWORK:
      return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED
    case ErrorType.UPLOAD:
      return ERROR_MESSAGES.UPLOAD.FAILED
    case ErrorType.AUTHENTICATION:
      return ERROR_MESSAGES.AUTHENTICATION.INVALID_CREDENTIALS
    default:
      return 'Something went wrong. Please try again.'
  }
}
