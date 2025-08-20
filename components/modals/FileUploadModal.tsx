"use client"

import React, { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Upload, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react'
import { useFileUpload } from '@/hooks'
import { FILE_UPLOAD_CONFIG, UPLOAD_STATUS_MESSAGES, formatFileSize } from '@/constants'

export type UploadType = 'single' | 'multiple'

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  uploadType: UploadType
  onFileUpload: (file: File) => void
  // TODO: BACKEND INTEGRATION - Add additional props for backend communication
  // 
  // BACKEND DEVELOPER NOTES:
  // 1. Consider adding: onUploadProgress, onUploadError, uploadEndpoint
  // 2. Add file validation callbacks for server-side validation
  // 3. Include authentication headers and user context
  // 4. Add retry mechanism for failed uploads
  // 5. Consider adding chunked upload support for large files
  // 6. Add file preview generation callbacks
  // 7. Include file metadata collection (tags, categories, etc.)
  // 8. Add support for different storage providers
  // 9. Include file compression options
  // 10. Add virus scanning integration points
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  uploadType,
  onFileUpload
}) => {
  const config = uploadType === 'single' 
    ? FILE_UPLOAD_CONFIG.SINGLE_CREATIVE 
    : FILE_UPLOAD_CONFIG.MULTIPLE_CREATIVES

  const { state, handlers, startUpload } = useFileUpload(
    config.ALLOWED_TYPES,
    config.MAX_SIZE_MB,
    onFileUpload
  )

  const handleClose = () => {
    handlers.resetState()
    onClose()
  }

  const getModalTitle = () => {
    return uploadType === 'single' ? 'Upload Single Creative' : 'Upload Multiple Creatives'
  }

  const getDragDropContent = () => {
    if (state.selectedFile) {
      return (
        <div className="space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <div>
            <p className="text-sm font-medium text-gray-900">{state.selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(state.selectedFile.size)}
            </p>
            {uploadType === 'multiple' && (
              <p className="text-xs text-green-600 font-medium">ZIP file ready for upload</p>
            )}
          </div>
        </div>
      )
    }
    
          return (
        <div className="space-y-3">
          <Upload className={`h-12 w-12 text-gray-400 mx-auto`} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {config.PLACEHOLDER}
            </p>
            <p className="text-xs text-gray-500">
              or click to browse
            </p>
          </div>
        </div>
      )
  }

  const getInfoBox = () => {
    if (uploadType === 'multiple') {
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <FolderOpen className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">ZIP File Requirements:</p>
              <ul className="mt-1 space-y-1 text-xs">
                {config.REQUIREMENTS?.map((req: string, index: number) => (
                  <li key={index}>• {req}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const getFileInfo = () => {
    if (!state.selectedFile) return null
    
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 truncate">
              {state.selectedFile.name}
            </p>
            <p className="text-xs text-blue-700">
              {formatFileSize(state.selectedFile.size)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-color-border">
          <h2 className="text-xl font-semibold text-gray-900">{getModalTitle()}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-red-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info Box - Only for multiple files */}
          {getInfoBox()}

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              state.dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : state.selectedFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={handlers.handleDrag}
            onDragLeave={handlers.handleDrag}
            onDragOver={handlers.handleDrag}
            onDrop={handlers.handleDrop}
          >
            {getDragDropContent()}
          </div>

          {/* File Input */}
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handlers.handleFileInput}
            accept={config.ACCEPT_EXTENSIONS}
          />

          {/* Browse Button */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full"
            >
              Browse {uploadType === 'single' ? 'Files' : 'ZIP Files'}
            </Button>
          </div>

          {/* Error Message */}
          {state.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{state.errorMessage}</p>
            </div>
          )}

          {/* File Info */}
          {getFileInfo()}
        </div>
      </div>
    </div>
  )
}

export default FileUploadModal
