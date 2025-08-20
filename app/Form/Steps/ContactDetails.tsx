import { Constants } from '@/app/Constants/Constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState } from 'react'

const ContactDetails = () => {
  const [formData, setFormData] = useState({
    email: '',
    telegramId: '',
  })
  
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
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
  } else {
    // Normal handling for other fields
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      setFormData(prev => ({
        ...prev,
        [name]: '@'
      }))
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
      setFormData(prev => ({
        ...prev,
        [name]: '@'
      }))
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
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
}

const handleVerify = async () => {
  if (!formData.telegramId || formData.telegramId === '@') return
  
  setIsVerifying(true)
  setVerificationAttempted(true)
  
  try {
    // TODO: BACKEND INTEGRATION - Replace with actual API call
    // const response = await fetch('/api/telegram/verify', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${userToken}` // Add if authentication required
    //   },
    //   body: JSON.stringify({
    //     telegramId: formData.telegramId,
    //     userId: currentUserId, // Add if user context needed
    //     timestamp: new Date().toISOString()
    //   })
    // })
    
    // TODO: BACKEND INTEGRATION - Handle API response
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`)
    // }
    
    // const result = await response.json()
    
    // TODO: BACKEND INTEGRATION - Validate response structure
    // if (result.success && result.data) {
    //   setIsVerified(true)
    //   // Store additional user info if needed
    //   // setUserInfo(result.data.userInfo)
    //   // setVerificationTimestamp(result.data.verifiedAt)
    // } else {
    //   throw new Error(result.message || 'Verification failed')
    // }
    
    // TEMPORARY: Simulate verification for frontend testing
    await new Promise(resolve => setTimeout(resolve, 2000))
    throw new Error('Telegram ID not found or invalid')
    
  } catch (error) {
    console.error('Verification failed:', error)
    setIsVerified(false)
    
    // TODO: BACKEND INTEGRATION - Handle specific error types
    // if (error.message.includes('not found')) {
    //   // Show specific error message for invalid ID
    // } else if (error.message.includes('rate limit')) {
    //   // Show rate limit warning
    // } else {
    //   // Show generic error message
    // }
    
  } finally {
    setIsVerifying(false)
  }
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
                  className="pr-20" // Add right padding for the button
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
              />
            )}
            
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
                <Button
                  variant="outline"
                  size="xs"
                  type="button"
                  // TODO: BACKEND INTEGRATION - Replace with actual bot link
                  // onClick={() => window.open(Constants.telegramBotUrl, '_blank')}
                  className="text-xs w-max border-warning-medium text-warning-medium hover:bg-warning-medium hover:text-white"
                >
                  Start Bot
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