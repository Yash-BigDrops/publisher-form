"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorMessage } from '@/components/ui/error-message'
import { Constants } from '@/app/Constants/Constants'
import { useFormValidation } from '@/hooks/useFormValidation'

interface PersonalDetailsProps {
  formData: {
    affiliateId: string;
    companyName: string;
    firstName: string;
    lastName: string;
  };
  onDataChange: (data: Partial<PersonalDetailsProps['formData']>) => void;
  validationHook?: ReturnType<typeof useFormValidation>;
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ 
  formData, 
  onDataChange,
  validationHook 
}) => {

  // Filter only the personal detail fields from Constants
  const personalFields = Constants.formFields.filter(field => 
    ['affiliateId', 'companyName', 'firstName', 'lastName'].includes(field.name)
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Block numbers for firstName and lastName fields
    if ((name === 'firstName' || name === 'lastName') && /\d/.test(value)) {
      return // Don't update if numbers are detected
    }
    
    // Update form data
    onDataChange({ [name]: value })
    
    // Trigger validation if validation hook is provided
    if (validationHook) {
      validationHook.handleFieldChange(name, value, true)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    
    // Mark field as touched if validation hook is provided
    if (validationHook) {
      validationHook.handleFieldBlur(name)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { name } = e.currentTarget
    
    // Prevent number keys from being pressed for firstName and lastName fields
    if ((name === 'firstName' || name === 'lastName') && 
        (e.key >= '0' && e.key <= '9' || e.key === 'Numpad0' || e.key === 'Numpad1' || 
         e.key === 'Numpad2' || e.key === 'Numpad3' || e.key === 'Numpad4' || 
         e.key === 'Numpad5' || e.key === 'Numpad6' || e.key === 'Numpad7' || 
         e.key === 'Numpad8' || e.key === 'Numpad9')) {
      e.preventDefault()
      return
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
      
      {/* Affiliate ID and Company Name - Single Column */}
      <div className="space-y-4">
        {personalFields.slice(0, 2).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={hasFieldError(field.name) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            <ErrorMessage 
              message={getFieldError(field.name)}
              show={isFieldTouched(field.name) && hasFieldError(field.name)}
            />
          </div>
        ))}
      </div>

      {/* First Name and Last Name - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalFields.slice(2, 4).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              pattern="[a-zA-Z\s'-]+"
              inputMode="text"
              autoComplete={field.name === 'firstName' ? 'given-name' : 'family-name'}
              className={hasFieldError(field.name) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            <ErrorMessage 
              message={getFieldError(field.name)}
              show={isFieldTouched(field.name) && hasFieldError(field.name)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PersonalDetails