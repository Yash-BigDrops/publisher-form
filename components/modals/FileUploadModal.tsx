"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  FileText,
  Image,
  PencilLine,
} from "lucide-react";
import { useFileUpload } from "@/hooks";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { FILE_UPLOAD_CONFIG, formatFileSize } from "@/constants";
import { UploadAnalysis, AnalyzedItem } from "@/types/upload";

export type UploadType = "single" | "multiple";

type UploadProvider = "local" | "vercel-blob" | "s3";
type ChunkingConfig = { enabled: boolean; chunkSize: number }; // bytes

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadType: UploadType;
  onFileUpload: (file: File) => void | Promise<void> | Promise<{ uploadId?: string }>;
  onZipAnalyzed?: (analysis: UploadAnalysis, file: File) => void;
  creativeType?: string; // Add creativeType prop

  uploadEndpoint?: string;
  uploadZipEndpoint?: string;
  authHeaders?: Record<string, string>;
  userContext?: { userId?: string; role?: string };

  onUploadProgress?: (pct: number) => void;
  onUploadError?: (error: Error) => void;

  onServerValidate?: (file: File) => Promise<{ ok: boolean; reason?: string }>;

  retry?: { retries: number; baseDelayMs: number };
  chunking?: ChunkingConfig;
  provider?: UploadProvider;
  compressImages?: boolean;
  metadata?: Record<string, string | number | boolean>;
  enableVirusScan?: boolean;
  onPreviewGenerated?: (url: string) => void;
  onFromSubjectLinesSave?: (fromLines: string, subjectLines: string) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  uploadType,
  onFileUpload,
  onZipAnalyzed,
  creativeType,
  onFromSubjectLinesSave,
}) => {
  const config =
    uploadType === "single"
      ? FILE_UPLOAD_CONFIG.SINGLE_CREATIVE
      : FILE_UPLOAD_CONFIG.MULTIPLE_CREATIVES;

  const [zipAnalysis, setZipAnalysis] = React.useState<UploadAnalysis | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isFromSubjectLinesModalOpen, setIsFromSubjectLinesModalOpen] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const { state, handlers, startUpload } = useFileUpload(
    config.ALLOWED_TYPES,
    config.MAX_SIZE_MB,
    async (file: File) => {
      if (file.name.toLowerCase().endsWith(".zip") && onZipAnalyzed) {
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeZipFile(file);
          setZipAnalysis(analysis);
          onZipAnalyzed(analysis, file);
          return;
        } catch (error) {
          console.error("ZIP analysis failed:", error);
        } finally {
          setIsAnalyzing(false);
        }
      }

      // Start upload tracking
      setUploadStatus('uploading');
      
      try {
        // Call the onFileUpload callback
        await onFileUpload(file);
        setUploadStatus('success');
        // Close modal after a short delay to show completion
        setTimeout(() => {
          handlers.resetState();
          onClose();
        }, 1000);
      } catch (error) {
        setUploadStatus('error');
        console.error('Upload failed:', error);
      }
    }
  );

  // Reset status when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setUploadStatus('idle');
    }
  }, [isOpen]);

  const analyzeZipFile = async (file: File): Promise<UploadAnalysis> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_ENDPOINTS.ANALYZE_ZIP, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("ZIP analysis failed");
    }

    return response.json();
  };

  React.useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll position and body styles
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handlers.resetState();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handlers]);

  const handleClose = () => {
    handlers.resetState();
    onClose();
  };

  const getModalTitle = () => {
    return uploadType === "single"
      ? "Upload Single Creative"
      : "Upload Multiple Creatives";
  };

  const getDragDropContent = () => {
    if (uploadStatus === "success") {
      return (
        <div className="space-y-3">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Upload Successful!
            </p>
            <p className="text-xs text-green-600">File uploaded successfully</p>
          </div>
        </div>
      );
    }

    if (state.selectedFile) {
      return (
        <div className="space-y-3">
          <CheckCircle className="h-12 w-12 text-blue-500 mx-auto" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {state.selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(state.selectedFile.size)}
            </p>
            {uploadType === "multiple" && (
              <p className="text-xs text-blue-600 font-medium">
                ZIP file ready for upload
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Upload className={`h-12 w-12 text-gray-400 mx-auto`} />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {config.PLACEHOLDER}
          </p>
          <p className="text-xs text-gray-500">or click to browse</p>
        </div>
      </div>
    );
  };

  const getInfoBox = () => {
    if (uploadType === "multiple") {
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
      );
    }
    return null;
  };

  const getFileInfo = () => {
    if (!state.selectedFile) return null;

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
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-color-border">
          <h2 className="text-xl font-semibold text-gray-900">
            {getModalTitle()}
          </h2>
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
          {/* Show only progress when uploading */}
          {uploadStatus === "uploading" && (
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Uploading File</h3>
                  <p className="text-sm text-gray-500">{state.selectedFile?.name}</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                Please wait while your file is being uploaded...
              </p>
            </div>
          )}

          {/* Show success state when complete */}
          {uploadStatus === "success" && (
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-green-900">Upload Complete!</h3>
                  <p className="text-sm text-green-600">{state.selectedFile?.name}</p>
                </div>
              </div>
              
              <p className="text-xs text-green-600 font-medium">
                File uploaded successfully!
              </p>
            </div>
          )}

          {/* Show normal content when not uploading or complete */}
          {uploadStatus !== "uploading" && uploadStatus !== "success" && (
            <>
              {/* Info Box - Only for multiple files */}
              {getInfoBox()}

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  state.dragActive
                    ? "border-blue-400 bg-blue-50"
                    : state.selectedFile
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
                onDragEnter={handlers.handleDrag}
                onDragLeave={handlers.handleDrag}
                onDragOver={handlers.handleDrag}
                onDrop={handlers.handleDrop}
              >
                {getDragDropContent()}
              </div>

              {/* Analyzing ZIP state */}
              {isAnalyzing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center gap-2 text-blue-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
                  <span className="text-sm">Analyzing ZIP file...</span>
                </div>
              )}

              {/* ZIP Analysis Results */}
              {zipAnalysis && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-medium text-green-900">
                      ZIP Analysis Complete
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm text-green-800">
                    <p>
                      <strong>Mode:</strong>{" "}
                      {zipAnalysis.isSingleCreative
                        ? "Single Creative"
                        : "Multiple Creatives"}
                    </p>
                    <p>
                      <strong>Files:</strong> {zipAnalysis.counts.total} total
                    </p>
                    <p>
                      <strong>HTML:</strong> {zipAnalysis.counts.htmls}
                    </p>
                    <p>
                      <strong>Images:</strong> {zipAnalysis.counts.images}
                    </p>
                    <p>
                      <strong>Others:</strong> {zipAnalysis.counts.others}
                    </p>
                  </div>

                  {/* Preview of analyzed items */}
                  <div className="mt-3 space-y-2">
                    {zipAnalysis.items.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-white rounded border"
                      >
                        {item.type === "html" ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : item.type === "image" ? (
                          <Image className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 bg-gray-300 rounded" />
                        )}
                        <span className="text-xs text-gray-700 truncate flex-1">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(item.size)}
                        </span>
                      </div>
                    ))}
                    {zipAnalysis.items.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{zipAnalysis.items.length - 5} more files
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* File Input */}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handlers.handleFileInput}
                accept={config.ACCEPT_EXTENSIONS}
              />

              {/* Browse Button - Only show when no file is selected */}
              {!state.selectedFile && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className="w-full"
                  >
                    Browse {uploadType === "single" ? "Files" : "ZIP Files"}
                  </Button>
                </div>
              )}

              {/* Error Message */}
              {state.errorMessage && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">{state.errorMessage}</p>
                </div>
              )}

              {/* File Info */}
              {getFileInfo()}

              {/* Close button when ZIP analysis is complete */}
              {zipAnalysis && (
                <div className="mt-4 text-center space-y-3">
                  {/* From & Subject Lines button - Only show when creativeType is email */}
                  {creativeType === 'email' && (
                    <Button
                      variant="outline"
                      onClick={() => setIsFromSubjectLinesModalOpen(true)}
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <PencilLine className="h-4 w-4 mr-2" />
                      From & Subject Lines
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleClose}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Close
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
