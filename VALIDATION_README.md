# Form Validation System

This document describes the comprehensive input validation system implemented for the publisher form.

## Overview

The validation system provides real-time validation, step-by-step validation, and comprehensive error handling for all form fields. It ensures data quality and provides immediate feedback to users.

## Features

### 1. Real-time Validation
- Fields are validated as users type
- Immediate error feedback
- Visual indicators for field states

### 2. Step-by-step Validation
- Each form step is validated before proceeding
- Users cannot advance with invalid data
- Clear error messages for each step

### 3. Comprehensive Field Validation
- **Personal Details**: Affiliate ID, Company Name, First Name, Last Name
- **Contact Details**: Email, Telegram ID (optional)
- **Creative Details**: Offer ID, Creative Type, Priority, File uploads

### 4. Smart Validation Rules
- **Affiliate ID**: 3-20 characters, alphanumeric only
- **Company Name**: 2-100 characters, letters, numbers, spaces, and common punctuation
- **Names**: 2-50 characters, letters, spaces, hyphens, and apostrophes
- **Email**: Standard email format validation
- **Telegram ID**: Optional, must start with @ and be 5-32 characters
- **Required Fields**: Offer ID, Creative Type, Priority
- **Conditional Validation**: Email creatives require either files or from/subject lines

## Components

### 1. Validation Utilities (`utils/validations.ts`)
```typescript
// Individual field validation functions
validateRequired(value: string): boolean
validateEmail(email: string): boolean
validateTelegramId(telegramId: string): boolean
validateAffiliateId(affiliateId: string): boolean
validateCompanyName(companyName: string): boolean
validateName(name: string): boolean
validateOfferId(offerId: string): boolean
validateCreativeType(creativeType: string): boolean
validatePriority(priority: string): boolean

// Step validation functions
validatePersonalDetails(formData): FormValidationResult
validateContactDetails(formData): FormValidationResult
validateCreativeDetails(formData, hasUploadedFiles, hasFromSubjectLines): FormValidationResult

// Complete form validation
validateCompleteForm(formData, hasUploadedFiles, hasFromSubjectLines): FormValidationResult
```

### 2. Validation Hook (`hooks/useFormValidation.ts`)
```typescript
const validationHook = useFormValidation(initialFormData)

// Key methods
validationHook.updateFormData(updates)
validationHook.handleFieldChange(fieldName, value, isRequired)
validationHook.handleFieldBlur(fieldName)
validationHook.validatePersonalDetailsStep()
validationHook.validateContactDetailsStep()
validationHook.validateCreativeDetailsStep()
validationHook.validateCompleteFormData()
validationHook.isFormValid()
validationHook.hasFieldError(fieldName)
validationHook.getFieldErrorMessage(fieldName)
```

### 3. Error Message Component (`components/ui/error-message.tsx`)
- Displays individual field errors
- Shows only when field is touched and has errors
- Consistent styling with error icons

### 4. Validation Summary Component (`components/ui/validation-summary.tsx`)
- Shows all form errors in one place
- Appears above form content when errors exist
- Organized list of all validation issues

## Implementation Details

### Field Validation Flow
1. **User Input**: User types in a field
2. **Real-time Validation**: Field is validated immediately
3. **Error Display**: Error message appears below field if invalid
4. **Visual Feedback**: Field border turns red if invalid
5. **Step Validation**: Step is validated when user tries to proceed
6. **Form Validation**: Complete form is validated on submission

### Input Restrictions
- **First Name & Last Name**: Numbers are completely blocked from input
  - `onKeyDown` prevents number keys from being pressed
  - `onChange` filters out any numbers that might be pasted
  - `pattern` attribute provides HTML5 validation
  - `inputMode="text"` ensures mobile keyboards show letters only
  - Helpful hints inform users about restrictions

### Error States
- **Untouched Fields**: No validation until user interacts
- **Valid Fields**: Green styling, no error messages
- **Invalid Fields**: Red border, error message below
- **Step Blocked**: Next button disabled until step is valid

### File Upload Validation
- **Single Creative**: Supports images, HTML, and ZIP files
- **Multiple Creatives**: ZIP files only
- **Email Creatives**: Require either files or from/subject lines
- **File Type Validation**: Restricted to allowed formats
- **Size Validation**: Configurable file size limits

## Usage Examples

### Basic Field Validation
```typescript
// In a form component
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  
  // Update form data
  onDataChange({ [name]: value })
  
  // Trigger validation
  validationHook.handleFieldChange(name, value, true)
}
```

### Step Validation
```typescript
const handleNext = () => {
  // Validate current step
  const validation = validationHook.validatePersonalDetailsStep()
  
  if (validation.isValid) {
    setCurrentStep(currentStep + 1)
  } else {
    // Mark fields as touched to show errors
    Object.keys(validation.errors).forEach(field => {
      validationHook.markFieldAsTouched(field)
    })
  }
}
```

