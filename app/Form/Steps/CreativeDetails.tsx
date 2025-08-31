"use client"

import { Constants } from '@/app/Constants/Constants'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { File, FileArchive, PencilLine, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { FileUploadModal, UploadType, FromSubjectLinesModal, SingleCreativeView, MultipleCreativeView } from '@/components/modals'
import { formatFileSize } from '@/constants'

type UploadedFileMeta = {
  id: string;           
  name: string;
  url: string;          
  size: number;
  type: string;
  source?: 'single' | 'zip';
  html?: boolean;       
  previewUrl?: string;
  assetCount?: number;
  hasAssets?: boolean;
};

type UploadError = { scope: 'single' | 'zip'; message: string };

// API response types for better type safety
interface SingleUploadResponse {
  success: boolean;
  file?: {
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadDate: string;
  }
  zipAnalysis?: {
    uploadId: string
    isSingleCreative: boolean
    items: Array<{
      id: string
      name: string
      type: "image" | "html" | "other"
      size: number
      url: string
      previewUrl?: string
      html?: boolean
    }>
    counts: { images: number; htmls: number; others: number; total: number }
  }
}

interface ZipUploadResponse {
  extractedFiles: Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType?: string;
    previewUrl?: string; // Backend populates this for image files
  }>;
}

interface CreativeDetailsProps {
  formData: {
    offerId: string;
    creativeType: string;
    additionalNotes: string;
    fromLines: string;
    subjectLines: string;
    priority: string;
  };
  onDataChange: (data: Partial<CreativeDetailsProps['formData']>) => void;
  onFilesChange?: (files: UploadedFileMeta[]) => void;
}

