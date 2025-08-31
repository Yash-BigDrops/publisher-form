"use client"

import React, { useState } from 'react'
import { Constants } from '@/app/Constants/Constants'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import PersonalDetails from '@/app/Form/Steps/PersonalDetails'
import ContactDetails from '@/app/Form/Steps/ContactDetails'
import CreativeDetails from '@/app/Form/Steps/CreativeDetails'

type FileMeta = { 
  id: string; 
  name: string; 
  url: string; 
  size: number; 
  type: string; 
  source?: 'single'|'zip'; 
  html?: boolean 
};

const CreativeForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  
  const [files, setFiles] = useState<FileMeta[]>([])
  
  const [formData, setFormData] = useState({
    affiliateId: '',
    companyName: '',
    firstName: '',
    lastName: '',
    
    // Contact Details
    email: '',
    telegramId: '',
    
    // Creative Details
    offerId: '',
    creativeType: '',
    additionalNotes: '',
    fromLines: '',
    subjectLines: '',
    priority: 'Medium',
    
    // Files (will be populated by upload handlers)
    uploadedFiles: [] as Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
    }>
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = () => {
    if (currentStep < Constants.totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handleFormDataChange = (stepData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }
  
  const handleSubmit = async () => {
    if (currentStep !== Constants.totalSteps) return
    
    setIsSubmitting(true)
    try {
      // TODO: Backend Developer - Implement complete submission workflow
      //
      // 1. API Endpoint: POST /api/creative/save
      //    - Validate all form data and file uploads
      //    - Store creative submission in database
      //    - Generate unique submission ID and tracking number
      //    - Handle file metadata and storage references
      //
      // 2. Database Schema Required:
      //    - Creative submissions table with status tracking
      //    - File metadata table linked to submissions
      //    - User/affiliate information storage
      //    - Submission history and audit trail
      //
      // 3. Email Functionality Required:
      //    - Send confirmation email with submission details
      //    - Include tracking URL and submission ID
      //    - Email template with professional branding
      //    - Support for multiple email providers (SendGrid, AWS SES, etc.)
      //
      // 4. Redirection Logic Required:
      //    - Redirect to /thankyou page with submission type and count
      //    - Pass URL parameters: ?type=single|multiple&count=X
      //    - Store submission data in localStorage as fallback
      //    - Handle both success and error scenarios
      //
      // 5. Submission Data Structure:
      //    {
      //      submissionId: string,        // Unique identifier
      //      trackingNumber: string,      // Human-readable tracking code
      //      submissionType: 'single' | 'multiple' | 'fromSubjectLines',
      //      fileCount: number,           // Number of files submitted
      //      status: 'pending' | 'reviewing' | 'approved' | 'rejected',
      //      createdAt: Date,
      //      estimatedReviewTime: string, // e.g., "24-48 hours"
      //      redirectUrl: string          // URL to redirect after submission
      //    }
      //
      // 6. Error Handling Required:
      //    - Validation errors (form data, file types, sizes)
      //    - Database connection issues
      //    - Email service failures
      //    - File storage problems
      //    - Rate limiting and spam prevention
      //
      // 7. Security Considerations:
      //    - Input sanitization and validation
      //    - File type and size restrictions
      //    - Rate limiting per user/IP
      //    - CSRF protection
      //    - Data encryption for sensitive information
      //
      // 8. Performance Optimizations:
      //    - Async file processing for large uploads
      //    - Database connection pooling
      //    - Email queuing for high-volume submissions
      //    - Caching for frequently accessed data
      //
      // 9. Monitoring and Logging:
      //    - Track submission success/failure rates
      //    - Monitor email delivery status
      //    - Log user actions for audit purposes
      //    - Performance metrics collection
      //
      // Current implementation - Replace with backend logic:
      const response = await fetch('/api/creative/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: formData.affiliateId,
          companyName: formData.companyName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          telegramId: formData.telegramId,
          offerId: formData.offerId,
          creativeType: formData.creativeType,
          fromLines: formData.fromLines,
          subjectLines: formData.subjectLines,
          notes: formData.additionalNotes,
          priority: formData.priority,
          files: files.map(f => ({
            fileName: f.name,
            fileUrl: f.url,
            fileType: f.type,
            fileSize: f.size
          }))
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Creative saved successfully:', result)
        
        // TODO: Backend Developer - Implement redirection logic here
        // 1. Determine submission type (single/multiple/fromSubjectLines)
        // 2. Count uploaded files
        // 3. Store submission data in localStorage as fallback
        // 4. Redirect to /thankyou with appropriate parameters
        
        // Example redirection logic:
        // const submissionType = files.length > 1 ? 'multiple' : 'single'
        // const fileCount = files.length
        // localStorage.setItem('creativeSubmissionType', submissionType)
        // localStorage.setItem('creativeFileCount', fileCount.toString())
        // window.location.href = `/thankyou?type=${submissionType}&count=${fileCount}`
        
      } else {
        throw new Error('Failed to save creative')
      }
    } catch (error) {
      console.error('Submission failed:', error)
      
      // TODO: Backend Developer - Implement error handling
      // 1. Show user-friendly error messages
      // 2. Log errors for debugging
      // 3. Provide retry options
      // 4. Fallback error handling
      
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalDetails 
            formData={formData}
            onDataChange={handleFormDataChange}
          />
        )
      case 2:
        return (
          <ContactDetails 
            formData={formData}
            onDataChange={handleFormDataChange}
          />
        )
              case 3:
          return (
            <CreativeDetails 
              formData={formData}
              onDataChange={handleFormDataChange}
              onFilesChange={setFiles}
            />
          )
      default:
        return <div>Step not found</div>
    }
  }

  const getStepLabel = () => {
    return Constants.currentStep.find(step => step.stepNumber === currentStep)?.stepLabel || ''
  }

  const getButtonText = () => {
    if (currentStep === 1) {
      return { prev: 'Back', next: Constants.buttonTexts.nextStep2 }
    } else if (currentStep === 2) {
      return { prev: Constants.buttonTexts.prevStep1, next: Constants.buttonTexts.nextStep3 }
    } else {
      return { prev: Constants.buttonTexts.prevStep2, next: Constants.buttonTexts.submit }
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4" 
    style={{
        backgroundImage: `url(${Constants.background})`,
        backgroundColor: "var(--color-primary-50)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
    }}
    >
        <div className="flex flex-col items-center justify-center mb-8">
            <Image src={Constants.logo} alt='logo' width={100} height={100} className="w-40 md:w-60 h-10 md:h-20"/>
        </div>

        <Card className="w-full max-w-3xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl sm:text-4xl font-bold text-heading">{Constants.formTitle}</CardTitle>
                <CardDescription className="text-base sm:text-lg text-body leading-relaxed py-4">{Constants.formDescription}</CardDescription>
                <div>
                    <p className="text-base sm:text-lg font-semibold text-primary-500">Step {currentStep} of {Constants.totalSteps} : {getStepLabel()}</p>
                </div>
                <Separator className="mt-4" />
            </CardHeader>
            <CardContent>
                {getStepContent()}
            </CardContent>
            <CardFooter>
                            <div className="flex flex-col justify-between gap-4 w-full">
                {currentStep > 1 && (
                    <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handlePrev}
                    >
                        {getButtonText().prev}
                    </Button>
                )}
                <Button 
                    className="w-full" 
                    onClick={currentStep === Constants.totalSteps ? handleSubmit : handleNext}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : getButtonText().next}
                </Button>
            </div>
            </CardFooter>
        </Card>
    </div>
  )
}

export default CreativeForm
