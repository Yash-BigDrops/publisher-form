"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { 
  Mail, 
  ArrowRight, 
  File, 
  FileArchive, 
  PencilLine, 
  Eye, 
  MessageSquare, 
  ArrowUpCircle,
  UserCheck,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { Constants } from '@/app/Constants/Constants'
import { useSearchParams } from 'next/navigation'

// Status tracking component
const StatusTracker = () => {
  const statuses = [
    {
      id: 1,
      title: "Submitted",
      description: "Case opened",
      icon: ArrowUpCircle,
      status: "active",
      color: "blue"
    },
    {
      id: 2,
      title: "Under Review",
      description: "Client reviewing",
      icon: Eye,
      status: "pending",
      color: "gray"
    },
    {
      id: 3,
      title: "Decision Made",
      description: "Client decided",
      icon: MessageSquare,
      status: "pending",
      color: "gray"
    },
    {
      id: 4,
      title: "Final Verdict",
      description: "Decision final",
      icon: UserCheck,
      status: "pending",
      color: "gray"
    },
    {
      id: 5,
      title: "Completed",
      description: "Case closed",
      icon: FileCheck,
      status: "pending",
      color: "gray"
    }
  ]

  return (
    <div className="w-full">
      {/* Desktop Horizontal Layout */}
      <div className="hidden lg:block">
        <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          {/* Progress line */}
          <div className="absolute top-12 left-6 right-6 h-1 bg-gray-200 rounded-full">
            <div className="h-full w-1/5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 shadow-sm"></div>
          </div>
          
          <div className="flex justify-between relative z-10">
            {statuses.map((status) => {
              const IconComponent = status.icon
              const isActive = status.status === "active"
              
              return (
                <div key={status.id} className="flex flex-col items-center relative w-full">
                  {/* Icon */}
                  <div className="relative mb-3 w-12 h-12 flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 border-3 border-white shadow-lg ${
                      isActive 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    {/* Pulse effect for active status - background only */}
                    {isActive && (
                      <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500 animate-ping opacity-20 -z-10"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center max-w-24">
                    <h4 className={`text-xs font-bold mb-1 ${
                      isActive ? 'text-blue-900' : 'text-gray-600'
                    }`}>
                      {status.title}
                    </h4>
                    <p className={`text-xs leading-tight ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {status.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Vertical Layout */}
      <div className="lg:hidden space-y-4">
        {statuses.map((status) => {
          const IconComponent = status.icon
          const isActive = status.status === "active"
          
          return (
            <div key={status.id} className="relative">
              <div className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 shadow-sm ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 border-2 border-white shadow-lg ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  {/* Pulse effect for active status - background only */}
                  {isActive && (
                    <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500 animate-ping opacity-20 -z-10"></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-semibold mb-1 ${
                    isActive ? 'text-blue-900' : 'text-gray-700'
                  }`}>
                    {status.title}
                  </h4>
                  <p className={`text-sm ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {status.description}
                  </p>
                </div>
                
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {isActive ? (
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-sm"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
    <div className="min-h-screen py-4 md:py-8 px-4" 
      style={{
        backgroundImage: `url(${Constants.background})`,
        backgroundColor: "var(--color-primary-50)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-4 md:mb-8">
          <Image
            src={Constants.logo}
            alt="logo"
            width={100}
            height={100}
            className="w-40 md:w-60 h-10 md:h-20"
          />
        </div>

        {/* Single Large Card */}
        <Card className="w-full shadow-2xl border-0 bg-white/98 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6 pt-6 md:pt-8">
            {/* Success Icon with enhanced styling */}
            <div className="mx-auto mb-4 md:mb-6">
              <div className={`w-14 h-14 md:w-16 md:h-16 ${submissionInfo.iconBg} rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-white`}>
                <IconComponent className={`w-7 h-7 md:w-8 md:h-8 ${submissionInfo.iconColor}`} />
              </div>
            </div>
            
            <CardTitle className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
              {submissionInfo.title}
            </CardTitle>
            
            <CardDescription className="text-sm md:text-base text-gray-600 leading-relaxed mb-4 md:mb-6 max-w-2xl mx-auto">
              {submissionInfo.description}
            </CardDescription>

            {/* Enhanced confirmation message */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 max-w-3xl mx-auto shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <p className="text-xs md:text-sm text-blue-800 font-medium">
                  A confirmation email with your submission ID and tracking number will be sent to your email.
                </p>
              </div>
            </div>
          </CardHeader>

          <Separator className="mx-auto mb-6 md:mb-8 w-4/5 max-w-2xl bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          <CardContent className="px-4 md:px-6 pb-6 md:pb-8">
            {/* Status Tracker Section */}
            <div className="mb-8 md:mb-10">
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Track Your Submission</h3>
                <p className="text-xs md:text-sm text-gray-600 max-w-xl mx-auto">
                  Monitor the progress of your creative submission through our review process
                </p>
              </div>
              <StatusTracker />
            </div>

            {/* Important Notes and Actions */}
            <div className="space-y-6">
              {/* Enhanced Important Notes */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <File className="w-3 h-3 text-blue-600" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Important Information</h3>
                </div>
                <ul className="text-xs md:text-sm text-gray-700 space-y-2 md:space-y-3">
                  <li className="flex items-start group">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <span>Please check your spam/junk folder if you don&apos;t receive the email</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <span>Keep your submission ID safe for future reference</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <span>You can submit additional creatives at any time</span>
                  </li>
                  <li className="flex items-start group">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <span className="text-white text-xs font-bold">4</span>
                    </div>
                    <span>For urgent inquiries, contact our support team</span>
                  </li>
                  {submissionType === 'multiple' && (
                    <li className="flex items-start group">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                        <span className="text-white text-xs font-bold">5</span>
                      </div>
                      <span>Review progress will be tracked separately for each creative file</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  onClick={handleBackToHome}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 md:py-4 text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Submit Another Creative
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('mailto:support@example.com', '_blank')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 py-3 md:py-4 text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
