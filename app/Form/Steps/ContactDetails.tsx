import { Constants } from '@/app/Constants/Constants'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorMessage } from '@/components/ui/error-message'
import React, { useState, useCallback, useRef } from 'react'
import { TELEGRAM_BOT_URL } from '@/constants'
import { useFormValidation } from '@/hooks/useFormValidation'

interface ContactDetailsProps {
  formData: {
    email: string;
    telegramId: string;
  };
  onDataChange: (data: Partial<ContactDetailsProps['formData']>) => void;
  validationHook?: ReturnType<typeof useFormValidation>;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({ 
  formData, 
  onDataChange,
  validationHook 
}) => {
  
  const [isTelegramFocused, setIsTelegramFocused] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationAttempted, setVerificationAttempted] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [hasClickedStartBot, setHasClickedStartBot] = useState(false)
  
  // Debounce verification attempts
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastVerifyTimeRef = useRef<number>(0)

const contactFields = Constants.formFields.filter(field =>
  ['email', 'telegramId'].includes(field.name)
)

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  
  // Special handling for Telegram ID field
  if (name === 'telegramId') {
    let processedValue = value
    
    // If user is typing and value doesn't start with @, add it
    if (value && !value.startsWith('@')) {
      processedValue = '@' + value
    }
    
    // If user deletes everything, don't add @
    if (value === '') {
      processedValue = ''
    }
    
    onDataChange({ [name]: processedValue })
    
    // Trigger validation if validation hook is provided
    if (validationHook) {
      validationHook.handleFieldChange(name, processedValue, false) // Telegram is optional
    }
  } else {
    // Normal handling for other fields
    onDataChange({ [name]: value })
    
    // Trigger validation if validation hook is provided
    if (validationHook) {
      validationHook.handleFieldChange(name, value, true) // Email is required
    }
  }
}

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const { name, value } = e.currentTarget
  
  // Handle backspace for Telegram field
  if (name === 'telegramId' && e.key === 'Backspace') {
    // If current value is just "@" and user presses backspace, prevent deletion
    if (value === '@') {
      e.preventDefault()
      return
    }
    
    // If user is trying to delete the "@" symbol, prevent it
    if (value.length === 2 && value.startsWith('@')) {
      e.preventDefault()
      onDataChange({ [name]: '@' })
      return
    }
  }
}

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  const { name } = e.target
  
  // Track focus state for Telegram field
  if (name === 'telegramId') {
    setIsTelegramFocused(true)
    
    // Add @ when focusing on Telegram field if it's empty
    if (!formData.telegramId) {
      onDataChange({ [name]: '@' })
    }
  }
}

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  
  // Track focus state for Telegram field
  if (name === 'telegramId') {
    setIsTelegramFocused(false)
    
    // Remove @ when losing focus if user hasn't entered anything meaningful
    if (value === '@' || value === '') {
      onDataChange({ [name]: '' })
    }
  }
  
  // Mark field as touched if validation hook is provided
  if (validationHook) {
    validationHook.handleFieldBlur(name)
  }
}

const handleVerify = useCallback(async () => {
  if (!formData.telegramId || formData.telegramId === '@') return
  
  // Debounce verification attempts (prevent rapid clicking)
  const now = Date.now()
  const timeSinceLastVerify = now - lastVerifyTimeRef.current
  const minInterval = 2000 // 2 seconds between attempts
  
  if (timeSinceLastVerify < minInterval) {
    setVerificationError(`Please wait ${Math.ceil((minInterval - timeSinceLastVerify) / 1000)} seconds before trying again`)
    return
  }
  
  // Clear any existing timeout
  if (verifyTimeoutRef.current) {
    clearTimeout(verifyTimeoutRef.current)
  }
  
  setIsVerifying(true)
  setVerificationAttempted(true)
  setVerificationError(null)
  lastVerifyTimeRef.current = now
  
  try {
    // First, poll for any pending updates
    const pollResponse = await fetch(API_ENDPOINTS.TELEGRAM_POLL, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!pollResponse.ok) {
      throw new Error('Failed to poll for updates')
    }

    // Then verify the Telegram ID
    const verifyResponse = await fetch(API_ENDPOINTS.TELEGRAM_VERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: formData.telegramId }),
    })
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text()
      throw new Error(`Verification failed: ${verifyResponse.status} ${errorText}`)
    }
    
    const data = await verifyResponse.json()
    
    // Ensure we get the expected response shape
    if (typeof data.verified !== 'boolean') {
      throw new Error('Invalid response format from verification endpoint')
    }
    
    setIsVerified(data.verified)
    
    if (!data.verified) {
      setVerificationError('Telegram ID not found. Make sure you sent /start to the bot first.')
    }
  } catch (err) {
    console.error('Verification failed:', err)
    setIsVerified(false)
    setVerificationError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
  } finally {
    setIsVerifying(false)
  }
}, [formData.telegramId])

const handleStartBot = useCallback(() => {
  setHasClickedStartBot(true)
  setVerificationError(null)
  // Open the bot in a new tab
  window.open(TELEGRAM_BOT_URL, '_blank', 'noopener,noreferrer')
}, [])

const getFieldError = (fieldName: string): string => {
  if (!validationHook) return ''
  return validationHook.getFieldErrorMessage(fieldName)
}

const hasFieldError = (fieldName: string): boolean => {
  if (!validationHook) return false
  return validationHook.hasFieldError(fieldName)
}

const isFieldTouched = (fieldName: string): boolean => {
  if (!validationHook) return false
  return validationHook.isFieldTouched(fieldName)
}

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {contactFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            
            {/* Custom input container for Telegram field with verify button */}
            {field.name === 'telegramId' ? (
              <div className="relative">
                <Input 
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className={`pr-20 ${hasFieldError(field.name) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={hasClickedStartBot ? handleVerify : handleStartBot}
                  disabled={isVerifying || isVerified || !formData.telegramId || formData.telegramId === '@'}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs"
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : isVerified ? (
                    <div className="flex items-center gap-2 text-success-dark">
                      <span>✅</span>
                      <span>Verified</span>
                    </div>
                  ) : hasClickedStartBot ? (
                    'Verify'
                  ) : (
                    'Start Bot'
                  )}
                </Button>
              </div>
            ) : (
              <Input 
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={hasFieldError(field.name) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
            )}
            
            {/* Error Message */}
            <ErrorMessage 
              message={getFieldError(field.name)}
              show={isFieldTouched(field.name) && hasFieldError(field.name)}
            />
            
            {/* Show tip for Telegram field only when focused */}
            {field.name === 'telegramId' && isTelegramFocused && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Enter your Telegram ID exactly as it appears - it&apos;s case sensitive
              </p>
            )}
            
            {/* Show verification error */}
            {field.name === 'telegramId' && verificationError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{verificationError}</p>
              </div>
            )}
            
          </div>
        ))}
      </div>  
    </div>
  )
}

export default ContactDetails