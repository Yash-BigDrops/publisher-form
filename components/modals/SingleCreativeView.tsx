"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Edit3, Eye, FileText, Image, File, Sparkles, Maximize2, Minimize2 } from 'lucide-react'
import { formatFileSize, getFileType } from '@/constants'
import { Constants } from '@/app/Constants/Constants'

interface SingleCreativeViewProps {
  isOpen: boolean
  onClose: () => void
  creative: {
    id: string
    name: string
    url: string
    size: number
    type: string
    previewUrl?: string
    html?: boolean
  }
  onFileNameChange?: (fileId: string, newFileName: string) => void
}

const SingleCreativeView: React.FC<SingleCreativeViewProps> = ({
  isOpen,
  onClose,
  creative,
  onFileNameChange
}) => {
  const [editableFileName, setEditableFileName] = useState(creative.name)
  const [isEditing, setIsEditing] = useState(false)
  const [fromLines, setFromLines] = useState('')
  const [subjectLines, setSubjectLines] = useState('')
  const [isHtmlEditorFullscreen, setIsHtmlEditorFullscreen] = useState(false)
  const [isImagePreviewFullscreen, setIsImagePreviewFullscreen] = useState(false)
  
  // Proofreading data state
  const [proofreadingData, setProofreadingData] = useState<{
    issues: Array<{
      icon: string
      type: string
      original: string
      correction: string
    }>
    suggestions: Array<{
      icon: string
      type: string
      description: string
    }>
  }>({
    issues: [],
    suggestions: []
  })

  // HTML content state for editing
  const [htmlContent, setHtmlContent] = useState('')

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Restore scroll position and body styles
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
  }, [isOpen])

  // Load HTML content when modal opens for HTML creatives
  React.useEffect(() => {
    if (isOpen && creative.type && (creative.type.includes('html') || creative.name.toLowerCase().includes('.html'))) {
      console.log('Loading HTML content for HTML creative...')
      fetchHtmlContent()
    }
  }, [isOpen, creative.type, creative.name])

  // TODO: BACKEND INTEGRATION - HTML Content Loading & Image Hosting
  // 
  // CRITICAL BACKEND DEVELOPER NOTES:
  // 
  // PROBLEM: HTML files are not rendering properly because:
  // 1. Content is not being fetched correctly from file storage
  // 2. Relative image paths in HTML files are broken
  // 3. CSS/JS assets may have incorrect paths
  // 4. Content-Type headers may not be set properly
  // 
  // SOLUTION IMPLEMENTATION GUIDE:
  // 
  // 1. FILE CONTENT RETRIEVAL:
  //    - API Endpoint: Enhance /api/get-file-content
  //    - Use proper file storage system (getFilePath from @/lib/fileStorage)
  //    - Return actual HTML content with correct encoding (UTF-8)
  //    - Set proper Content-Type headers: 'text/html; charset=utf-8'
  //    - Handle file not found cases gracefully
  // 
  // 2. HTML CONTENT PROCESSING:
  //    - Parse HTML content to identify all asset references
  //    - Find: <img src="...">, <link href="...">, <script src="...">
  //    - Convert relative paths to absolute paths
  //    - Rewrite asset URLs to point to your CDN/storage system
  //    - Handle base64 encoded images (keep as-is)
  // 
  // 3. IMAGE HOSTING SOLUTION:
  //    - When ZIP files are uploaded, extract all assets (images, CSS, JS)
  //    - Store assets in your file storage system with proper paths
  //    - Create asset mapping: originalPath -> hostedURL
  //    - Update HTML content to use hosted URLs
  //    - Example: 'images/logo.png' -> '/api/files/{fileId}/images/logo.png'
  // 
  // 4. ENHANCED /api/get-file-content ENDPOINT:
  //    
  //    export async function GET(request: NextRequest) {
  //      const { searchParams } = new URL(request.url)
  //      const fileId = searchParams.get('fileId')
  //      const processAssets = searchParams.get('processAssets') === 'true'
  //      
  //      // Get file path using existing file storage system
  //      const filePath = await getFilePath(fileId, fileName)
  //      let htmlContent = fs.readFileSync(filePath, 'utf-8')
  //      
  //      if (processAssets) {
  //        htmlContent = await processHtmlAssets(htmlContent, fileId)
  //      }
  //      
  //      return new NextResponse(htmlContent, {
  //        headers: { 'Content-Type': 'text/html; charset=utf-8' }
  //      })
  //    }
  // 
  // 5. HTML ASSET PROCESSING FUNCTION:
  //    
  //    async function processHtmlAssets(htmlContent: string, fileId: string) {
  //      // Parse HTML to find asset references
  //      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  //      const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi
  //      const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi
  //      
  //      let processedHtml = htmlContent
  //      
  //      // Process image sources
  //      processedHtml = processedHtml.replace(imgRegex, (match, src) => {
  //        if (src.startsWith('http') || src.startsWith('data:')) return match
  //        const hostedUrl = `/api/files/${fileId}/${src}`
  //        return match.replace(src, hostedUrl)
  //      })
  //      
  //      // Process CSS links
  //      processedHtml = processedHtml.replace(linkRegex, (match, href) => {
  //        if (href.startsWith('http') || href.startsWith('data:')) return match
  //        const hostedUrl = `/api/files/${fileId}/${href}`
  //        return match.replace(href, hostedUrl)
  //      })
  //      
  //      // Process script sources
  //      processedHtml = processedHtml.replace(scriptRegex, (match, src) => {
  //        if (src.startsWith('http') || src.startsWith('data:')) return match
  //        const hostedUrl = `/api/files/${fileId}/${src}`
  //        return match.replace(src, hostedUrl)
  //      })
  //      
  //      return processedHtml
  //    }
  // 
  // 6. ENHANCED UPLOAD PROCESSING:
  //    - Modify /api/upload and /api/upload-zip endpoints
  //    - When HTML files are uploaded, scan for asset dependencies
  //    - Store all assets with proper directory structure
  //    - Create asset manifest for each HTML file
  //    - Update file storage to maintain folder structure
  // 
  // 7. FILE STORAGE STRUCTURE:
  //    /tmp/creatives/{fileId}/
  //    ├── index.html (main HTML file)
  //    ├── images/
  //    │   ├── logo.png
  //    │   └── banner.jpg
  //    ├── css/
  //    │   └── styles.css
  //    └── js/
  //        └── script.js
  // 
  // 8. ENHANCED /api/files/[...path]/route.ts:
  //    - Support nested file paths for assets
  //    - Set proper MIME types for all file types
  //    - Handle CORS for cross-origin requests
  //    - Add caching headers for better performance
  //    - Security: Validate file paths to prevent directory traversal
  // 
  // 9. CONTENT SECURITY POLICY:
  //    - Update iframe sandbox attributes if needed
  //    - Allow inline styles and scripts for HTML previews
  //    - Whitelist your domain for asset loading
  //    - Handle external CDN links in HTML files
  // 
  // 10. ERROR HANDLING & LOGGING:
  //     - Log all asset processing failures
  //     - Provide fallback for missing assets
  //     - Show helpful error messages to users
  //     - Monitor asset loading performance
  // 
  // 11. TESTING SCENARIOS:
  //     - HTML file with relative image paths
  //     - HTML file with CSS and JavaScript files
  //     - ZIP file containing HTML + assets
  //     - HTML with external CDN references
  //     - HTML with base64 encoded images
  //     - Malformed HTML content
  // 
  // 12. PERFORMANCE OPTIMIZATIONS:
  //     - Cache processed HTML content
  //     - Compress assets during upload
  //     - Use CDN for asset delivery
  //     - Lazy load large assets
  //     - Minify CSS/JS assets
  // 
  // IMPLEMENTATION PRIORITY:
  // 1. Fix /api/get-file-content to return actual HTML content
  // 2. Implement HTML asset processing function
  // 3. Update file storage to maintain directory structure
  // 4. Enhance /api/files endpoint for nested paths
  // 5. Add comprehensive error handling
  // 6. Implement caching and performance optimizations
  
  // Function to fetch HTML content from uploaded file
  const fetchHtmlContent = async () => {
    try {
      console.log('Fetching HTML content from:', creative.url)
      console.log('Creative type:', creative.type)
      console.log('Creative name:', creative.name)
      console.log('Creative ID:', creative.id)
      
      // First, try to get the file content from our API endpoint with asset processing
      console.log('Trying API endpoint with asset processing...')
      const encodedFileUrl = encodeURIComponent(creative.url)
      const apiResponse = await fetch(`/api/get-file-content?fileId=${creative.id}&fileUrl=${encodedFileUrl}&processAssets=true`, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      
      if (apiResponse.ok) {
        const htmlText = await apiResponse.text()
        console.log('HTML content loaded via API, length:', htmlText.length)
        console.log('First 200 characters:', htmlText.substring(0, 200))
        setHtmlContent(htmlText)
        return
      } else {
        console.log('API response not OK, status:', apiResponse.status)
        const errorText = await apiResponse.text()
        console.log('API error response:', errorText)
      }
      
      // If API fails, try to fetch directly from the uploaded URL
      console.log('API failed, trying direct URL fetch...')
      const directResponse = await fetch(creative.url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        mode: 'cors',
      })
      
      console.log('Direct response status:', directResponse.status)
      
      if (directResponse.ok) {
        const htmlText = await directResponse.text()
        console.log('HTML content loaded directly, length:', htmlText.length)
        console.log('First 200 characters:', htmlText.substring(0, 200))
        setHtmlContent(htmlText)
      } else {
        // Final fallback
        console.log('All methods failed, using fallback content')
        await tryAlternativeHtmlLoading()
      }
    } catch (error) {
      console.log('Fetch error, trying alternative approach...')
      console.error('Error details:', error)
      // Try alternative approach
      await tryAlternativeHtmlLoading()
    }
  }

  // Alternative approach to load HTML content
  const tryAlternativeHtmlLoading = async () => {
    console.log('Using fallback HTML content...')
    // Provide a helpful fallback message with instructions
    const fallbackContent = `<!-- HTML Content Loading Failed -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Creative Editor</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .message {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ff6b6b;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="message">
        <h3>⚠️ Unable to load original HTML content</h3>
        <p>You can start editing by replacing this content with your HTML code.</p>
        <p><strong>Tips:</strong></p>
        <ul>
            <li>Paste your HTML code directly into the editor</li>
            <li>The preview will update automatically as you type</li>
            <li>Click "Save Changes" to save your edits</li>
            <li>Click "Refresh Content" to try loading the original file again</li>
        </ul>
    </div>
</body>
</html>`
    
    setHtmlContent(fallbackContent)
  }

  if (!isOpen) return null

  const fileType = getFileType(creative.name)
  const isImage = fileType === 'image'
  const isHtml = fileType === 'html'
  
  console.log('File type detection:', { 
    fileName: creative.name, 
    fileType, 
    isImage, 
    isHtml, 
    creativeType: creative.type 
  })


  const handleFileNameSave = () => {
    // Validate filename (must have extension)
    const lastDotIndex = editableFileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
      // No extension found, add the original extension
      const originalExtension = creative.name.substring(creative.name.lastIndexOf('.'))
      const newFileName = editableFileName + originalExtension
      setEditableFileName(newFileName)
      // Update the creative object to reflect changes everywhere
      creative.name = newFileName
      return
    }

    // Check if extension was changed (should not allow)
    const originalExtension = creative.name.substring(creative.name.lastIndexOf('.'))
    const newExtension = editableFileName.substring(lastDotIndex)
    
    if (newExtension !== originalExtension) {
      // Extension changed, revert to original extension
      const nameWithoutExtension = editableFileName.substring(0, lastDotIndex)
      const correctedFileName = nameWithoutExtension + originalExtension
      setEditableFileName(correctedFileName)
      // Update the creative object
      creative.name = correctedFileName
      return
    }

    // Filename is valid, update everywhere
    creative.name = editableFileName
    
    // Notify parent component about filename change
    onFileNameChange?.(creative.id, editableFileName)
    
    // TODO: Make API call to update filename on server
    console.log('Saving new filename:', editableFileName)
    
    setIsEditing(false)
  }

  // TODO: BACKEND INTEGRATION - LLM Content Generation
  // 
  // BACKEND DEVELOPER NOTES:
  // 
  // 1. API ENDPOINT: Create POST /api/generate-email-content
  //    - Accept: creative file info, offer details, creative type
  //    - Return: { fromLines: string[], subjectLines: string[] }
  // 
  // 2. LLM INTEGRATION (Claude 3.5 Sonnet or Opus):
  //    - Use Anthropic Claude API for best email marketing results
  //    - Model: claude-3-5-sonnet-20241022 (recommended) or claude-3-opus-20240229
  //    - Temperature: 0.7 (creative but consistent)
  //    - Max tokens: 1000 (sufficient for multiple options)
  // 
  // 3. PROMPT ENGINEERING - Key Elements to Include:
  //    - Creative Type: email, display, search, social, native, push
  //    - Offer Category: e-commerce, SaaS, lead gen, etc.
  //    - Target Audience: demographics, interests, pain points
  //    - Brand Voice: professional, casual, friendly, authoritative
  //    - Industry: finance, health, tech, fashion, etc.
  //    - Campaign Goal: awareness, conversion, retention, engagement
  // 
  // 4. FROM LINES GENERATION GUIDELINES:
  //    - Personalization: "John from [Company]" vs generic "[Company]"
  //    - Trust signals: "Your [Company] Team", "Customer Success"
  //    - Urgency: "Limited Time Offer from [Company]"
  //    - Authority: "Marketing Director at [Company]"
  //    - Generate 3-5 options with different approaches
  // 
  // 5. SUBJECT LINES GENERATION GUIDELINES:
  //    - Length: 30-50 characters for optimal display
  //    - Personalization: Include recipient name or company when possible
  //    - Urgency: "Last 24 hours", "Limited time", "Don't miss out"
  //    - Curiosity: "You won't believe...", "The secret to..."
  //    - Value proposition: "Save 50%", "Free trial", "Exclusive offer"
  //    - Generate 5-8 options with A/B testing potential
  // 
  // 6. CONTEXT ENHANCEMENT:
  //    - Analyze uploaded creative file for visual context
  //    - Extract brand colors, style, messaging from images/HTML
  //    - Use offer ID to fetch offer details (category, target audience)
  //    - Consider user's company name and industry for personalization
  // 
  // 7. QUALITY CONTROL:
  //    - Filter out inappropriate or spam-like content
  //    - Ensure compliance with email marketing best practices
  //    - Validate length constraints (subject lines < 50 chars)
  //    - Check for brand safety and industry appropriateness
  // 
  // 8. ERROR HANDLING:
  //    - Rate limiting for Claude API calls
  //    - Fallback to template-based generation if LLM fails
  //    - User feedback collection for prompt improvement
  //    - Logging for prompt optimization and debugging
  // 
  // 9. PERFORMANCE OPTIMIZATION:
  //    - Cache common industry/creative type combinations
  //    - Async processing for non-blocking user experience
  //    - Progress indicators during generation (2-5 seconds typical)
  //    - Batch processing for multiple creative types
  // 
  // 10. USER EXPERIENCE:
  //     - Show generation progress with spinner
  //     - Allow users to regenerate if not satisfied
  //     - Provide option to edit generated content
  // 
  // 11. SECURITY CONSIDERATIONS:
  //     - Sanitize all inputs to prevent prompt injection
  //     - Rate limit per user to prevent abuse
  //     - Validate file types and content before processing
  //     - Audit trail for generated content
  // 
  // 12. MONITORING & ANALYTICS:
  //     - Track generation success rates
  //     - Monitor Claude API usage and costs
  //     - User satisfaction metrics for generated content
  //     - A/B testing results for different prompt variations
  // 
  // EXAMPLE API REQUEST:
  // POST /api/generate-email-content
  // {
  //   "creativeId": "file_123",
  //   "creativeType": "email",
  //   "offerId": "offer_456",
  //   "companyName": "TechCorp",
  //   "industry": "SaaS",
  //   "targetAudience": "B2B, Small Business Owners",
  //   "campaignGoal": "conversion",
  //   "brandVoice": "professional"
  // }
  // 
  // EXAMPLE API RESPONSE:
  // {
  //   "success": true,
  //   "fromLines": [
  //     "Sarah from TechCorp",
  //     "Your TechCorp Success Team",
  //     "TechCorp Customer Success"
  //   ],
  //   "subjectLines": [
  //     "Transform your business with TechCorp",
  //     "The secret to 10x productivity",
  //     "Don't miss: 50% off this week only",
  //     "Free trial: See results in 7 days"
  //   ]
  // }
  const handleGenerateContent = async () => {
    // TODO: Implement LLM content generation
    // 1. Show loading state
    // 2. Call backend API with creative context
    // 3. Update fromLines and subjectLines state
    // 4. Handle errors gracefully
    // 5. Show success feedback
    
    console.log('Generating email content for creative:', creative.id)
    
    // Placeholder for backend integration
    setFromLines('Generated from lines will appear here...')
    setSubjectLines('Generated subject lines will appear here...')
  }

  // TODO: BACKEND INTEGRATION - Proofreading Functions
  const handleRegenerateAnalysis = async () => {
    // TODO: Implement proofreading analysis
    // 1. Show loading state with spinner
    // 2. Call /api/proofread-creative endpoint
    // 3. Update proofreadingData state
    // 4. Handle errors gracefully
    // 5. Show success feedback
    
    console.log('Regenerating proofreading analysis for creative:', creative.id)
    
    // Placeholder for backend integration
    setProofreadingData({
      issues: [],
      suggestions: []
    })
  }

  const handleApplyAllFixes = async () => {
    // TODO: Implement automatic fixes application
    // 1. Show loading state
    // 2. Apply all grammar/spelling corrections
    // 3. Update fromLines and subjectLines with corrections
    // 4. Clear resolved issues from proofreadingData
    // 5. Show success feedback
    
    console.log('Applying all fixes for creative:', creative.id)
    
    // Placeholder for backend integration
    // This would update the actual content fields with corrections
  }

  // TODO: BACKEND INTEGRATION - HTML Editor Functions
  const handleSaveHtml = async () => {
    // TODO: Implement HTML content saving
    // 1. Show loading state
    // 2. Call backend API to save HTML changes
    // 3. Update creative object with new HTML
    // 4. Handle errors gracefully
    // 5. Show success feedback
    
    console.log('Saving HTML changes for creative:', creative.id)
    
    // Placeholder for backend integration
    // This would save the HTML content to the server
  }

  // TODO: BACKEND INTEGRATION - File Deletion & Cleanup
  // 
  // CRITICAL MISSING FUNCTIONALITY:
  // The frontend has delete buttons in CreativeDetails.tsx and MultipleCreativeView.tsx
  // but there's no comprehensive backend TODO for file deletion operations.
  // 
  // REQUIRED IMPLEMENTATION:
  // 
  // 1. DELETE ENDPOINT: Create DELETE /api/files/{fileId}
  //    - Accept: fileId parameter
  //    - Return: { success: boolean, message: string }
  // 
  // 2. CASCADE DELETION:
  //    - Delete original file from storage
  //    - Delete associated thumbnails/previews
  //    - Delete extracted ZIP assets if applicable
  //    - Clean up temporary files
  // 
  // 3. STORAGE CLEANUP:
  //    - Remove files from file system/cloud storage
  //    - Update storage usage statistics
  //    - Reclaim disk space
  //    - Clear CDN cache if applicable
  // 
  // 4. AUDIT TRAIL:
  //    - Log file deletion events
  //    - Track user who deleted files
  //    - Maintain deletion history for compliance
  //    - Optional soft delete with recovery period
  // 
  // 5. BULK DELETION SUPPORT:
  //    - POST /api/files/bulk-delete endpoint
  //    - Accept array of fileIds
  //    - Transaction handling for partial failures
  //    - Progress reporting for large deletions
  // 
  // EXAMPLE API IMPLEMENTATION:
  // 
  // DELETE /api/files/{fileId}
  // {
  //   "success": true,
  //   "message": "File deleted successfully",
  //   "deletedFiles": [
  //     { "type": "original", "path": "/uploads/abc123.jpg" },
  //     { "type": "thumbnail", "path": "/uploads/thumb_abc123.jpg" },
  //     { "type": "preview", "path": "/uploads/preview_abc123.jpg" }
  //   ],
  //   "spaceReclaimed": "2.5MB"
  // }
  // 
  // ERROR HANDLING:
  // - File not found (404)
  // - Permission denied (403)
  // - File in use/locked (409)
  // - Storage errors (500)
  // 
  // SECURITY CONSIDERATIONS:
  // - Verify user permissions before deletion
  // - Prevent unauthorized file access
  // - Rate limiting for bulk deletions
  // - Audit logging for compliance

  // HTML Editor fullscreen toggle
  const toggleHtmlEditorFullscreen = () => {
    setIsHtmlEditorFullscreen(!isHtmlEditorFullscreen)
  }

  // Image Preview fullscreen toggle
  const toggleImagePreviewFullscreen = () => {
    setIsImagePreviewFullscreen(!isImagePreviewFullscreen)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-color-border">
          <div className="flex items-center gap-3">
            {isImage ? (
              <Image className="h-6 w-6 text-blue-500" />
            ) : isHtml ? (
              <FileText className="h-6 w-6 text-green-500" />
            ) : (
              <File className="h-6 w-6 text-gray-500" />
            )}
            <h2 className="text-lg font-medium text-gray-900 truncate">
              {creative.name}
            </h2>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-150"
          >
            Save and Continue
          </Button>
        </div>

        {/* Content - Three Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Creative Preview - 25% */}
          <div className="w-1/4 border-r border-color-border p-6 bg-gray-50 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
              </div>
              
              {/* Fullscreen button - Only show for images */}
              {isImage && creative.previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleImagePreviewFullscreen}
                  className="flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                >
                  <Maximize2 className="h-4 w-4" />
                  Fullscreen
                </Button>
              )}
            </div>
            
            <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-auto">
              {/* 
                TODO: CRITICAL BUG FIX - Image Preview Not Working from MultipleCreativeView
                
                PROBLEM:
                When navigating from MultipleCreativeView to SingleCreativeView, image previews 
                are not showing because this component only checks for creative.previewUrl 
                and doesn't implement the same robust fallback mechanism as MultipleCreativeView.
                
                CURRENT ISSUE:
                - SingleCreativeView only shows images if creative.previewUrl exists
                - MultipleCreativeView uses creative.previewUrl || creative.url as fallback
                - MultipleCreativeView has ImagePreview component with error handling, loading states, and fallbacks
                - SingleCreativeView uses simple <img> tag without error handling
                
                REQUIRED IMPLEMENTATION:
                
                1. IMAGE SOURCE FALLBACK:
                   - Change condition from: isImage && creative.previewUrl
                   - To: isImage && (creative.previewUrl || creative.url)
                   - Use same fallback logic as MultipleCreativeView
                
                2. ROBUST IMAGE PREVIEW COMPONENT:
                   - Either import ImagePreview component from MultipleCreativeView
                   - Or create similar error handling with loading/error states
                   - Add crossOrigin="anonymous" for CORS handling
                   - Implement onError and onLoad handlers
                
                3. CONSISTENT BEHAVIOR:
                   - Ensure same image loading behavior in both components
                   - Same error handling and fallback mechanisms
                   - Same loading indicators and error messages
                
                4. FULLSCREEN PREVIEW FIX:
                   - Update fullscreen image preview to use same fallback
                   - Change: {isImagePreviewFullscreen && isImage && creative.previewUrl &&
                   - To: {isImagePreviewFullscreen && isImage && (creative.previewUrl || creative.url) &&
                   - Update fullscreen img src to use fallback
                
                EXAMPLE IMPLEMENTATION:
                
                // Option 1: Extract ImagePreview to shared component
                import { ImagePreview } from '@/components/ui/ImagePreview'
                
                {isImage && (creative.previewUrl || creative.url) ? (
                  <div className="w-full p-4">
                    <ImagePreview 
                      src={creative.previewUrl || creative.url}
                      alt={creative.name}
                      fileName={creative.name}
                      className="w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
                ) : isHtml ? (
                
                // Option 2: Inline error handling (simpler fix)
                {isImage && (creative.previewUrl || creative.url) ? (
                  <div className="w-full p-4">
                    <img
                      src={creative.previewUrl || creative.url}
                      alt={creative.name}
                      className="w-full h-auto rounded-lg shadow-sm"
                      onError={(e) => {
                        console.error('Failed to load image:', creative.previewUrl || creative.url)
                        // Show fallback or error message
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : isHtml ? (
                
                PRIORITY: HIGH - This affects user experience when navigating between views
                ESTIMATED TIME: 15-30 minutes
                TESTING: Verify image preview works in both direct SingleCreativeView and via MultipleCreativeView navigation
              */}
              {isImage && creative.previewUrl ? (
                <div className="w-full p-4">
                  <img
                    src={creative.previewUrl}
                    alt={creative.name}
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              ) : isHtml ? (
                <iframe
                  srcDoc={htmlContent || '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'}
                  title="HTML Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center space-y-3 p-4">
                  <div>
                    <File className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">File Preview Not Available</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(creative.url, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Open File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Features - 50% */}
          <div className="w-1/2 border-r border-color-border p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Features</h3>
              </div>
              
              <div className="space-y-4">
                {/* HTML Editor Container - Only show for HTML creatives */}
                {isHtml && (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">HTML Editor</h3>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleHtmlEditorFullscreen}
                          className="flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                        >
                          <Maximize2 className="h-4 w-4" />
                          Fullscreen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveHtml}
                          className="flex items-center gap-2 text-orange-700 border-orange-300 hover:bg-orange-50 hover:text-orange-800 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                          HTML Code
                        </Label>
                        <Textarea
                          value={htmlContent}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHtmlContent(e.target.value)}
                          placeholder="Edit your HTML code here..."
                          rows={12}
                          className="w-full resize-none text-sm font-mono border-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Make changes to your HTML creative. The preview will update automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Content Group */}
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Email Content</h3>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateContent}
                      className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate From & Subject Lines
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* From Lines */}
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                        {Constants.fromSubjectLinesConfig.fromLines.label}
                      </Label>
                      <Textarea
                        value={fromLines}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFromLines(e.target.value)}
                        placeholder={Constants.fromSubjectLinesConfig.fromLines.placeholder}
                        rows={3}
                        className="w-full resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {Constants.fromSubjectLinesConfig.fromLines.helpText}
                      </p>
                    </div>

                    {/* Subject Lines */}
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                        {Constants.fromSubjectLinesConfig.subjectLines.label}
                      </Label>
                      <Textarea
                        value={subjectLines}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubjectLines(e.target.value)}
                        placeholder={Constants.fromSubjectLinesConfig.subjectLines.placeholder}
                        rows={3}
                        className="w-full resize-none text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {Constants.fromSubjectLinesConfig.subjectLines.helpText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proofreading Container */}
                {/* 
                  TODO: BACKEND INTEGRATION - LLM-Based Proofreading & Optimization
                  
                  BACKEND DEVELOPER NOTES:
                  
                  1. API ENDPOINT: Create POST /api/proofread-creative
                     - Accept: creative file (image/HTML), creative type, offer context
                     - Return: { issues: [...], suggestions: [...] }
                  
                  2. LLM INTEGRATION (Claude 3.5 Sonnet or GPT-4 Vision):
                     - Use Claude 3.5 Sonnet for text analysis (best for grammar/spelling)
                     - Use GPT-4 Vision for image analysis (best for visual content)
                     - Model: claude-3-5-sonnet-20241022 or gpt-4-vision-preview
                     - Temperature: 0.3 (precise corrections)
                     - Max tokens: 1500 (sufficient for detailed analysis)
                  
                  3. IMAGE ANALYSIS (Visual Content):
                     - Extract text from images using OCR (Tesseract.js or Google Vision API)
                     - Analyze visual elements: colors, layout, branding consistency
                     - Detect text overlay positioning and readability
                     - Identify potential accessibility issues
                     - Check for brand guideline compliance
                  
                  4. HTML ANALYSIS (Web Content):
                     - Parse HTML structure and extract visible text content
                     - Analyze meta tags, title tags, and alt text
                     - Check for semantic HTML best practices
                     - Validate internal links and call-to-action buttons
                     - Review responsive design elements
                  
                  5. PROOFREADING CATEGORIES:
                     - Grammar: Subject-verb agreement, tense consistency, article usage
                     - Spelling: Typos, common misspellings, brand name accuracy
                     - Punctuation: Missing periods, commas, apostrophes, quotation marks
                     - Capitalization: Proper nouns, titles, brand names
                     - Style: Tone consistency, brand voice alignment
                  
                  6. OPTIMIZATION SUGGESTIONS:
                     - Conversion: Add urgency, scarcity, social proof elements
                     - Engagement: Personalization, emotional triggers, storytelling
                     - Subject Lines: Length optimization, curiosity gaps, action words
                     - Call-to-Actions: Button text, placement, color psychology
                     - Visual Hierarchy: Layout improvements, focus points, flow
                  
                  7. CONTEXT-AWARE ANALYSIS:
                     - Creative Type: email, display, search, social, native, push
                     - Industry: finance, health, tech, fashion, e-commerce, B2B
                     - Target Audience: demographics, interests, pain points
                     - Campaign Goal: awareness, conversion, retention, engagement
                     - Brand Guidelines: voice, colors, typography, messaging
                  
                  8. QUALITY SCORING:
                     - Grammar Score: 0-100 based on error count and severity
                     - Readability Score: Flesch-Kincaid, Gunning Fog Index
                     - Conversion Potential: Based on CTA strength and urgency
                     - Brand Alignment: Consistency with brand guidelines
                     - Mobile Optimization: Responsive design and mobile UX
                  
                  9. ERROR PRIORITIZATION:
                     - Critical: Grammar/spelling that affects meaning
                     - Important: Style and tone inconsistencies
                     - Minor: Formatting and visual improvements
                     - Suggestions: Optional optimizations for better performance
                  
                  10. PERFORMANCE OPTIMIZATION:
                      - Async processing for non-blocking user experience
                      - Progress indicators during analysis (5-15 seconds typical)
                      - Caching common industry/creative type patterns
                      - Batch processing for multiple creatives
                      - Rate limiting for API calls
                  
                  11. ERROR HANDLING:
                      - Graceful fallback if LLM analysis fails
                      - Partial results if some analysis succeeds
                      - User feedback collection for improvement
                      - Logging for prompt optimization and debugging
                      - Retry mechanism for transient failures
                  
                  12. SECURITY CONSIDERATIONS:
                      - Sanitize all inputs to prevent prompt injection
                      - Rate limit per user to prevent abuse
                      - Validate file types and content before processing
                      - Audit trail for analyzed content
                      - Data privacy compliance (GDPR, CCPA)
                  
                  13. MONITORING & ANALYTICS:
                      - Track analysis success rates and accuracy
                      - Monitor LLM API usage and costs
                      - User satisfaction metrics for suggestions
                      - A/B testing results for optimization impact
                      - Performance metrics for processing time
                  
                  EXAMPLE API REQUEST:
                  POST /api/proofread-creative
                  {
                    "creativeId": "file_123",
                    "creativeType": "email",
                    "fileType": "image", // or "html"
                    "offerId": "offer_456",
                    "industry": "SaaS",
                    "targetAudience": "B2B, Small Business Owners",
                    "campaignGoal": "conversion",
                    "brandVoice": "professional"
                  }
                  
                  EXAMPLE API RESPONSE:
                  {
                    "success": true,
                    "issues": [
                      {
                        "icon": "⚠️",
                        "type": "Grammar Error",
                        "original": "Your going to love this offer",
                        "correction": "You're going to love this offer"
                      },
                      {
                        "icon": "🔤",
                        "type": "Spelling Error", 
                        "original": "Exclusive offer for limmited time",
                        "correction": "Exclusive offer for limited time"
                      }
                    ],
                    "suggestions": [
                      {
                        "icon": "💡",
                        "type": "Conversion Tip",
                        "description": "Add urgency: 'Only 24 hours left' or 'Limited time offer'"
                      },
                      {
                        "icon": "🎯",
                        "type": "Engagement Tip",
                        "description": "Use personalization: 'Hi [Name], here's your exclusive offer'"
                      }
                    ],
                    "qualityScore": {
                      "grammar": 85,
                      "readability": 78,
                      "conversion": 72,
                      "brandAlignment": 90
                    }
                  }
                */}
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Proofreading & Optimization</h3>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateAnalysis}
                      className="flex items-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Analyze Creative
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Grammar & Spelling Issues */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Issues Found ({proofreadingData.issues?.length || 0})
                      </h4>
                      
                      <div className="space-y-2">
                        {proofreadingData.issues && proofreadingData.issues.length > 0 ? (
                          proofreadingData.issues.map((issue, index) => (
                            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <span className="text-red-500 text-sm">{issue.icon}</span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-800">{issue.type}</p>
                                  <p className="text-xs text-red-600 mt-1">
                                    <span className="line-through">{issue.original}</span>
                                  </p>
                                  <p className="text-xs text-green-600 mt-1">
                                    <strong>Correction:</strong> {issue.correction}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No issues found. Your content looks great!</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conversion & Engagement Suggestions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Optimization Suggestions ({proofreadingData.suggestions?.length || 0})
                      </h4>
                      
                      <div className="space-y-2">
                        {proofreadingData.suggestions && proofreadingData.suggestions.length > 0 ? (
                          proofreadingData.suggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-500 text-sm">{suggestion.icon}</span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-800">{suggestion.type}</p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    {suggestion.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No optimization suggestions available.</p>
                          </div>
                        )}
                      </div>
                    </div>


            </div>
          </div>
        </div>
      </div>
    </div>

          {/* Column 3: File Details - 25% */}
          <div className="w-1/4 p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <File className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">File Details</h3>
              </div>
              
              <div className="space-y-5">
                {/* Editable Filename */}
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Filename</Label>
                  <div className="space-y-2">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            value={editableFileName.substring(0, editableFileName.lastIndexOf('.'))}
                            onChange={(e) => {
                              const extension = editableFileName.substring(editableFileName.lastIndexOf('.'))
                              setEditableFileName(e.target.value + extension)
                            }}
                            className="flex-1 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                            autoFocus
                          />
                          <span className="text-sm text-gray-500 font-mono px-2 py-2 bg-gray-100 rounded border">
                            {editableFileName.substring(editableFileName.lastIndexOf('.'))}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleFileNameSave}
                            className="px-3 py-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditableFileName(creative.name)
                              setIsEditing(false)
                            }}
                            className="px-3 py-1 h-8 text-xs border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-gray-800 font-medium truncate bg-gray-50 px-3 py-2 rounded border">
                          {editableFileName}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="p-2 h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Type */}
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">File Type</Label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-purple-100 text-purple-800 text-sm font-medium rounded-md border border-purple-200">
                      {creative.type || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* File Size */}
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">File Size</Label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md border border-green-200">
                      {formatFileSize(creative.size)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen HTML Editor Modal */}
      {isHtmlEditorFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="bg-white w-full h-full max-w-7xl max-h-[95vh] flex flex-col rounded-lg shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">HTML Editor - {creative.name}</h2>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHtmlEditorFullscreen}
                  className="flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                  Exit Fullscreen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveHtml}
                  className="flex items-center gap-2 text-orange-700 border-orange-300 hover:bg-orange-50 hover:text-orange-800 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Fullscreen Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: HTML Editor */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    HTML Code
                  </Label>
                </div>
                <div className="flex-1 p-4">
                  <Textarea
                    value={htmlContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHtmlContent(e.target.value)}
                    placeholder="Edit your HTML code here..."
                    className="w-full h-full resize-none text-sm font-mono border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* Right Side: Live Preview */}
              <div className="w-1/2 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Live Preview
                  </Label>
                </div>
                <div className="flex-1 bg-gray-50">
                  <iframe
                    srcDoc={htmlContent || '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'}
                    title="HTML Preview - Fullscreen"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {/* TODO: RELATED BUG FIX - Fullscreen Image Preview Same Issue
          This condition also needs to be updated to use the same fallback:
          Change: isImagePreviewFullscreen && isImage && creative.previewUrl
          To: isImagePreviewFullscreen && isImage && (creative.previewUrl || creative.url)
          And update the img src below to use: creative.previewUrl || creative.url
      */}
      {isImagePreviewFullscreen && isImage && creative.previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Exit Fullscreen Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleImagePreviewFullscreen}
              className="absolute top-6 right-6 flex items-center gap-2 text-white border-white/30 hover:bg-white/10 hover:text-white transition-colors z-10"
            >
              <Minimize2 className="h-4 w-4" />
              Exit Fullscreen
            </Button>
            
            {/* Header with filename */}
            <div className="absolute top-6 left-6 flex items-center gap-3 text-white z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Image className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">{creative.name}</h2>
            </div>

            {/* Fullscreen Image */}
            <img
              src={creative.previewUrl}
              alt={creative.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Click outside to close */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={toggleImagePreviewFullscreen}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SingleCreativeView
