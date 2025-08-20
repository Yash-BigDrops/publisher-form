// File validation constants
export const FILE_VALIDATION = {
  SINGLE_CREATIVE: {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/html', 'application/zip'],
    MAX_SIZE_MB: Infinity,
    ACCEPT_EXTENSIONS: '.jpg,.jpeg,.png,.gif,.webp,.html,.zip'
    // TODO: BACKEND INTEGRATION - Client-side validation only
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. These validations are for user experience only
    // 2. Server-side validation is MANDATORY for security
    // 3. Implement comprehensive file validation on server
    // 4. Add file signature validation (magic bytes)
    // 5. Implement MIME type verification
    // 6. Add file content analysis
    // 7. Consider implementing file quarantine system
    // 8. Add rate limiting per user/IP
    // 9. Implement file scanning for malware
    // 10. Add file integrity checks (checksums)
  },
  MULTIPLE_CREATIVES: {
    ALLOWED_TYPES: ['application/zip'],
    MAX_SIZE_MB: Infinity,
    ACCEPT_EXTENSIONS: '.zip'
    // TODO: BACKEND INTEGRATION - ZIP validation
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. Implement ZIP file structure validation
    // 2. Add ZIP bomb protection (recursive extraction limits)
    // 3. Validate ZIP file integrity
    // 4. Implement file count limits
    // 5. Add path traversal protection
    // 6. Implement file size distribution limits
    // 7. Add ZIP file header validation
    // 8. Consider implementing ZIP preview
    // 9. Add support for password-protected ZIPs
    // 10. Implement ZIP file compression analysis
  }
}

// Form field validation
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateTelegramId = (telegramId: string): boolean => {
  if (!telegramId || telegramId === '@') return false
  const telegramRegex = /^@[a-zA-Z0-9_]{5,32}$/
  return telegramRegex.test(telegramId)
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type) || 
         allowedTypes.some(type => file.name.toLowerCase().endsWith(type.toLowerCase()))
}

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

// Form validation helpers
export const getFieldError = (fieldName: string, value: string, isRequired: boolean = true): string => {
  if (isRequired && !validateRequired(value)) {
    return `${fieldName} is required`
  }
  
  if (fieldName === 'email' && value && !validateEmail(value)) {
    return 'Please enter a valid email address'
  }
  
  if (fieldName === 'telegramId' && value && !validateTelegramId(value)) {
    return 'Please enter a valid Telegram ID (e.g., @username)'
  }
  
  return ''
}

// File upload validation
export const validateFileUpload = (
  file: File, 
  allowedTypes: string[], 
  maxSizeMB: number
): { isValid: boolean; errorMessage: string } => {
  if (!validateFileType(file, allowedTypes)) {
    return {
      isValid: false,
      errorMessage: `Please select a valid file type: ${allowedTypes.join(', ')}`
    }
  }
  
  if (!validateFileSize(file, maxSizeMB)) {
    return {
      isValid: false,
      errorMessage: `File size must be less than ${maxSizeMB}MB`
    }
  }
  
  return { isValid: true, errorMessage: '' }
}
