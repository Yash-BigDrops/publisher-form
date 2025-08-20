"use client"

import { Constants } from '@/app/Constants/Constants'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { File, FileArchive, PencilLine, Search } from 'lucide-react'
import React, { useState } from 'react'
import { FileUploadModal, UploadType, FromSubjectLinesModal } from '@/components/modals'

const CreativeDetails = () => {
  const [formData, setFormData] = useState({
    offerId: '',
    creativeType: '',
    additionalNotes: '',
    fromLines: '',
    subjectLines: '',
    priority: 'medium', // Default to medium (from constants)
  })
  
  const [offerSearchTerm, setOfferSearchTerm] = useState('')
  
  // Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentUploadType, setCurrentUploadType] = useState<UploadType>('single')
  const [isFromSubjectLinesModalOpen, setIsFromSubjectLinesModalOpen] = useState(false)
  
  // Track if from/subject lines are saved
  const [hasFromSubjectLines, setHasFromSubjectLines] = useState(false)

  const handleSelectChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear search term when offer is selected
    if (fieldName === 'offerId') {
      setOfferSearchTerm('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // File upload handlers
  const handleSingleFileUpload = (file: File) => {
    console.log('Single file uploaded:', file.name)
    // TODO: BACKEND INTEGRATION - Handle single file upload
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. This function receives a File object after successful upload
    // 2. File object contains: name, size, type
    // 3. You should have received fileId and fileUrl from upload API
    // 4. Store file reference in form data for submission
    // 5. Consider adding file preview/thumbnail
    // 6. Validate file on client side before submission
    // 7. Add file to form state: formData.uploadedFiles = [...formData.uploadedFiles, fileData]
    // 8. Handle file removal if user wants to change selection
    // 9. Show upload progress and success confirmation
    // 10. Implement file type-specific preview (image preview, HTML preview, etc.)
    //
    // Expected file data structure:
    // {
    //   fileId: "uuid",
    //   fileName: "creative.jpg",
    //   fileUrl: "https://cdn.example.com/files/creative.jpg",
    //   fileSize: 1024000,
    //   fileType: "image/jpeg",
    //   uploadDate: "2024-01-01T00:00:00Z"
    // }
  }
  
  const handleMultipleFileUpload = (file: File) => {
    console.log('Multiple files uploaded:', file.name)
    // TODO: BACKEND INTEGRATION - Handle multiple file upload (ZIP file)
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. This function receives a ZIP file after successful upload
    // 2. ZIP file should contain multiple creative files
    // 3. Backend should extract ZIP and process individual files
    // 4. Return array of extracted file information
    // 5. Handle ZIP extraction errors gracefully
    // 6. Validate each extracted file individually
    // 7. Generate previews for each creative
    // 8. Store file references in form data
    // 9. Allow user to remove individual files from ZIP
    // 10. Show extraction progress and file count
    // 11. Handle mixed file types within ZIP
    // 12. Implement file deduplication if needed
    // 13. Add ZIP file size validation
    // 14. Consider implementing batch processing
    // 15. Add file organization within ZIP
    //
    // Expected ZIP extraction response:
    // {
    //   success: true,
    //   zipFileId: "uuid",
    //   extractedFiles: [
    //     {
    //       fileId: "uuid1",
    //       fileName: "creative1.jpg",
    //       fileUrl: "https://cdn.example.com/files/creative1.jpg",
    //       fileSize: 512000,
    //       fileType: "image/jpeg",
    //       originalPath: "folder/creative1.jpg"
    //     },
    //     // ... more files
    //   ],
    //   totalFiles: 5,
    //   extractionDate: "2024-01-01T00:00:00Z"
    // }
  }
  
  const handleFromSubjectLinesSave = (fromLines: string, subjectLines: string) => {
    console.log('From Lines:', fromLines)
    console.log('Subject Lines:', subjectLines)
    // TODO: BACKEND INTEGRATION - Save from and subject lines
    // 
    // BACKEND DEVELOPER NOTES:
    // 1. This function receives from lines and subject lines strings
    // 2. Lines are separated by line breaks (\n)
    // 3. Store in form data for final submission
    // 4. Consider validation: max length, forbidden words, etc.
    // 5. Add to form state: formData.fromLines, formData.subjectLines
    // 6. Show confirmation to user
    // 7. Allow editing before final submission
    // 8. Consider auto-save functionality
    // 9. Implement character count validation
    // 10. Add preview functionality for email campaigns
    //
    // Expected data structure:
    // {
    //   fromLines: "John Smith <john@company.com>\nMarketing Team <marketing@company.com>",
    //   Subject Lines: "Don't miss out on this amazing offer!\nLimited time: 50% off everything"
    // }
    
    setFormData(prev => ({
      ...prev,
      fromLines,
      subjectLines
    }))
    
        // Set flag to show uploaded lines instead of upload buttons
    setHasFromSubjectLines(true)
  }
  
  // Handle viewing from/subject lines
  const handleViewFromSubjectLines = () => {
    setIsFromSubjectLinesModalOpen(true)
  }
  
  // Handle deleting from/subject lines
  const handleDeleteFromSubjectLines = () => {
    setFormData(prev => ({
      ...prev,
      fromLines: '',
      subjectLines: ''
    }))
    setHasFromSubjectLines(false)
  }
  
  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    setFormData(prev => ({
      ...prev,
      priority
    }))
  }
  
  // Separate fields by type for proper ordering
  const selectFields = Constants.formFields.filter(field => 
    ['offerId', 'creativeType'].includes(field.name)
  )
  
  const textareaFields = Constants.formFields.filter(field => 
    ['additionalNotes'].includes(field.name)
  )

  const renderField = (field: {
    name: string;
    type: string;
    placeholder: string;
    options?: Array<{ label: string; value: string }>;
  }) => {
    if (field.type === 'select') {
      // Special handling for offer dropdown with search
      if (field.name === 'offerId') {
        // TODO: BACKEND INTEGRATION - Move filtering to backend for better performance
        // Current frontend filtering is for development only
        // Backend should implement: GET /api/everflow/offers?search={searchTerm}
        const filteredOptions = field.options?.filter(option =>
          option.label.toLowerCase().includes(offerSearchTerm.toLowerCase())
        ) || []
        
        return (
          <Select 
            value={formData[field.name as keyof typeof formData]} 
            onValueChange={(value) => handleSelectChange(field.name, value)}
            onOpenChange={(open) => {
              if (open) {
                setOfferSearchTerm('')
              }
            }}
          >
            <SelectTrigger className="w-full h-12">
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {/* Search Input */}
              <div className="p-3 border-b border-color-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-color-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search offers..."
                    value={offerSearchTerm}
                    onChange={(e) => setOfferSearchTerm(e.target.value)}
                    className="pl-10 h-9 text-sm border-0 focus-visible:ring-0 focus-visible:border-0 shadow-none"
                  />
                </div>
              </div>
              
              {/* Filtered Options */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-color-muted-foreground text-center">
                  {/* TODO: BACKEND INTEGRATION - Handle loading states and API errors */}
                  {offerSearchTerm ? 'No offers found' : 'Loading offers...'}
                </div>
              )}
            </SelectContent>
          </Select>
        )
      }
      
      // Regular select for other fields
      return (
        <Select value={formData[field.name as keyof typeof formData]} onValueChange={(value) => handleSelectChange(field.name, value)}>
          <SelectTrigger className="w-full h-12">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    } else if (field.type === 'button') {
      return (
        <Button variant="outline" className="w-full h-10 px-3 py-2 border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-color-ring focus:border-transparent">
          {field.placeholder}
        </Button>
      )
    }
    
    else if (field.type === 'textarea') {
      return (
        <Textarea
          id={field.name}
          name={field.name}
          value={formData[field.name as keyof typeof formData]}
          onChange={handleTextareaChange}
          placeholder={field.placeholder}
          rows={4}
          className="w-full h-24 px-3 py-2 border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-color-ring focus:border-transparent resize-none bg-white"
        />
      )
    } else {
      return (
        <input
          type={field.type}
          id={field.name}
          name={field.name}
          value={formData[field.name as keyof typeof formData]}
          onChange={handleInputChange}
          placeholder={field.placeholder}
          className="w-full h-10 px-3 py-2 border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-color-ring focus:border-transparent"
        />
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Select Fields (Offer ID & Creative Type) */}
      <div className="space-y-4">
        {selectFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            {renderField(field)}
          </div>
        ))}
      </div>
      
      {/* Upload Creative Buttons or Uploaded From/Subject Lines */}
      <div className="space-y-4">
        <Label className="text-base font-medium">
          {hasFromSubjectLines ? 'Uploaded From & Subject Lines' : 'Upload Creatives'}
        </Label>
        
        {hasFromSubjectLines ? (
          // Show uploaded from/subject lines with view/delete buttons
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PencilLine className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">From & Subject Lines Uploaded</p>
                  <p className="text-sm text-green-600">
                    {formData.fromLines.split('\n').length} from lines • {formData.subjectLines.split('\n').length} subject lines
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewFromSubjectLines}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteFromSubjectLines}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Show upload buttons
          <div className={`grid gap-4 ${formData.creativeType === 'email' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Single Creative - Always visible */}
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-color-border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
              onClick={() => {
                setCurrentUploadType('single')
                setIsUploadModalOpen(true)
              }}
            >
              <File className="text-blue-400" style={{ width: '20px', height: '20px' }} />
              <span className="text-sm font-medium text-center">Single Creative</span>
            </Button>

            {/* Multiple Creatives - Always visible */}
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-color-border hover:border-blue-400 hover:bg-blue-400 hover:bg-blue-50 transition-all duration-200"
              onClick={() => {
                setCurrentUploadType('multiple')
                setIsUploadModalOpen(true)
              }}
            >
              <FileArchive className="text-blue-400" style={{ width: '20px', height: '20px' }} />
              <span className="text-sm font-medium text-center">Multiple Creatives</span>
            </Button>

            {/* From & Subject Lines - Only visible when Email is selected */}
            {formData.creativeType === 'email' && (
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-color-border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                onClick={() => setIsFromSubjectLinesModalOpen(true)}
              >
                <PencilLine className="text-blue-400" style={{ width: '20px', height: '20px' }} />
                <span className="text-sm font-medium text-center">From & Subject Lines</span>
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Priority Toggle */}
      <div className="space-y-3">
        <Label className="text-base font-medium text-gray-700">Set Priority</Label>
        <div className="flex bg-white border border-gray-300 rounded-lg p-1 w-fit shadow-sm">
          {Constants.priorityLevels.map((priority) => (
            <button
              key={priority.value}
              onClick={() => handlePriorityChange(priority.value)}
              className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                formData.priority === priority.value
                  ? 'bg-blue-400 text-white shadow-sm border border-blue-400'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {priority.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Textarea Fields (Additional Notes) */}
      <div className="space-y-4">
        {textareaFields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            {renderField(field)}
          </div>
        ))}
      </div>
      
      {/* Unified File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        uploadType={currentUploadType}
        onFileUpload={currentUploadType === 'single' ? handleSingleFileUpload : handleMultipleFileUpload}
      />
      
      {/* From & Subject Lines Modal */}
      <FromSubjectLinesModal
        isOpen={isFromSubjectLinesModalOpen}
        onClose={() => setIsFromSubjectLinesModalOpen(false)}
        onSave={handleFromSubjectLinesSave}
        initialFromLines={formData.fromLines}
        initialSubjectLines={formData.subjectLines}
      />
    </div>
  )
}

export default CreativeDetails