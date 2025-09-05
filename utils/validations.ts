// File validation constants
export const FILE_VALIDATION = {
  SINGLE_CREATIVE: {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/html', 'application/zip'],
    MAX_SIZE_MB: Infinity,
    ACCEPT_EXTENSIONS: '.jpg,.jpeg,.png,.gif,.webp,.html,.zip'
  },
  MULTIPLE_CREATIVES: {
    ALLOWED_TYPES: ['application/zip'],
    MAX_SIZE_MB: Infinity,
    ACCEPT_EXTENSIONS: '.zip'
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

export const validateAffiliateId = (affiliateId: string): boolean => {
  // Affiliate ID should be alphanumeric and at least 3 characters
  const affiliateIdRegex = /^[a-zA-Z0-9]{3,20}$/
  return affiliateIdRegex.test(affiliateId.trim())
}

export const validateCompanyName = (companyName: string): boolean => {
  // Company name should be at least 2 characters and contain only letters, numbers, spaces, and common punctuation
  const companyNameRegex = /^[a-zA-Z0-9\s&.,'-]{2,100}$/
  return companyNameRegex.test(companyName.trim())
}

export const validateName = (name: string): boolean => {
  // Name should be at least 2 characters and contain only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/
  return nameRegex.test(name.trim())
}

export const validateOfferId = (offerId: string): boolean => {
  // Offer ID should not be empty and not be the loading state
  return offerId.trim() !== '' && offerId !== 'loading'
}

export const validateCreativeType = (creativeType: string): boolean => {
  // Creative type should be one of the valid options
  const validTypes = ['email', 'display', 'search', 'social', 'native', 'push']
  return validTypes.includes(creativeType)
}

export const validatePriority = (priority: string): boolean => {
  // Priority should be one of the valid options
  const validPriorities = ['High', 'Medium']
  return validPriorities.includes(priority)
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
    // Map field names to user-friendly labels
    const fieldLabels: Record<string, string> = {
      'affiliateId': 'Affiliate ID',
      'companyName': 'Company Name',
      'firstName': 'First Name',
      'lastName': 'Last Name',
      'email': 'Email',
      'telegramId': 'Telegram ID',
      'offerId': 'Offer ID',
      'creativeType': 'Creative Type',
      'priority': 'Priority',
      'additionalNotes': 'Additional Notes',
      'fromLines': 'From Lines',
      'subjectLines': 'Subject Lines'
    }
    
    const label = fieldLabels[fieldName] || fieldName
    return `${label} is required`
  }
  
  if (fieldName === 'email' && value && !validateEmail(value)) {
    return 'Please enter a valid email address'
  }
  
  if (fieldName === 'telegramId' && value && !validateTelegramId(value)) {
    return 'Please enter a valid Telegram ID (e.g., @username)'
  }
  
  if (fieldName === 'affiliateId' && value && !validateAffiliateId(value)) {
    return 'Affiliate ID must be 3-20 characters long and contain only letters and numbers'
  }
  
  if (fieldName === 'companyName' && value && !validateCompanyName(value)) {
    return 'Company name must be 2-100 characters long and contain only letters, numbers, spaces, and common punctuation'
  }
  
  if (fieldName === 'firstName' && value && !validateName(value)) {
    return 'First name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes. Numbers are not allowed.'
  }
  
  if (fieldName === 'lastName' && value && !validateName(value)) {
    return 'Last name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes. Numbers are not allowed.'
  }
  
  if (fieldName === 'offerId' && value && !validateOfferId(value)) {
    return 'Please select a valid offer'
  }
  
  if (fieldName === 'creativeType' && value && !validateCreativeType(value)) {
    return 'Please select a valid creative type'
  }
  
  if (fieldName === 'priority' && value && !validatePriority(value)) {
    return 'Please select a valid priority level'
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

// Form step validation
export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export const validatePersonalDetails = (formData: {
  affiliateId: string
  companyName: string
  firstName: string
  lastName: string
}): FormValidationResult => {
  const errors: Record<string, string> = {}
  
  // Required fields
  if (!validateRequired(formData.affiliateId)) {
    errors.affiliateId = 'Affiliate ID is required'
  } else if (!validateAffiliateId(formData.affiliateId)) {
    errors.affiliateId = 'Affiliate ID must be 3-20 characters long and contain only letters and numbers'
  }
  
  if (!validateRequired(formData.companyName)) {
    errors.companyName = 'Company name is required'
  } else if (!validateCompanyName(formData.companyName)) {
    errors.companyName = 'Company name must be 2-100 characters long and contain only letters, numbers, spaces, and common punctuation'
  }
  
  if (!validateRequired(formData.firstName)) {
    errors.firstName = 'First name is required'
  } else if (!validateName(formData.firstName)) {
    errors.firstName = 'First name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes'
  }
  
  if (!validateRequired(formData.lastName)) {
    errors.lastName = 'Last name is required'
  } else if (!validateName(formData.lastName)) {
    errors.lastName = 'Last name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateContactDetails = (formData: {
  email: string
  telegramId: string
}): FormValidationResult => {
  const errors: Record<string, string> = {}
  
  // Email is required
  if (!validateRequired(formData.email)) {
    errors.email = 'Email is required'
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  // Telegram ID is optional but must be valid if provided
  if (formData.telegramId && formData.telegramId !== '@' && !validateTelegramId(formData.telegramId)) {
    errors.telegramId = 'Please enter a valid Telegram ID (e.g., @username)'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateCreativeDetails = (formData: {
  offerId: string
  creativeType: string
  additionalNotes: string
  fromLines: string
  subjectLines: string
  priority: string
}, hasUploadedFiles: boolean, hasFromSubjectLines: boolean): FormValidationResult => {
  const errors: Record<string, string> = {}
  
  // Required fields
  if (!validateRequired(formData.offerId)) {
    errors.offerId = 'Offer ID is required'
  } else if (!validateOfferId(formData.offerId)) {
    errors.offerId = 'Please select a valid offer'
  }
  
  if (!validateRequired(formData.creativeType)) {
    errors.creativeType = 'Creative type is required'
  } else if (!validateCreativeType(formData.creativeType)) {
    errors.creativeType = 'Please select a valid creative type'
  }
  
  if (!validateRequired(formData.priority)) {
    errors.priority = 'Priority is required'
  } else if (!validatePriority(formData.priority)) {
    errors.priority = 'Please select a valid priority level'
  }
  
  // Creative type specific validations
  if (formData.creativeType === 'email') {
    // For email creatives, either files or from/subject lines must be provided
    if (!hasUploadedFiles && !hasFromSubjectLines) {
      errors.creativeType = 'For email creatives, you must either upload files or provide from/subject lines'
    }
    
    // If from/subject lines are provided, they should not be empty
    if (hasFromSubjectLines) {
      if (!validateRequired(formData.fromLines)) {
        errors.fromLines = 'From lines are required for email creatives'
      }
      if (!validateRequired(formData.subjectLines)) {
        errors.subjectLines = 'Subject lines are required for email creatives'
      }
    }
  } else {
    // For non-email creatives, files are required
    if (!hasUploadedFiles) {
      errors.creativeType = 'Creative files are required'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Complete form validation
export const validateCompleteForm = (formData: {
  affiliateId: string
  companyName: string
  firstName: string
  lastName: string
  email: string
  telegramId: string
  offerId: string
  creativeType: string
  additionalNotes: string
  fromLines: string
  subjectLines: string
  priority: string
}, hasUploadedFiles: boolean, hasFromSubjectLines: boolean): FormValidationResult => {
  const personalValidation = validatePersonalDetails({
    affiliateId: formData.affiliateId,
    companyName: formData.companyName,
    firstName: formData.firstName,
    lastName: formData.lastName
  })
  
  const contactValidation = validateContactDetails({
    email: formData.email,
    telegramId: formData.telegramId
  })
  
  const creativeValidation = validateCreativeDetails(formData, hasUploadedFiles, hasFromSubjectLines)
  
  const allErrors = {
    ...personalValidation.errors,
    ...contactValidation.errors,
    ...creativeValidation.errors
  }
  
  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors
  }
}
