"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Mail, ArrowRight, File, FileArchive, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Constants } from '@/app/Constants/Constants'
import { useSearchParams } from 'next/navigation'

function ThankYouPageContent() {
  const searchParams = useSearchParams()
  const [submissionType, setSubmissionType] = useState<'single' | 'multiple' | null>(null)
  const [fileCount, setFileCount] = useState<number>(0)

  useEffect(() => {
    // Get submission type from URL parameters
    const type = searchParams.get('type') as 'single' | 'multiple' | null
    const count = searchParams.get('count') ? parseInt(searchParams.get('count')!) : 0
    
    // If no URL params, try to get from localStorage (fallback)
    if (!type) {
      const storedType = localStorage.getItem('creativeSubmissionType')
      const storedCount = localStorage.getItem('creativeFileCount')
      setSubmissionType(storedType as 'single' | 'multiple' || 'single')
      setFileCount(storedCount ? parseInt(storedCount) : 1)
    } else {
      setSubmissionType(type)
      setFileCount(count || (type === 'multiple' ? 5 : 1))
    }
  }, [searchParams])

  const handleBackToHome = () => {
    window.location.href = '/'
  }

  const getSubmissionMessage = () => {
    if (submissionType === 'multiple') {
      return {
        title: "Thank You for Your Multiple Creative Submission!",
        description: `Your ${fileCount} creative files have been successfully submitted and are now under review by our team.`,
        icon: FileArchive,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600"
      }
    } else if(submissionType === 'single') {
      return {
        title: "Thank You for Your Creative Submission!",
        description: "Your creative has been successfully submitted and is now under review by our team.",
        icon: File,
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
      }
    } else {
      return {
        title: "Thank You for From & Subject Lines Submission!",
        description: "Your from & subject lines have been successfully submitted and are now under review by our team.",
        icon: PencilLine,
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
      }
    }
  }

  const submissionInfo = getSubmissionMessage()
  const IconComponent = submissionInfo.icon

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4" 
      style={{
        backgroundImage: `url(${Constants.background})`,
        backgroundColor: "var(--color-primary-50)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center justify-center mb-8">
      <Image src={Constants.logo} alt='logo' width={100} height={100} className="w-40 md:w-60 h-10 md:h-20"/>
      </div>

      {/* Success Card */}
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          {/* Success Icon */}
          <div className="mx-auto mb-6">
            <div className={`w-20 h-20 md:w-24 md:h-24 ${submissionInfo.iconBg} rounded-full flex items-center justify-center mx-auto`}>
              <IconComponent className={`w-12 h-12 md:w-16 md:h-16 ${submissionInfo.iconColor}`} />
            </div>
          </div>
          
          <CardTitle className="text-2xl md:text-3xl font-bold text-green-800 mb-3">
            {submissionInfo.title}
          </CardTitle>
          
          <CardDescription className="text-base md:text-lg text-gray-600 leading-relaxed">
            {submissionInfo.description}
          </CardDescription>

          <CardDescription className="text-base md:text-lg text-blue-800 leading-relaxed bg-blue-100 px-4 py-3 rounded-lg border border-blue-200 mt-4">
            A confirmation email with your submission ID and tracking number will be sent to your email.
          </CardDescription>
        </CardHeader>

        <Separator className="mx-auto mb-6 w-4/5 max-w-lg" />

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Important Notes */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Please check your spam/junk folder if you don&apos;t receive the email</li>
              <li>• Keep your submission ID safe for future reference</li>
              <li>• You can submit additional creatives at any time</li>
              <li>• For urgent inquiries, contact our support team</li>
              {submissionType === 'multiple' && (
                <li>• Review progress will be tracked separately for each creative file</li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleBackToHome}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Submit Another Creative
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('mailto:support@example.com', '_blank')}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ThankYouPageContent />
    </Suspense>
  )
}
