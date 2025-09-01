import { Constants } from '@/app/Constants/Constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorMessage } from '@/components/ui/error-message'
import React, { useState } from 'react'
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

const handleVerify = async () => {
  if (!formData.telegramId || formData.telegramId === '@') return
  
  setIsVerifying(true)
  setVerificationAttempted(true)
  
  try {
    await fetch('/api/telegram/poll', { method: 'POST' })

    const res = await fetch('/api/telegram/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: formData.telegramId }),
    })
    
    if (!res.ok) {
      throw new Error('Verification request failed')
    }
    
    const data = await res.json()
    setIsVerified(Boolean(data.verified))
  } catch (err) {
    console.error('Verification failed:', err)
    setIsVerified(false)
  } finally {
    setIsVerifying(false)
  }
}

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
                  onClick={handleVerify}
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
                  ) : (
                    'Verify'
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
            
            {/* Show verification steps box for Telegram field when verification was attempted and failed */}
            {field.name === 'telegramId' && verificationAttempted && !isVerifying && !isVerified && (
              <div className="mt-3 p-3 bg-warning-light border border-warning-medium rounded-md">
                <h4 className="text-sm font-medium text-warning-medium mb-2">📋 Steps to Verify Your Telegram ID:</h4>
                <ol className="text-xs text-warning-medium space-y-1 list-decimal list-inside mb-3">
                  <li>Click on Start Bot Button</li>
                  <li>Send /start to the bot</li>
                  <li>Come back and Verify again</li>
                </ol>
                <Button asChild variant="outline" size="xs"
                  className="text-xs w-max border-warning-medium text-warning-medium hover:bg-warning-medium hover:text-white">
                  <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">Start Bot</a>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>  
    </div>
  )
}

export default ContactDetails