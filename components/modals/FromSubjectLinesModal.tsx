"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { X, Sparkles, Info, PencilLine } from 'lucide-react'
import { Constants } from '@/app/Constants/Constants'
import { generateEmailContent, analyzeCreatives } from '@/lib/generationClient'

interface FromSubjectLinesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (fromLines: string, subjectLines: string) => void
  initialFromLines?: string
  initialSubjectLines?: string
  isMultipleCreative?: boolean // Add prop to indicate if this is multiple creative upload
  uploadedFiles?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    html?: boolean;
    embeddedHtml?: string;
    uploadId?: string;
  }>; // Add prop for uploaded files
  creativeType?: string; // Add prop for creative type
  offerId?: string; // Add prop for offer ID
}

const FromSubjectLinesModal: React.FC<FromSubjectLinesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFromLines = '',
  initialSubjectLines = '',
  isMultipleCreative = false,
  uploadedFiles = [],
  creativeType = 'email',
  offerId = ''
}) => {
  const [fromLines, setFromLines] = useState("")
  const [subjectLines, setSubjectLines] = useState("")
  const [errors, setErrors] = useState<{ fromLines?: string; subjectLines?: string }>({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Update state when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      // Always start with empty content to avoid showing placeholder text as actual content
      setFromLines("")
      setSubjectLines("")
      setErrors({})
    }
  }, [isOpen, initialFromLines, initialSubjectLines])

  const handleSave = () => {
    // Reset errors
    setErrors({})
    
    // Validate inputs
    const newErrors: { fromLines?: string; subjectLines?: string } = {}
    
    if (!fromLines.trim()) {
      newErrors.fromLines = 'From lines are required'
    }
    
    if (!subjectLines.trim()) {
      newErrors.subjectLines = 'Subject lines are required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Save and close
    onSave(fromLines.trim(), subjectLines.trim())
    handleClose()
  }

  const handleClose = () => {
    setFromLines('')
    setSubjectLines('')
    setErrors({})
    onClose()
  }

  const handleGenerateContent = async () => {
    try {
      setIsGenerating(true)
      console.log("Analyzing creatives and generating email content...")

      let creativeAnalysis: {
        extractedText: string;
        imageDescriptions: string[];
        htmlContent: string;
        fileCount: number;
        creativeTypes: string[];
        contentType: string;
      } | undefined = undefined

      // First, analyze the uploaded creatives if available
      if (uploadedFiles && uploadedFiles.length > 0) {
        try {
          console.log(`Analyzing ${uploadedFiles.length} creative files...`)
          const analysisResult = await analyzeCreatives({
            files: uploadedFiles,
            creativeType,
            offerId
          })

          if (analysisResult.success && analysisResult.analysis) {
            creativeAnalysis = analysisResult.analysis
            console.log(`Creative analysis complete: ${analysisResult.analysis.fileCount} files analyzed`)
          } else {
            console.warn("Creative analysis failed:", analysisResult.error)
          }
        } catch (analysisError) {
          console.error("Error analyzing creatives:", analysisError)
          // Continue with generation even if analysis fails
        }
      }

      // Generate email content with or without creative analysis
      let sampleText = "";
      if (creativeAnalysis && creativeAnalysis.extractedText) {
        sampleText = creativeAnalysis.extractedText.substring(0, 1000);
      } else if (uploadedFiles && uploadedFiles.length > 0) {
        // Fallback: try to get content from uploaded files
        const htmlFiles = uploadedFiles.filter(file => file.type === 'html' || file.html);
        if (htmlFiles.length > 0) {
          // Use the first HTML file's content
          const firstHtmlFile = htmlFiles[0];
          if (firstHtmlFile.embeddedHtml) {
            sampleText = firstHtmlFile.embeddedHtml
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 1000);
          }
        }
      }

      const { fromLines: newFromLines, subjectLines: newSubjectLines } =
        await generateEmailContent({
          creativeType: creativeType === 'email' ? "Email" : creativeType,
          sampleText,
          maxFrom: 4,
          maxSubject: 8,
          creativeAnalysis: creativeAnalysis
        })

      const mergeContent = (existing: string, newItems: string[]) => {
        // If existing is empty, use only new items
        if (!existing || existing.trim() === "") {
          return newItems.map((s) => s.trim()).filter(Boolean).join("\n")
        }
        
        // Check if existing content is just placeholder text (generic content)
        const placeholderPatterns = [
          "Email Preferences Team",
          "Subscription Services", 
          "Account Management",
          "Communications Team",
          "Update your email preferences",
          "Manage your subscription settings",
          "Quick confirmation needed: Email preferences",
          "Review your communication preferences",
          "One-click subscription management"
        ]
        
        const isPlaceholderContent = placeholderPatterns.some(pattern => 
          existing.includes(pattern)
        )
        
        // If it's placeholder content, replace it completely with new content
        if (isPlaceholderContent) {
          return newItems.map((s) => s.trim()).filter(Boolean).join("\n")
        }
        
        // Otherwise, merge existing and new content
        const existingLines = existing
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
        const newLines = newItems.map((s) => s.trim()).filter(Boolean)
        const allLines = [...existingLines, ...newLines]
        const uniqueLines = Array.from(new Set(allLines))
        return uniqueLines.join("\n")
      }

      const mergedFromLines = mergeContent(fromLines, newFromLines)
      const mergedSubjectLines = mergeContent(subjectLines, newSubjectLines)
      
      console.log("Sample Text for AI:", sampleText)
      console.log("Current fromLines state:", fromLines)
      console.log("Current subjectLines state:", subjectLines)
      console.log("Generated From Lines:", newFromLines)
      console.log("Generated Subject Lines:", newSubjectLines)
      console.log("Merged From Lines:", mergedFromLines)
      console.log("Merged Subject Lines:", mergedSubjectLines)
      
      setFromLines(mergedFromLines)
      setSubjectLines(mergedSubjectLines)

      console.log("Email content generated successfully")
    } catch (error) {
      console.error("Failed to generate email content:", error)
      // You could add a toast notification here
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-color-border">
          <div className="flex items-center gap-3">
            <PencilLine className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">{Constants.fromSubjectLinesConfig.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">{Constants.fromSubjectLinesConfig.guidelines.title}</p>
                <ul className="mt-2 space-y-1 text-xs">
                  {Constants.fromSubjectLinesConfig.guidelines.items.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* From Lines */}
          <div className="space-y-3">
            <Label htmlFor="fromLines" className="text-base font-medium">
              {Constants.fromSubjectLinesConfig.fromLines.label}
            </Label>
            <Textarea
              id="fromLines"
              placeholder={Constants.fromSubjectLinesConfig.fromLines.placeholder}
              value={fromLines}
              onChange={(e) => setFromLines(e.target.value)}
              rows={4}
              className={`w-full resize-none ${errors.fromLines ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
            />
            {errors.fromLines && (
              <p className="text-sm text-red-600">{errors.fromLines}</p>
            )}
            <p className="text-xs text-gray-500">
              {Constants.fromSubjectLinesConfig.fromLines.helpText}
            </p>
          </div>

          {/* Subject Lines */}
          <div className="space-y-3">
            <Label htmlFor="subjectLines" className="text-base font-medium">
              {Constants.fromSubjectLinesConfig.subjectLines.label}
            </Label>
            <Textarea
              id="subjectLines"
              placeholder={Constants.fromSubjectLinesConfig.subjectLines.placeholder}
              value={subjectLines}
              onChange={(e) => setSubjectLines(e.target.value)}
              rows={4}
              className={`w-full resize-none ${errors.subjectLines ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50' : ''}`}
            />
            {errors.subjectLines && (
              <p className="text-sm text-red-600">{errors.subjectLines}</p>
            )}
            <p className="text-xs text-gray-500">
              {Constants.fromSubjectLinesConfig.subjectLines.helpText}
            </p>
          </div>

          {/* Character Count */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Constants.fromSubjectLinesConfig.characterCount.fromLines.replace('{count}', fromLines.length.toString())}</span>
            <span>{Constants.fromSubjectLinesConfig.characterCount.subjectLines.replace('{count}', subjectLines.length.toString())}</span>
          </div>

          {/* Generate From and Subject Lines Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleGenerateContent}
              disabled={isGenerating}
              className="w-full border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating 
                ? (uploadedFiles && uploadedFiles.length > 0 ? "Analyzing Creatives..." : "Generating...") 
                : "Generate AI From & Subject Lines"
              }
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-color-border">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            {Constants.fromSubjectLinesConfig.buttons.cancel}
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={!fromLines.trim() || !subjectLines.trim()}
          >
            {Constants.fromSubjectLinesConfig.buttons.save}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FromSubjectLinesModal
