"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Download, Share2, Edit3, Eye, FileText, Image, File } from 'lucide-react'
import { formatFileSize, getFileType } from '@/constants'

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

  if (!isOpen) return null

  const fileType = getFileType(creative.name)
  const isImage = fileType === 'image'
  const isHtml = fileType === 'html'

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

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = creative.url
    link.download = creative.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Sharing creative:', creative.id)
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
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Three Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Creative Preview - 25% */}
          <div className="w-1/4 border-r border-color-border p-6 overflow-y-auto bg-gray-50">
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
                {isImage && creative.previewUrl ? (
                  <div className="max-w-full max-h-full">
                    <img
                      src={creative.previewUrl}
                      alt={creative.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                ) : isHtml ? (
                  <div className="text-center space-y-3">
                    <FileText className="h-16 w-16 text-green-400 mx-auto" />
                    <p className="text-gray-600">HTML Creative</p>
                                       <Button
                     variant="outline"
                     onClick={() => window.open(creative.url, '_blank')}
                     className="flex items-center gap-2 transition-colors duration-150"
                   >
                     <Eye className="h-4 w-4" />
                     View HTML
                   </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <File className="h-16 w-16 text-gray-400 mx-auto" />
                    <p className="text-gray-600">File Preview Not Available</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(creative.url, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Open File
                    </Button>
                  </div>
                )}
              </div>
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
                {/* File Type */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-medium text-blue-900">File Type</Label>
                  <p className="text-sm text-blue-700 mt-1">
                    {isImage ? 'Image' : isHtml ? 'HTML Document' : 'File'}
                  </p>
                </div>

                {/* Dimensions (for images) */}
                {isImage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Label className="text-sm font-medium text-green-900">Dimensions</Label>
                    <p className="text-sm text-green-700 mt-1">
                      {/* TODO: Add actual image dimensions */}
                      Auto-detected
                    </p>
                  </div>
                )}

                {/* Format */}
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Label className="text-sm font-medium text-purple-900">Format</Label>
                  <p className="text-sm text-purple-700 mt-1">
                    {creative.type || 'Unknown'}
                  </p>
                </div>

                {/* Upload Source */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Label className="text-sm font-medium text-orange-900">Source</Label>
                  <p className="text-sm text-orange-700 mt-1">
                    Single Upload
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(creative.url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
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
    </div>
  )
}

export default SingleCreativeView
