"use client"

import { Constants } from '@/app/Constants/Constants'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { File, FileArchive, PencilLine, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { FileUploadModal, UploadType, FromSubjectLinesModal } from '@/components/modals'
import { uploadFile } from '@/lib/uploadClient'

type UploadedFileMeta = {
  id: string;           
  name: string;
  url: string;          
  size: number;
  type: string;
  source?: 'single' | 'zip';
  html?: boolean;       
  previewUrl?: string;  
};

type UploadError = { scope: 'single' | 'zip'; message: string };

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
  
  // File management state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMeta[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [lastError, setLastError] = useState<UploadError | null>(null)
  
  React.useEffect(() => {
    onFilesChange?.(uploadedFiles);
  }, [uploadedFiles, onFilesChange]);

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
  const addFiles = (files: UploadedFileMeta[]) =>
    setUploadedFiles(prev => [...prev, ...files])

  const removeFile = (id: string) =>
    setUploadedFiles(prev => prev.filter(f => f.id !== id))

  const makeThumb = (file: File) =>
    new Promise<string | undefined>((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(undefined)
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined)
      reader.readAsDataURL(file)
    })

  const resetFeedback = () => { setLastError(null); setProgress(null) }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onDataChange({ [name]: value })
  }
  
    // File upload handlers
  const handleSingleFileUpload = async (file: File) => {
    resetFeedback();
    try {
      setUploading(true);
      setProgress(1);

      const metadata = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        userId: 'current-user-id', 
      };

      const json = await uploadFile(file, {
        endpoint: '/api/upload-url',
        headers: {  },
        onProgress: (p) => setProgress(p),
        retry: { retries: 2, baseDelayMs: 400 },
        compressImages: true,
        metadata
      });

      const url = json.url as string;
      if (!url) throw new Error('Upload response missing url');

      const previewUrl = await makeThumb(file);
      addFiles([{
        id: crypto.randomUUID(),
        name: file.name,
        url,
        size: file.size,
        type: file.type || 'application/octet-stream',
        source: 'single',
        html: /\.html?$/i.test(file.name),
        previewUrl
      }]);

      setProgress(100);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error('Upload failed');
      setLastError({ scope: 'single', message: err.message });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(null), 600);
    }
  }
  
  const handleMultipleFileUpload = async (file: File) => {
    resetFeedback();
    try {
      setUploading(true);
      setProgress(1);

      const metadata = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        userId: 'current-user-id', 
      };

      const json = await uploadFile(file, {
        endpoint: '/api/upload-zip',
        headers: {  },
        onProgress: (p) => setProgress(p),
        retry: { retries: 2, baseDelayMs: 400 },
        compressImages: false, 
        metadata
      });

      const data = json;
      const mapped: UploadedFileMeta[] = (data.extractedFiles || []).map((f: { fileId: string; fileName: string; fileUrl: string; fileSize: number; fileType?: string }) => ({
        id: f.fileId,
        name: f.fileName,
        url: f.fileUrl,
        size: f.fileSize,
        type: f.fileType || 'application/octet-stream',
        source: 'zip',
        html: /\.html?$/i.test(f.fileName),
        previewUrl: /\.(png|jpe?g|gif|webp)$/i.test(f.fileName) ? f.fileUrl : undefined,
      }));

      addFiles(mapped);
      setProgress(100);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error('ZIP extraction failed');
      setLastError({ scope: 'zip', message: err.message });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(null), 600);
    }
  }
  
     const handleFromSubjectLinesSave = (fromLines: string, subjectLines: string) => {
     console.log('From Lines:', fromLines)
     console.log('Subject Lines:', subjectLines)
     
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
       
       {/* Upload feedback */}
       {(uploading || progress !== null || lastError) && (
         <div className="mt-3 space-y-2">
           {uploading && <p className="text-sm text-gray-600">Uploading…</p>}
           {progress !== null && (
             <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
               <div className="bg-blue-500 h-2 transition-all" style={{ width: `${progress}%` }} />
             </div>
           )}
           {lastError && (
             <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
               {lastError.message}
             </div>
           )}
         </div>
       )}

       {/* Uploaded files preview/list */}
       {uploadedFiles.length > 0 && (
         <div className="mt-4">
           <div className="flex items-center justify-between mb-2">
             <h4 className="text-sm font-semibold text-gray-800">
               Uploaded Files ({uploadedFiles.length})
             </h4>
           </div>

           <div className="grid gap-3 sm:grid-cols-2">
             {uploadedFiles.map(f => (
               <div key={f.id} className="flex items-center gap-3 p-3 rounded border bg-white">
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
                   <p className="text-xs text-gray-500 truncate">{f.type} · {(f.size/1024).toFixed(1)} KB</p>
                   <a href={f.url} target="_blank" className="text-xs text-blue-600 underline">Open</a>
                 </div>

                 {/* remove */}
                 <button
                   className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                   onClick={() => removeFile(f.id)}
                 >
                   Remove
                 </button>
               </div>
             ))}
           </div>
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