### Form Submission Validation
```typescript
const handleSubmit = async () => {
  // Validate complete form
  const validation = validationHook.validateCompleteFormData()
  
  if (!validation.isValid) {
    // Show all errors
    Object.keys(validation.errors).forEach(field => {
      validationHook.markFieldAsTouched(field)
    })
    return
  }
  
  // Proceed with submission
  await submitForm()
}
```

## Validation Rules Reference

### Personal Details
| Field | Required | Pattern | Length | Notes |
|-------|----------|---------|---------|-------|
| Affiliate ID | Yes | `[a-zA-Z0-9]` | 3-20 | Alphanumeric only |
| Company Name | Yes | `[a-zA-Z0-9\s&.,'-]` | 2-100 | Letters, numbers, spaces, punctuation |
| First Name | Yes | `[a-zA-Z\s'-]` | 2-50 | Letters, spaces, hyphens, apostrophes |
| Last Name | Yes | `[a-zA-Z\s'-]` | 2-50 | Letters, spaces, hyphens, apostrophes |

### Contact Details
| Field | Required | Pattern | Length | Notes |
|-------|----------|---------|---------|-------|
| Email | Yes | Email format | - | Standard email validation |
| Telegram ID | No | `@[a-zA-Z0-9_]{5,32}` | 6-33 | Must start with @ |

### Creative Details
| Field | Required | Options | Notes |
|-------|----------|---------|-------|
| Offer ID | Yes | From API | Must select valid offer |
| Creative Type | Yes | email, display, search, social, native, push | Must select valid type |
| Priority | Yes | High, Medium | Must select priority level |
| Files | Conditional | Based on type | Required for non-email, or email with no from/subject lines |
| From/Subject Lines | Conditional | Text input | Required for email creatives with no files |

## Error Messages

### Personal Details
- "Affiliate ID is required"
- "Affiliate ID must be 3-20 characters long and contain only letters and numbers"
- "Company name is required"
- "Company name must be 2-100 characters long and contain only letters, numbers, spaces, and common punctuation"
- "First name is required"
- "First name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes"
- "Last name is required"
- "Last name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes"

### Contact Details
- "Email is required"
- "Please enter a valid email address"
- "Please enter a valid Telegram ID (e.g., @username)"

### Creative Details
- "Offer ID is required"
- "Please select a valid offer"
- "Creative type is required"
- "Please select a valid creative type"
- "Priority is required"
- "Please select a valid priority level"
- "For email creatives, you must either upload files or provide from/subject lines"
- "Creative files are required"
- "From lines are required for email creatives"
- "Subject lines are required for email creatives"

## Styling

### Error States
- **Error Border**: `border-red-500`
- **Error Focus**: `focus:border-red-500 focus:ring-red-500`
- **Error Text**: `text-red-600`
- **Error Background**: `bg-red-50`

### Success States
- **Success Text**: `text-green-600`
- **Success Background**: `bg-green-50`

### Validation Status
- **Valid**: Green text with success message
- **Invalid**: Red text with error message
- **Pending**: Gray text with instruction message

## Testing

The validation system can be tested by:

1. **Empty Field Submission**: Try to submit with empty required fields
2. **Invalid Format Input**: Enter invalid data formats (e.g., invalid email)
3. **Step Navigation**: Try to advance steps with invalid data
4. **File Upload Validation**: Test with invalid file types and sizes
5. **Conditional Validation**: Test email creative requirements
6. **Real-time Validation**: Type invalid data and observe immediate feedback

## Future Enhancements

1. **Custom Validation Rules**: Allow custom validation patterns per field
2. **Async Validation**: Server-side validation for unique constraints
3. **Validation Groups**: Group related fields for complex validation logic
4. **Internationalization**: Support for multiple languages in error messages
5. **Accessibility**: Enhanced screen reader support for validation states
6. **Performance**: Debounced validation for better performance
7. **Analytics**: Track validation errors for UX improvements

## Troubleshooting

### Common Issues

1. **Validation Not Triggering**: Ensure validation hook is properly passed to components
2. **Errors Not Showing**: Check if fields are marked as touched
3. **Step Blocked**: Verify all required fields in current step are valid
4. **File Validation Issues**: Check file type and size restrictions

### Debug Mode

Enable debug logging by adding console logs to validation functions:

```typescript
const validateField = (fieldName: string, value: string) => {
  console.log(`Validating ${fieldName}:`, value)
  const result = validationRules[fieldName](value)
  console.log(`Validation result:`, result)
  return result
}
```

## Conclusion

This validation system provides a robust, user-friendly way to ensure data quality in the publisher form. It balances immediate feedback with comprehensive validation, preventing invalid submissions while maintaining a smooth user experience.
