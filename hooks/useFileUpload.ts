import { useState, useCallback } from 'react'

export interface FileUploadState {
  selectedFile: File | null
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error'
  errorMessage: string
  dragActive: boolean
}

export interface FileUploadHandlers {
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileSelect: (file: File) => void
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  resetState: () => void
}

export const useFileUpload = (
  allowedTypes: string[],
  maxSizeMB: number,
  onFileUpload: (file: File) => void
) => {
  const [state, setState] = useState<FileUploadState>({
    selectedFile: null,
    uploadStatus: 'idle',
    errorMessage: '',
    dragActive: false
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setState(prev => ({ ...prev, dragActive: true }))
    } else if (e.type === "dragleave") {
      setState(prev => ({ ...prev, dragActive: false }))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState(prev => ({ ...prev, dragActive: false }))

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      handleFileSelect(file)
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!allowedTypes.includes(file.type) && !allowedTypes.some(type => file.name.endsWith(type))) {
      setState(prev => ({
        ...prev,
        errorMessage: `Please select a valid file type: ${allowedTypes.join(', ')}`
      }))
      return
    }

    // Validate file size (skip if maxSizeMB is Infinity)
    if (maxSizeMB !== Infinity && file.size > maxSizeMB * 1024 * 1024) {
      setState(prev => ({
        ...prev,
        errorMessage: `File size must be less than ${maxSizeMB}MB`
      }))
      return
    }

    setState(prev => ({
      ...prev,
      selectedFile: file,
      errorMessage: ''
    }))
  }, [allowedTypes, maxSizeMB])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }, [handleFileSelect])

  const resetState = useCallback(() => {
    setState({
      selectedFile: null,
      uploadStatus: 'idle',
      errorMessage: '',
      dragActive: false
    })
  }, [])

  const startUpload = useCallback(async () => {
    if (!state.selectedFile) return

    setState(prev => ({ ...prev, uploadStatus: 'uploading' }))
    
    try {
      // TODO: BACKEND INTEGRATION - Implement actual file upload
      // 
      // BACKEND DEVELOPER NOTES:
      // 1. Create API endpoint: POST /api/upload/creative
      // 2. Handle file upload with multer/formidable or similar
      // 3. Validate file type and size on server side
      // 4. Store file in cloud storage (AWS S3, Google Cloud Storage, etc.)
      // 5. Save file metadata to database (filename, path, size, type, upload date)
      // 6. Return file ID and download URL
      // 7. Handle ZIP file extraction for multiple creatives
      // 8. Implement virus scanning for uploaded files
      // 9. Add file compression/optimization for images
      // 10. Set up proper error handling and logging
      // 11. Implement file cleanup for failed uploads
      // 12. Add rate limiting for upload endpoints
      // 13. Consider implementing chunked uploads for large files
      // 14. Add file preview generation for images
      // 15. Implement file versioning system
      //
      // Expected API Response:
      // {
      //   success: true,
      //   fileId: "uuid",
      //   fileName: "creative.jpg",
      //   fileUrl: "https://cdn.example.com/files/creative.jpg",
      //   fileSize: 1024000,
      //   fileType: "image/jpeg",
      //   uploadDate: "2024-01-01T00:00:00Z"
      // }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setState(prev => ({ ...prev, uploadStatus: 'success' }))
      onFileUpload(state.selectedFile)
      
      // Auto-close after success
      setTimeout(() => {
        resetState()
      }, 1500)
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        uploadStatus: 'error',
        errorMessage: 'Upload failed. Please try again.'
      }))
    }
  }, [state.selectedFile, onFileUpload, resetState])

  return {
    state,
    handlers: {
      handleDrag,
      handleDrop,
      handleFileSelect,
      handleFileInput,
      resetState
    },
    startUpload
  }
}