const CreativeDetails: React.FC<CreativeDetailsProps> = ({ formData, onDataChange, onFilesChange }) => {
  
  const [offerSearchTerm, setOfferSearchTerm] = useState('')
  const [offerOptions, setOfferOptions] = useState<Array<{label: string; value: string}>>([])
  const [isLoadingOffers, setIsLoadingOffers] = useState(true)
  
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/everflow/offers', { cache: 'no-store' });
        if (!res.ok) throw new Error(await res.text());
        const offerIds = await res.json();
        if (!isMounted) return;
        const offers = offerIds.map((id: string) => ({ 
          label: `Offer ID: ${id}`, 
          value: id 
        }));
        setOfferOptions(offers);
        setIsLoadingOffers(false);
      } catch (e) {
        console.error('Failed to fetch offers:', e);
        if (!isMounted) return;
        setOfferOptions([]);
        setIsLoadingOffers(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentUploadType, setCurrentUploadType] = useState<UploadType>('single')
  const [isFromSubjectLinesModalOpen, setIsFromSubjectLinesModalOpen] = useState(false)
  
  const [hasFromSubjectLines, setHasFromSubjectLines] = useState(false)
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false)
  
  // Single Creative View Modal state
  const [isSingleCreativeViewOpen, setIsSingleCreativeViewOpen] = useState(false)
  const [selectedCreative, setSelectedCreative] = useState<UploadedFileMeta | null>(null)
  
  // Multiple Creative View Modal state
  const [isMultipleCreativeViewOpen, setIsMultipleCreativeViewOpen] = useState(false)
  const [selectedCreatives, setSelectedCreatives] = useState<UploadedFileMeta[]>([])
  const [zipFileName, setZipFileName] = useState<string>('')
  
  // Store ZIP filename for uploaded files summary (persists after modal close)
  const [uploadedZipFileName, setUploadedZipFileName] = useState<string>('')
  
  // File management state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMeta[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [lastError, setLastError] = useState<UploadError | null>(null)
  
  useEffect(() => {
    onFilesChange?.(uploadedFiles);
    // Ensure hasUploadedFiles stays in sync with uploadedFiles array
    setHasUploadedFiles(uploadedFiles.length > 0);
  }, [uploadedFiles, onFilesChange]);

  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts when component unmounts
      // This prevents memory leaks from setTimeout calls
    };
  }, []);

  const handleSelectChange = (fieldName: string, value: string) => {
    onDataChange({ [fieldName]: value })
    
    // Clear search term when offer is selected
    if (fieldName === 'offerId') {
      setOfferSearchTerm('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    onDataChange({ [name]: value })
  }
  
  // File management helpers
  const addFiles = (files: UploadedFileMeta[]) => {
    setUploadedFiles(prev => {
      const updated = [...prev, ...files]
      // Update hasUploadedFiles based on the new array length
      setHasUploadedFiles(updated.length > 0)
      return updated
    })
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== id)
      // Update hasUploadedFiles based on the new array length
      setHasUploadedFiles(updated.length > 0)
      return updated
    })
  }

  const makeThumb = (file: File) =>
    new Promise<string | undefined>((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(undefined)
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined)
      reader.readAsDataURL(file)
    })

  const resetFeedback = () => { setLastError(null); setProgress(null) }

  // Open Single Creative View Modal
  const openSingleCreativeView = (creative: UploadedFileMeta) => {
    setSelectedCreative(creative)
    setIsSingleCreativeViewOpen(true)
  }

  // Open Multiple Creative View Modal
  const openMultipleCreativeView = (creatives: UploadedFileMeta[], fileName?: string) => {
    setSelectedCreatives(creatives)
    setZipFileName(fileName || '')
    setUploadedZipFileName(fileName || '') // Persist ZIP filename for summary
    setIsMultipleCreativeViewOpen(true)
  }

  // Handle removing a creative from the multiple view
  const handleRemoveCreative = (creativeId: string) => {
    // Remove from selectedCreatives
    setSelectedCreatives(prev => prev.filter(creative => creative.id !== creativeId))
    
    // Remove from uploadedFiles
    setUploadedFiles(prev => {
      const updated = prev.filter(file => file.id !== creativeId)
      setHasUploadedFiles(updated.length > 0)
      return updated
    })
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onDataChange({ [name]: value })
  }
  
    // File upload handlers
  const handleSingleFileUpload = async (file: File): Promise<{ uploadId?: string }> => {
    resetFeedback();
    try {
      setUploading(true);
      setProgress(1);

      // send to your existing single upload endpoint
      const fd = new FormData();
      fd.append('file', file);
      
      // Smart ZIP handling: Check if it's a ZIP file
      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
        // Add smart detection flag to determine single vs multiple creatives
        fd.append('smartDetection', 'true');
      }
      
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const data: SingleUploadResponse = await r.json();

      // Handle smart ZIP detection response
      if (data.zipAnalysis) {
        if (data.zipAnalysis.isSingleCreative) {
          // Treat as single creative with assets
          const mainItem = data.zipAnalysis.items.find(i => i.type === "html" || i.type === "image") || data.zipAnalysis.items[0];
          const uploadedFile: UploadedFileMeta = {
            id: mainItem.id,
            name: mainItem.name,
            url: mainItem.url,
            size: mainItem.size,
            type: mainItem.type === "html" ? "html" : mainItem.type === "image" ? "image" : "other",
            source: 'single' as const,
            html: mainItem.html,
            previewUrl: mainItem.previewUrl,
            assetCount: data.zipAnalysis.counts.total,
            hasAssets: data.zipAnalysis.counts.total > 0
          };

          addFiles([uploadedFile]);
          setProgress(100);
          openSingleCreativeView(uploadedFile);
          // Return upload ID for progress tracking
          return { uploadId: data.zipAnalysis.uploadId };
        } else {
          // Redirect to multiple creatives flow
          console.log('ZIP contains multiple creatives, redirecting to multiple upload flow');
          const result = await handleMultipleFileUpload(file);
          return result;
        }
      }

      // Regular single file upload (non-ZIP)
      const uploaded = data.file;
      if (!uploaded) {
        throw new Error('Upload response missing file data');
      }
      
      const previewUrl = await makeThumb(file);

      const uploadedFile: UploadedFileMeta = {
        id: uploaded.fileId,
        name: uploaded.fileName,
        url: uploaded.fileUrl,
        size: uploaded.fileSize,
        type: /\.html?$/i.test(uploaded.fileName)
          ? 'html'
          : /\.(png|jpe?g|gif|webp)$/i.test(uploaded.fileName)
          ? 'image'
          : 'other',
        source: 'single' as const,
        html: /\.html?$/i.test(uploaded.fileName),
        previewUrl: previewUrl || (/\.(png|jpe?g|gif|webp)$/i.test(uploaded.fileName) ? uploaded.fileUrl : undefined)
      };

      addFiles([uploadedFile]);
      setProgress(100);
      
      // Open SingleCreativeView immediately (modal will close after this completes)
      openSingleCreativeView(uploadedFile);
      
      // For regular uploads, we don't have an upload ID, so return empty object
      return {};
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Upload failed';
      setLastError({ scope: 'single', message: errorMessage });
      throw e; // Re-throw to prevent modal from closing on error
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(null), 600);
    }
  }
  
  const handleMultipleFileUpload = async (file: File): Promise<{ uploadId?: string }> => {
    resetFeedback();
    try {
      setUploading(true);
      setProgress(1);

      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/upload-zip', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const data: ZipUploadResponse = await r.json();

      const mapped: UploadedFileMeta[] = (data.extractedFiles || []).map((f) => {
        const isImageFile = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.fileName);
        return {
          id: f.fileId,
          name: f.fileName,
          url: f.fileUrl,
          size: f.fileSize,
          type: /\.html?$/i.test(f.fileName)
            ? 'html'
            : /\.(png|jpe?g|gif|webp|svg)$/i.test(f.fileName)
            ? 'image'
            : 'other',
          source: 'zip' as const,
          html: /\.html?$/i.test(f.fileName),
          // Backend implements thumbnail generation, f.previewUrl contains the thumbnail URL
          previewUrl: f.previewUrl || (isImageFile ? f.fileUrl : undefined),
        };
      });

      addFiles(mapped);
      setProgress(100);
      
      // Open MultipleCreativeView with all files (modal will close after this completes)
      if (mapped.length > 0) {
        openMultipleCreativeView(mapped, file.name);
      }
      
      // For ZIP uploads, we don't have an upload ID in the current response, so return empty object
      return {};
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'ZIP extraction failed';
      setLastError({ scope: 'zip', message: errorMessage });
      throw e; // Re-throw to prevent modal from closing on error
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(null), 600);
    }
  }
  
     const handleFromSubjectLinesSave = (fromLines: string, subjectLines: string) => {
     // Store from and subject lines in form data
     onDataChange({ fromLines, subjectLines })
     
     // Set flag to show uploaded lines instead of upload buttons
     setHasFromSubjectLines(true)
   }
  
  // Handle viewing from/subject lines
  const handleViewFromSubjectLines = () => {
    setIsFromSubjectLinesModalOpen(true)
  }
  
  // Handle deleting from/subject lines
  const handleDeleteFromSubjectLines = () => {
    onDataChange({ fromLines: '', subjectLines: '' })
    setHasFromSubjectLines(false)
  }

  // Handle viewing uploaded files
  const handleViewUploadedFiles = () => {
    if (uploadedFiles.length === 1) {
      // Single file - open SingleCreativeView
      openSingleCreativeView(uploadedFiles[0])
    } else if (uploadedFiles.length > 1) {
      // Multiple files - open MultipleCreativeView
      openMultipleCreativeView(uploadedFiles)
    }
  }

  // Handle filename changes from SingleCreativeView
  const handleFileNameChange = (fileId: string, newFileName: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, name: newFileName } : file
    ))
  }

  // Handle deleting all uploaded files
  const handleDeleteUploadedFiles = () => {
    setUploadedFiles([])
    setHasUploadedFiles(false)
    setUploadedZipFileName('') // Clear ZIP filename when files are deleted
    // Reset any upload-related state to ensure clean slate
    setLastError(null)
    setProgress(null)
    // Close upload modal if it's open to reset its state
    setIsUploadModalOpen(false)
  }
  
  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    onDataChange({ priority })
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
    label?: string;
    options?: Array<{ label: string; value: string }>;
  }) => {
    if (field.type === 'select') {
      // Special handling for offer dropdown with search
      if (field.name === 'offerId') {
        const filteredOptions = offerOptions.filter(option =>
          option.label.toLowerCase().includes(offerSearchTerm.toLowerCase())
        )
        
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
                  {offerSearchTerm ? 'No offers found' : (isLoadingOffers ? 'Loading offers...' : 'No offers available')}
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
            <SelectValue placeholder={field.placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {field.options && field.options.length > 0 ? (
              field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-color-muted-foreground text-center">
                No options available
              </div>
            )}
          </SelectContent>
        </Select>
      )
    } else if (field.type === 'button') {
      return (
        <Button 
          variant="outline" 
          className="w-full h-10 px-3 py-2 border border-color-border rounded-md focus:outline-none focus:ring-2 focus:ring-color-ring focus:border-transparent"
          type="button"
        >
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
        {selectFields.filter(field => field && field.name).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            {renderField(field)}
          </div>
        ))}
      </div>
      
      {/* Upload Creative Buttons or Uploaded Content */}
      <div className="space-y-4">
        {/* Show uploaded files if available */}
        {hasUploadedFiles && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Uploaded Files</Label>
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {uploadedZipFileName ? (
                    <FileArchive className="h-5 w-5 text-green-600" />
                  ) : (
                    <File className="h-5 w-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-green-800">
                      {uploadedFiles.length === 1 
                        ? uploadedFiles[0].name 
                        : (uploadedZipFileName || `${uploadedFiles.length} Files Uploaded`)
                      }
                    </p>
                    <p className="text-sm text-green-600">
                      {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} • {uploadedFiles.reduce((total, file) => total + file.size, 0) > 0 ? formatFileSize(uploadedFiles.reduce((total, file) => total + file.size, 0)) : '0 B'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewUploadedFiles}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteUploadedFiles}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              {/* From & Subject Lines button - Only show when creativeType is email and no from/subject lines yet */}
              {formData.creativeType === 'email' && !hasFromSubjectLines && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFromSubjectLinesModalOpen(true)}
                    className="w-full border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <PencilLine className="h-4 w-4 mr-2" />
                    From & Subject Lines
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Show uploaded from/subject lines if available */}
        {hasFromSubjectLines && (
          <div className="space-y-3">
            <Label className="text-base font-medium">From & Subject Lines</Label>
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
          </div>
        )}
        
        {/* Show upload buttons only when neither section has content */}
        {!hasFromSubjectLines && !hasUploadedFiles && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Upload Creatives</Label>
            <div className={`grid gap-4 ${formData.creativeType === 'email' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* Single Creative - Always visible */}
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-color-border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                onClick={() => {
                  // Reset any previous upload state
                  setLastError(null)
                  setProgress(null)
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
                className="h-20 flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-color-border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                onClick={() => {
                  // Reset any previous upload state
                  setLastError(null)
                  setProgress(null)
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
          </div>
        )}
      </div>
       
       {/* Uploaded files preview/list - Only show when not in summary mode */}
       {uploadedFiles.length > 0 && !hasUploadedFiles && (
         <div className="mt-4">
           <div className="flex items-center justify-between mb-2">
             <h4 className="text-sm font-semibold text-gray-800">
               Uploaded Files ({uploadedFiles.length})
             </h4>
           </div>

           <div className="grid gap-3 sm:grid-cols-2">
             {uploadedFiles.map(f => (
               <div 
                 key={f.id} 
                 className="flex items-center gap-3 p-3 rounded border bg-white hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => openSingleCreativeView(f)}
               >
                 {/* thumbnail */}
                 <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
                   {f.previewUrl ? (
                     <img src={f.previewUrl} alt={f.name} className="object-cover w-full h-full" />
                   ) : f.html ? (
                     <span className="text-xs text-gray-600">HTML</span>
                   ) : (
                     <span className="text-xs text-gray-600">FILE</span>
                   )}
                 </div>

                 {/* meta */}
                 <div className="min-w-0 flex-1">
                   <p className="text-sm font-medium truncate">{f.name}</p>
                   <p className="text-xs text-gray-500 truncate">{f.type} · {formatFileSize(f.size)}</p>
                   <div className="flex gap-2 mt-1">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         openSingleCreativeView(f);
                       }}
                       className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                     >
                       View
                     </button>
                     <a 
                       href={f.url} 
                       target="_blank" 
                       onClick={(e) => e.stopPropagation()}
                       className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                     >
                       Open
                     </a>
                   </div>
                 </div>

                 {/* remove */}
                 <button
                   className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                   onClick={(e) => {
                     e.stopPropagation();
                     removeFile(f.id);
                   }}
                 >
                   Remove
                 </button>
               </div>
             ))}
           </div>
         </div>
       )}
       
       {/* From & Subject Lines button below uploaded files - Only show when creativeType is email and no from/subject lines yet */}
       {uploadedFiles.length > 0 && !hasUploadedFiles && formData.creativeType === 'email' && !hasFromSubjectLines && (
         <div className="mt-4 text-center">
           <Button
             variant="outline"
             onClick={() => setIsFromSubjectLinesModalOpen(true)}
             className="w-full border-green-300 text-green-700 hover:bg-green-50"
           >
             <PencilLine className="h-4 w-4 mr-2" />
             From & Subject Lines
           </Button>
         </div>
       )}
       
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
        {textareaFields.filter(field => field && field.name).map((field) => (
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
        creativeType={formData.creativeType}
        onFromSubjectLinesSave={handleFromSubjectLinesSave}
      />
      
      {/* From & Subject Lines Modal */}
      <FromSubjectLinesModal
        isOpen={isFromSubjectLinesModalOpen}
        onClose={() => setIsFromSubjectLinesModalOpen(false)}
        onSave={handleFromSubjectLinesSave}
        initialFromLines={formData.fromLines}
        initialSubjectLines={formData.subjectLines}
        isMultipleCreative={uploadedFiles.some(file => file.source === 'zip')}
      />
      
      {/* Single Creative View Modal */}
      {selectedCreative && (
        <SingleCreativeView
          isOpen={isSingleCreativeViewOpen}
          onClose={() => {
            setIsSingleCreativeViewOpen(false)
            setSelectedCreative(null)
          }}
          creative={selectedCreative}
          onFileNameChange={handleFileNameChange}
        />
      )}
      
      {/* Multiple Creative View Modal */}
      {selectedCreatives.length > 0 && (
        <MultipleCreativeView
          isOpen={isMultipleCreativeViewOpen}
          onClose={() => {
            setIsMultipleCreativeViewOpen(false)
            setSelectedCreatives([])
            setZipFileName('')
          }}
          creatives={selectedCreatives}
          zipFileName={zipFileName}
          onRemoveCreative={handleRemoveCreative}
          onFileNameChange={handleFileNameChange}
        />
      )}
    </div>
  )
}

export default CreativeDetails