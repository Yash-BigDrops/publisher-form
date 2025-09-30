"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { 
  Mail, 
  ArrowRight, 
  File, 
  FileArchive, 
  Eye, 
  MessageSquare, 
  ArrowUpCircle,
  UserCheck,
  FileCheck,
  Download,
  Calendar,
  Clock,
  HardDrive,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useParams } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import { formatFileSize, getFileType } from '@/constants'

// Status tracking component with intelligent accordion system
const StatusTracker = ({ submissionData }: { submissionData: SubmissionData }) => {
  const [expandedCards, setExpandedCards] = useState<number[]>([])

  const toggleCard = (cardId: number) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }

  // Intelligent status system based on submission data
  const getStatuses = () => {
    const baseStatuses = [
      {
        id: 1,
        title: "Submitted",
        description: "Your creative has been submitted successfully",
        icon: ArrowUpCircle,
        status: "completed",
        color: "green",
        timestamp: submissionData.submittedAt,
        canResubmit: false,
        requiresAction: false
      },
      {
        id: 2,
        title: "Under Review",
        description: "Our team is reviewing your creative",
        icon: Eye,
        status: submissionData.status === 'under_review' ? 'active' : 
                submissionData.status === 'submitted' ? 'pending' : 'completed',
        color: submissionData.status === 'under_review' ? 'blue' : 
               submissionData.status === 'submitted' ? 'gray' : 'green',
        timestamp: submissionData.status === 'under_review' ? new Date().toISOString() : null,
        canResubmit: false,
        requiresAction: false
      },
      {
        id: 3,
        title: "Feedback Required",
        description: "Creative needs revision based on feedback",
        icon: MessageSquare,
        status: submissionData.status === 'feedback_required' ? 'active' : 
                submissionData.status === 'revision_needed' ? 'active' : 'pending',
        color: submissionData.status === 'feedback_required' || submissionData.status === 'revision_needed' ? 'amber' : 'gray',
        timestamp: submissionData.status === 'feedback_required' || submissionData.status === 'revision_needed' ? new Date().toISOString() : null,
        canResubmit: true,
        requiresAction: submissionData.status === 'feedback_required' || submissionData.status === 'revision_needed',
        feedback: submissionData.status === 'feedback_required' || submissionData.status === 'revision_needed' ? 
          "Please review the feedback and upload revised creatives. Focus on improving clarity and brand alignment." : null
      },
      {
        id: 4,
        title: "Approved",
        description: "Creative has been approved by our team",
        icon: UserCheck,
        status: submissionData.status === 'approved' ? 'active' : 
                submissionData.status === 'completed' ? 'completed' : 'pending',
        color: submissionData.status === 'approved' ? 'green' : 
               submissionData.status === 'completed' ? 'green' : 'gray',
        timestamp: submissionData.status === 'approved' ? new Date().toISOString() : null,
        canResubmit: false,
        requiresAction: false
      },
      {
        id: 5,
        title: "Completed",
        description: "Creative is ready for deployment",
        icon: FileCheck,
        status: submissionData.status === 'completed' ? 'active' : 'pending',
        color: submissionData.status === 'completed' ? 'green' : 'gray',
        timestamp: submissionData.status === 'completed' ? new Date().toISOString() : null,
        canResubmit: false,
        requiresAction: false
      }
    ]

    return baseStatuses
  }

  const statuses = getStatuses()

  return (
    <div className="space-y-4">
      {statuses.map((status, index) => {
        const IconComponent = status.icon
        const isActive = status.status === "active"
        const isCompleted = status.status === "completed"
        const isExpanded = expandedCards.includes(status.id)
        
        return (
          <div key={status.id} className="relative">
            {/* Connection line */}
            {index < statuses.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200 z-0"></div>
            )}
            
            <div className={`transition-all duration-300 shadow-sm rounded-xl overflow-hidden ${
              isActive 
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200' 
                : isCompleted
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              {/* Main Card Header */}
              <div 
                className={`flex items-center space-x-4 p-4 cursor-pointer hover:bg-opacity-80 transition-all duration-200 ${
                  status.requiresAction ? 'bg-amber-50 border-amber-200' : ''
                }`}
                onClick={() => toggleCard(status.id)}
              >
                {/* Icon */}
                <div className="relative flex-shrink-0 z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 border-2 border-white shadow-lg ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                      : isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  {/* Pulse effect for active status */}
                  {isActive && (
                    <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500 animate-ping opacity-20 -z-10"></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-base font-semibold mb-1 ${
                        isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        {status.title}
                        {status.requiresAction && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Action Required
                          </span>
                        )}
                      </h4>
                      <p className={`text-sm ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {status.description}
                      </p>
                      {status.timestamp && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(status.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    {/* Expand/Collapse Icon */}
                    <div className="flex items-center space-x-2">
                      {status.requiresAction && (
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-sm"></div>
                      )}
                      {!status.requiresAction && (
                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                          isActive ? 'bg-blue-500 animate-pulse' : 
                          isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                  <div className="pt-4 space-y-4">
                    {/* Feedback Section */}
                    {status.feedback && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-amber-800 mb-2">Feedback:</h5>
                        <p className="text-sm text-amber-700">{status.feedback}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {status.canResubmit && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-blue-800 mb-2">Next Steps:</h5>
                          <p className="text-sm text-blue-700 mb-3">
                            Upload your revised creative files and resubmit for review.
                          </p>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => window.location.href = '/'}
                            >
                              <File className="w-4 h-4 mr-2" />
                              Upload Revised Creative
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => window.open('mailto:support@example.com', '_blank')}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Contact Support
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Details */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Status:</strong> {status.status}</p>
                      {status.timestamp && (
                        <p><strong>Last Updated:</strong> {new Date(status.timestamp).toLocaleString()}</p>
                      )}
                      <p><strong>Action Required:</strong> {status.requiresAction ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Creative interface
interface Creative {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  previewUrl?: string;
}

// Submission details component
const SubmissionDetails = ({ creatives }: { creatives: Creative[] }) => {
  if (!creatives || creatives.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
        <File className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No submission details available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Submission Details</h3>
      <div className="grid gap-4">
        {creatives.map((creative, index) => {
          const fileType = getFileType(creative.name)
          const isImage = fileType === "image"
          const isHtml = fileType === "html"
          
          return (
            <div key={creative.id || index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {isImage ? (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                  ) : isHtml ? (
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
                
                {/* File Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {creative.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(creative.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <File className="w-3 h-3" />
                      <span className="capitalize">{creative.type?.split('/')[1] || fileType}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Submitted</span>
                    </div>
                  </div>
                </div>
                
                {/* Download Button */}
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(creative.url, '_blank')}
                    className="text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Submission data interface
interface SubmissionData {
  submissionId: string;
  type: 'single' | 'multiple';
  creatives: Creative[];
  submittedAt: string;
  status: string;
}

function TrackingPageContent() {
  const params = useParams()
  const trackingId = params.trackingId as string
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching submission data based on tracking ID
    // In a real app, this would be an API call
    const fetchSubmissionData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data - replace with actual API call
        // You can change the status to test different scenarios:
        // 'submitted', 'under_review', 'feedback_required', 'revision_needed', 'approved', 'completed'
        const mockData: SubmissionData = {
          submissionId: trackingId,
          type: 'single', // or 'multiple'
          creatives: [
            {
              id: '1',
              name: 'creative-design.jpg',
              url: '/api/files/1/creative-design.jpg',
              size: 2048576, // 2MB
              type: 'image/jpeg',
              previewUrl: '/api/files/1/creative-design.jpg'
            }
          ],
          submittedAt: new Date().toISOString(),
          status: 'feedback_required' // Change this to test different statuses
        }
        
        setSubmissionData(mockData)
      } catch (error) {
        console.error('Failed to fetch submission data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (trackingId) {
      fetchSubmissionData()
    }
  }, [trackingId])

  const handleBackToHome = () => {
    window.location.href = '/'
  }

  const getSubmissionMessage = () => {
    if (!submissionData) return null
    
    if (submissionData.type === 'multiple') {
      return {
        title: "Track Your Multiple Creative Submission",
        description: `You are tracking ${submissionData.creatives.length} creative files submitted for review.`,
        icon: FileArchive,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600"
      }
    } else {
      return {
        title: "Track Your Creative Submission",
        description: "You are tracking your creative submission through our review process.",
        icon: File,
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
      }
    }
  }

  if (loading) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar submissionId={trackingId} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading submission details...</p>
          </div>
        </div>
      </div>
    </div>
  )
  }

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar submissionId={trackingId} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="w-full shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h2>
              <p className="text-gray-600 mb-6">The submission ID &quot;{trackingId}&quot; could not be found.</p>
              <Button onClick={handleBackToHome} className="bg-blue-600 hover:bg-blue-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const submissionInfo = getSubmissionMessage()
  const IconComponent = submissionInfo?.icon

  return (
    <div className="min-h-screen bg-white">
      <Navbar submissionId={trackingId} lastUpdated={submissionData.submittedAt} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Submission Details */}
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-4 px-6 pt-6">
                {/* Success Icon */}
                <div className="mx-auto mb-4">
                  <div className={`w-16 h-16 ${submissionInfo?.iconBg} rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white`}>
                    {IconComponent && <IconComponent className={`w-8 h-8 ${submissionInfo?.iconColor}`} />}
                  </div>
                </div>
                
                <CardTitle className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                  Track Your Creative Submission
                </CardTitle>
                
                <CardDescription className="text-base text-gray-600 leading-relaxed mb-4">
                  {submissionInfo?.description}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Submission Details */}
            <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <SubmissionDetails creatives={submissionData.creatives} />
              </CardContent>
            </Card>

            {/* Contact Support Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => window.open('mailto:support@example.com', '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>

          {/* Right Column - Status Tracking */}
          <div>
            <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden h-fit">
              <CardHeader className="text-center pb-4 px-6 pt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Track Your Submission</h3>
                <p className="text-sm text-gray-600">
                  Monitor the progress of your creative submission through our review process
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <StatusTracker submissionData={submissionData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TrackingPageContent />
    </Suspense>
  )
}
