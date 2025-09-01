import { useState, useCallback } from 'react'
import { 
  validatePersonalDetails, 
  validateContactDetails, 
  validateCreativeDetails,
  validateCompleteForm,
  FormValidationResult,
  getFieldError
} from '@/utils/validations'

export interface FormData {
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
}

export interface ValidationState {
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
}

export const useFormValidation = (initialFormData: FormData) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    touched: {},
    isValid: false
  })
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false)
  const [hasFromSubjectLines, setHasFromSubjectLines] = useState(false)

  // Update form data - this should not trigger state updates that cause infinite loops
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    // This function is now just a placeholder - actual form data is managed by the parent component
    // We don't need to store form data here since it's passed as a parameter to validation functions
  }, [])

  // Mark field as touched
  const markFieldAsTouched = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      touched: { ...prev.touched, [fieldName]: true }
    }))
  }, [])

  // Mark field as touched on blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    markFieldAsTouched(fieldName)
  }, [markFieldAsTouched])

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: string, isRequired: boolean = true) => {
    const error = getFieldError(fieldName, value, isRequired)
    return error
  }, [])

  // Validate field on change
  const handleFieldChange = useCallback((fieldName: string, value: string, isRequired: boolean = true) => {
    const error = validateField(fieldName, value, isRequired)
    
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error
      }
    }))
  }, [validateField])

  // Validate personal details step
  const validatePersonalDetailsStep = useCallback((formData: FormData): FormValidationResult => {
    const result = validatePersonalDetails({
      affiliateId: formData.affiliateId,
      companyName: formData.companyName,
      firstName: formData.firstName,
      lastName: formData.lastName
    })
    
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...result.errors }
    }))
    
    return result
  }, [])

  // Validate contact details step
  const validateContactDetailsStep = useCallback((formData: FormData): FormValidationResult => {
    const result = validateContactDetails({
      email: formData.email,
      telegramId: formData.telegramId
    })
    
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...result.errors }
    }))
    
    return result
  }, [])

  // Validate creative details step
  const validateCreativeDetailsStep = useCallback((formData: FormData, hasFiles: boolean, hasLines: boolean): FormValidationResult => {
    const result = validateCreativeDetails(formData, hasFiles, hasLines)
    
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...result.errors }
    }))
    
    return result
  }, [])

  // Validate complete form
  const validateCompleteFormData = useCallback((formData: FormData, hasFiles: boolean, hasLines: boolean): FormValidationResult => {
    const result = validateCompleteForm(formData, hasFiles, hasLines)
    
    setValidationState(prev => ({
      ...prev,
      errors: result.errors,
      isValid: result.isValid
    }))
    
    return result
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      errors: {},
      isValid: false
    }))
  }, [])

  // Clear specific field error
  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: ''
      }
    }))
  }, [])

  // Check if a specific field has an error
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!validationState.errors[fieldName]
  }, [validationState.errors])

  // Get error message for a specific field
  const getFieldErrorMessage = useCallback((fieldName: string): string => {
    return validationState.errors[fieldName] || ''
  }, [validationState.errors])

  // Check if a field has been touched
  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return !!validationState.touched[fieldName]
  }, [validationState.touched])

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    return validationState.isValid
  }, [validationState.isValid])

  // Update file upload state
  const updateFileUploadState = useCallback((hasFiles: boolean) => {
    setHasUploadedFiles(hasFiles)
  }, [])

  // Update from/subject lines state
  const updateFromSubjectLinesState = useCallback((hasLines: boolean) => {
    setHasFromSubjectLines(hasLines)
  }, [])

  // Validate all fields and update validation state
  const validateAllFields = useCallback((formData: FormData, hasFiles: boolean, hasLines: boolean) => {
    const result = validateCompleteFormData(formData, hasFiles, hasLines)
    return result
  }, [validateCompleteFormData])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setValidationState({
      errors: {},
      touched: {},
      isValid: false
    })
    setHasUploadedFiles(false)
    setHasFromSubjectLines(false)
  }, [])

  return {
    validationState,
    updateFormData,
    markFieldAsTouched,
    handleFieldBlur,
    handleFieldChange,
    validateField,
    validatePersonalDetailsStep,
    validateContactDetailsStep,
    validateCreativeDetailsStep,
    validateCompleteFormData,
    validateAllFields,
    clearErrors,
    clearFieldError,
    hasFieldError,
    getFieldErrorMessage,
    isFieldTouched,
    isFormValid,
    updateFileUploadState,
    updateFromSubjectLinesState,
    resetForm
  }
}
