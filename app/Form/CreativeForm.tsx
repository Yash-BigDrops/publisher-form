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
    priority: 'medium',
    
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
      } else {
        throw new Error('Failed to save creative')
      }
    } catch (error) {
      console.error('Submission failed:', error)
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
