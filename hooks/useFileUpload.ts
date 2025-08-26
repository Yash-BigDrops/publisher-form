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
  onFileUpload: (file: File) => void | Promise<void>
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

  const handleFileSelect = useCallback(async (file: File) => {
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedTypes.some(type => file.name.endsWith(type)) ||
                       (file.name.toLowerCase().endsWith('.zip') && (
                         file.type === 'application/zip' ||
                         file.type === 'application/x-zip' ||
                         file.type === 'application/x-zip-compressed' ||
                         file.type === 'multipart/x-zip' ||
                         file.type === 'application/octet-stream' ||
                         file.type === ''
                       ));
    
    if (!isValidType) {
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

    // Auto-start upload immediately after selection
    setState(prev => ({
      ...prev,
      selectedFile: file,
      uploadStatus: 'uploading',
      errorMessage: ''
    }))

    try {
      await Promise.resolve(onFileUpload(file))
      setState(prev => ({ ...prev, uploadStatus: 'success' }))
    } catch (e) {
      setState(prev => ({
        ...prev,
        uploadStatus: 'error',
        errorMessage: 'Upload failed. Please try again.'
      }))
    }
  }, [allowedTypes, maxSizeMB, onFileUpload])

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
    // Kept for backward compatibility but upload now triggers on selection
    if (!state.selectedFile) return
    try {
      onFileUpload(state.selectedFile)
      setState(prev => ({ ...prev, uploadStatus: 'success' }))
      resetState()
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
