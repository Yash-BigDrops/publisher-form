"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit3,
  Eye,
  FileText,
  Image,
  File,
  Sparkles,
  Maximize2,
  Minimize2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatFileSize, getFileType } from "@/constants";
import { Constants } from "@/app/Constants/Constants";
import { proofreadCreative } from "@/lib/proofreadCreativeClient";
import { saveHtml, renameCreative, saveCreativeMetadata, getCreativeMetadata } from "@/lib/creativeClient";
import { ImagePreview } from "@/components/ui/ImagePreview";
import { generateEmailContent } from "@/lib/generationClient";
import { ProofreadCreativeResponse } from "@/lib/proofreadCreativeClient";

interface SingleCreativeViewProps {
  isOpen: boolean;
  onClose: () => void;
  creative: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    previewUrl?: string;
    html?: boolean;
  };
  onFileNameChange?: (fileId: string, newFileName: string) => void;
}

const SingleCreativeView: React.FC<SingleCreativeViewProps> = ({
  isOpen,
  onClose,
  creative,
  onFileNameChange,
}) => {
  const [editableFileName, setEditableFileName] = useState(creative.name);
  const [editableNameOnly, setEditableNameOnly] = useState(() => {
    const lastDotIndex = creative.name.lastIndexOf(".");
    return lastDotIndex > 0
      ? creative.name.substring(0, lastDotIndex)
      : creative.name;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fromLines, setFromLines] = useState("");
  const [subjectLines, setSubjectLines] = useState("");
  const [isHtmlEditorFullscreen, setIsHtmlEditorFullscreen] = useState(false);
  const [isImagePreviewFullscreen, setIsImagePreviewFullscreen] =
    useState(false);
  const [isHtmlPreviewFullscreen, setIsHtmlPreviewFullscreen] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  
  // Proofreading data state
  const [proofreadingData, setProofreadingData] = useState<ProofreadCreativeResponse>({
    success: true,
    issues: [],
    suggestions: [],
    qualityScore: {
      grammar: 0,
      readability: 0,
      conversion: 0,
      brandAlignment: 0,
    },
  });

  // HTML content state for editing
  const [htmlContent, setHtmlContent] = useState("");

  // HTML Editor state
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Content generation state
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Proofreading/analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load existing creative data when component mounts or creative changes
  React.useEffect(() => {
    if (isOpen && creative.id) {
      loadExistingCreativeData();
    }
  }, [isOpen, creative.id]);

  // Function to load existing creative data
  const loadExistingCreativeData = async () => {
    try {
      const data = await getCreativeMetadata(creative.id);
      if (data.success && data.metadata) {
        setFromLines(data.metadata.fromLines || "");
        setSubjectLines(data.metadata.subjectLines || "");
        if (data.metadata.proofreadingData) {
          setProofreadingData(data.metadata.proofreadingData);
        }
        if (data.metadata.htmlContent) {
          setHtmlContent(data.metadata.htmlContent);
        }
        console.log("Loaded existing creative data for creative:", creative.id, data.metadata);
      } else {
        console.log("No existing data found for creative:", creative.id);
      }
    } catch (error) {
      console.log("No existing data found for creative:", creative.id);
    }
  };

  // Prevent background scrolling when modal is open
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

  // Function to fetch HTML content from uploaded file
  const fetchHtmlContent = React.useCallback(async () => {
    try {
      console.log("Fetching HTML content from:", creative.url);
      console.log("Creative type:", creative.type);
      console.log("Creative name:", creative.name);
      console.log("Creative ID:", creative.id);
      
      // First, try to get the file content from our API endpoint with asset processing
      console.log("Trying API endpoint with asset processing...");
      const encodedFileUrl = encodeURIComponent(creative.url);
      const apiResponse = await fetch(
        `/api/get-file-content?fileId=${creative.id}&fileUrl=${encodedFileUrl}&processAssets=true`,
        {
          method: "GET",
        headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        }
      );
      
      if (apiResponse.ok) {
        const htmlText = await apiResponse.text();
        console.log("HTML content loaded via API, length:", htmlText.length);
        console.log("First 200 characters:", htmlText.substring(0, 200));
        setHtmlContent(htmlText);
        return;
      } else {
        console.log("API response not OK, status:", apiResponse.status);
        const errorText = await apiResponse.text();
        console.log("API error response:", errorText);
      }
      
      // If API fails, try to fetch directly from the uploaded URL
      console.log("API failed, trying direct URL fetch...");
      const directResponse = await fetch(creative.url, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        mode: "cors",
      });
      
      console.log("Direct response status:", directResponse.status);
      
      if (directResponse.ok) {
        const htmlText = await directResponse.text();
        console.log("HTML content loaded directly, length:", htmlText.length);
        console.log("First 200 characters:", htmlText.substring(0, 200));
        setHtmlContent(htmlText);
      } else {
        // Final fallback
        console.log("All methods failed, using fallback content");
        await tryAlternativeHtmlLoading();
      }
    } catch (error) {
      console.log("Fetch error, trying alternative approach...");
      console.error("Error details:", error);
      // Try alternative approach
      await tryAlternativeHtmlLoading();
    }
  }, [creative.url, creative.type, creative.name, creative.id]);

  // Alternative approach to load HTML content
  const tryAlternativeHtmlLoading = async () => {
    console.log("Using fallback HTML content...");
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
</html>`;
    
    setHtmlContent(fallbackContent);
  };

  // Load HTML content when modal opens for HTML creatives
  React.useEffect(() => {
    if (
      isOpen &&
      creative.type &&
      (creative.type.includes("html") ||
        creative.name.toLowerCase().includes(".html"))
    ) {
      console.log("Loading HTML content for HTML creative...");
      fetchHtmlContent();
    }
  }, [isOpen, creative.type, creative.name, fetchHtmlContent]);

  // HTML Content Loading & Image Hosting implemented with /api/files/[id]/[...path] and asset rewriting

  if (!isOpen) return null;

  const fileType = getFileType(creative.name);
  const isImage = fileType === "image";
  const isHtml = fileType === "html";

  console.log("File type detection:", {
    fileName: creative.name, 
    fileType, 
    isImage, 
    isHtml, 
    creativeType: creative.type,
  });

  const handleFileNameSave = async () => {
    // Validate that the name part is not empty
    if (!editableNameOnly.trim()) {
      // Don't save empty names
      return;
    }

    // Construct the full filename with the original extension
    const originalExtension = creative.name.substring(
      creative.name.lastIndexOf(".")
    );
    const newFileName = editableNameOnly.trim() + originalExtension;

    try {
      // Call the rename API
      await renameCreative({
        creativeId: creative.id,
        fileUrl: creative.url,
        newName: newFileName,
      });
    
    // Update both state variables
      setEditableFileName(newFileName);
    
    // Update the creative object to reflect changes everywhere
      creative.name = newFileName;
    
    // Notify parent component about filename change
      onFileNameChange?.(creative.id, newFileName);

      console.log("Filename renamed successfully:", newFileName);
    } catch (error) {
      console.error("Failed to rename file:", error);
      // Revert to original name on error
      setEditableFileName(creative.name);
      const lastDotIndex = creative.name.lastIndexOf(".");
      setEditableNameOnly(
        lastDotIndex > 0
          ? creative.name.substring(0, lastDotIndex)
          : creative.name
      );
      // You can add toast notification here for error feedback
    } finally {
      setIsEditing(false);
    }
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameOnly = e.target.value;
    setEditableNameOnly(nameOnly);
    
    // Update the full filename with extension
    const extension = creative.name.substring(creative.name.lastIndexOf("."));
    setEditableFileName(nameOnly + extension);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFileNameSave();
    } else if (e.key === "Escape") {
      setEditableFileName(creative.name);
      const lastDotIndex = creative.name.lastIndexOf(".");
      setEditableNameOnly(
        lastDotIndex > 0
          ? creative.name.substring(0, lastDotIndex)
          : creative.name
      );
      setIsEditing(false);
    }
  };

  // LLM Content Generation implemented with /api/generate-email-content endpoint
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
    try {
      setIsGeneratingContent(true);
      console.log("Generating email content for creative:", creative.id);

      let sampleText = "";
      if (creative.type === "html" || creative.html) {
        if (htmlContent) {
          sampleText = htmlContent
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1000);
        }
      } else if (creative.type === "image") {
        sampleText = `Image creative: ${creative.name}`;
      }

      const { fromLines: newFromLines, subjectLines: newSubjectLines } =
        await generateEmailContent({
          creativeType: creative.type || "Email",
          notes: "",
          sampleText,
          maxFrom: 4,
          maxSubject: 8,
        });

      const mergeContent = (existing: string, newItems: string[]) => {
        const existingLines = existing
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        const newLines = newItems.map((s) => s.trim()).filter(Boolean);
        const allLines = [...existingLines, ...newLines];
        const uniqueLines = Array.from(new Set(allLines));
        return uniqueLines.join("\n");
      };

      const mergedFromLines = mergeContent(fromLines, newFromLines);
      const mergedSubjectLines = mergeContent(subjectLines, newSubjectLines);
      
      setFromLines(mergedFromLines);
      setSubjectLines(mergedSubjectLines);

      // Save the generated content immediately for this creative
      try {
        await saveCreativeMetadata({
          creativeId: creative.id,
          fromLines: mergedFromLines,
          subjectLines: mergedSubjectLines,
          proofreadingData,
          htmlContent,
          metadata: {
            lastGenerated: new Date().toISOString(),
            creativeType: creative.type,
            fileName: creative.name,
          },
        });
        console.log("Generated content saved immediately for creative:", creative.id);
      } catch (saveError) {
        console.error("Failed to save generated content:", saveError);
      }

      console.log("Content generation completed successfully");
    } catch (error) {
      console.error("Content generation failed:", error);
      setFromLines("Failed to generate content. Please try again.");
      setSubjectLines("Failed to generate content. Please try again.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Proofreading Functions
  const handleRegenerateAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      console.log("Starting proofreading analysis for creative:", creative.id);

      const isHtml = creative.html || creative.type === "html" || /\.html?$/i.test(creative.name);
      const isImg = creative.type === "image" || /^image\//.test(creative.type);

      if (isHtml) {
        if (!htmlContent) {
          console.log("No HTML content available for proofreading");
          return;
        }
        const result = await proofreadCreative({
          fileType: "html",
          htmlContent,
          creativeType: creative.type as
            | "email"
            | "display"
            | "search"
            | "social"
            | "native"
            | "push",
        });
        setProofreadingData(result);
        
        // Save proofreading results immediately for this creative
        try {
          await saveCreativeMetadata({
            creativeId: creative.id,
            fromLines,
            subjectLines,
            proofreadingData: result,
            htmlContent,
            metadata: {
              lastProofread: new Date().toISOString(),
              creativeType: creative.type,
              fileName: creative.name,
            },
          });
          console.log("Proofreading results saved immediately for creative:", creative.id);
        } catch (saveError) {
          console.error("Failed to save proofreading results:", saveError);
        }
      } else if (isImg) {
        let imageUrl = creative.previewUrl || creative.url;
        if (!imageUrl) {
          console.log("No image URL available for proofreading");
          return;
        }
        
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = `${window.location.origin}${imageUrl}`;
        }
        
        const result = await proofreadCreative({
          fileType: "image",
          fileUrl: imageUrl,
          creativeType: creative.type as
            | "email"
            | "display"
            | "search"
            | "social"
            | "native"
            | "push",
        });
        setProofreadingData(result);
      } else {
        console.log(
          "Unsupported creative type for proofreading:",
          creative.type
        );
        return;
      }

      console.log("Proofreading completed");
    } catch (error) {
      console.error("Proofreading failed:", error);
      setProofreadingData({
        success: false,
        issues: [],
        suggestions: [
          {
            icon: "ℹ️",
            type: "Notice",
            description: "Proofreading failed. Please try again.",
          },
        ],
        qualityScore: {
          grammar: 0,
          readability: 0,
          conversion: 0,
          brandAlignment: 0,
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // HTML Editor Functions
  const handleSaveHtml = async () => {
    try {
      setIsSaving(true);
      console.log("Saving HTML changes for creative:", creative.id);

      await saveHtml({
        fileUrl: creative.url,
        html: htmlContent,
        newFileName: creative.name,
      });

      // Reload iframe preview to show updated content
      setPreviewKey((prev) => prev + 1);

      // Show success feedback (you can add a toast notification here)
      console.log("HTML saved successfully");
    } catch (error) {
      console.error("Failed to save HTML:", error);
      // Show error feedback (you can add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  };

  // Comprehensive Save Function
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      console.log("Saving all creative data for:", creative.id);

      // Save all metadata including proofreading, email content, etc.
      await saveCreativeMetadata({
        creativeId: creative.id,
        fromLines,
        subjectLines,
        proofreadingData,
        htmlContent,
        metadata: {
          lastSaved: new Date().toISOString(),
          creativeType: creative.type,
          fileName: creative.name,
        },
      });

      console.log("All creative data saved successfully");
      
      // Close the modal after successful save
      onClose();
    } catch (error) {
      console.error("Failed to save creative data:", error);
      // Show error feedback (you can add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  };

  // File Deletion & Cleanup implemented with /api/files/[id] and /api/files/bulk-delete endpoints

  // HTML Editor fullscreen toggle
  const toggleHtmlEditorFullscreen = () => {
    setIsHtmlEditorFullscreen(!isHtmlEditorFullscreen);
  };

  // HTML Preview fullscreen toggle
  const toggleHtmlPreviewFullscreen = () => {
    setIsHtmlPreviewFullscreen(!isHtmlPreviewFullscreen);
  };

  // Image Preview fullscreen toggle
  const toggleImagePreviewFullscreen = () => {
    setIsImagePreviewFullscreen(!isImagePreviewFullscreen);
  };

  // Preview collapse toggle
  const togglePreviewCollapse = () => {
    setIsPreviewCollapsed(!isPreviewCollapsed);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header with File Details - Left-Right Layout */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-color-border bg-gray-50 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Side: File Information Group */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* File Icon */}
            <div className="flex-shrink-0">
              {isImage ? (
                <Image className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              ) : isHtml ? (
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              ) : (
                <File className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
              )}
            </div>
            
            {/* Filename Section */}
            <div className="min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center">
                    <Input
                      value={editableNameOnly}
                      onChange={handleFileNameChange}
                      onKeyDown={handleKeyDown}
                      className="text-xs sm:text-sm font-medium h-6 sm:h-7 w-24 sm:w-32 md:w-40 rounded-r-none border-r-0"
                      autoFocus
                      placeholder="Filename"
                    />
                    <span className="text-xs text-gray-500 font-mono px-1 sm:px-2 py-1 h-6 sm:h-7 bg-gray-100 rounded-r border border-l-0 border-gray-300 flex items-center whitespace-nowrap">
                      {creative.name.substring(creative.name.lastIndexOf("."))}
                    </span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleFileNameSave}
                    className="p-1 h-6 w-6 sm:h-7 sm:w-7 bg-green-600 hover:bg-green-700 flex items-center justify-center"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditableFileName(creative.name);
                      const lastDotIndex = creative.name.lastIndexOf(".");
                      setEditableNameOnly(
                        lastDotIndex > 0
                          ? creative.name.substring(0, lastDotIndex)
                          : creative.name
                      );
                      setIsEditing(false);
                    }}
                    className="p-1 h-6 w-6 sm:h-7 sm:w-7 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-medium text-gray-800 max-w-[120px] sm:max-w-[160px] md:max-w-[200px] truncate">
                    {editableFileName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const lastDotIndex = editableFileName.lastIndexOf(".");
                      setEditableNameOnly(
                        lastDotIndex > 0
                          ? editableFileName.substring(0, lastDotIndex)
                          : editableFileName
                      );
                      setIsEditing(true);
                    }}
                    className="p-0.5 h-5 w-5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* File Metadata Group - On Left Side */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded border border-purple-200">
                {creative.type?.split("/")[1] || "File"}
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-200">
                {formatFileSize(creative.size)}
              </span>
            </div>
          </div>
          
          {/* Right Side: Save Button */}
          <div className="flex-shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-150 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSaving ? "Saving..." : "Save and Continue"}</span>
            </Button>
          </div>
        </div>

        {/* Content - Responsive Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Column 1: Creative Preview - Collapsible on mobile/tablet */}
          <div
            className={`${
              isPreviewCollapsed ? "hidden lg:flex" : "flex"
            } lg:w-1/2 lg:border-r border-color-border p-4 sm:p-6 bg-gray-50 flex-col min-h-0`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 mb-5 gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                {/* Collapse/Expand button - Only on mobile/tablet */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePreviewCollapse}
                  className="lg:hidden flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                  <span>Collapse</span>
                </Button>
                
                {isImage && (creative.previewUrl || creative.url) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleImagePreviewFullscreen}
                    className="flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-800 transition-colors flex-1 sm:flex-initial"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>Fullscreen</span>
                  </Button>
                )}
                {isHtml && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleHtmlPreviewFullscreen}
                    className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors flex-1 sm:flex-initial"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>Fullscreen</span>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-auto min-h-[300px] lg:min-h-0">
              {/* Image preview with fallback to creative.url if previewUrl not available */}
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
                <iframe
                  key={previewKey}
                  srcDoc={
                    htmlContent ||
                    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'
                  }
                  title="HTML Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center space-y-3 p-4">
                  <div>
                    <File className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">
                      File Preview Not Available
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(creative.url, "_blank")}
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

          {/* Column 2: Features - Expanded when preview collapsed */}
          <div
            className={`${
              isPreviewCollapsed ? "w-full" : "lg:w-1/2"
            } p-4 sm:p-6 overflow-y-auto bg-gray-50 border-t lg:border-t-0 border-color-border lg:border-l-0`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Features
                  </h3>
                </div>
                
                {/* Show expand button when preview is collapsed (mobile/tablet only) */}
                {isPreviewCollapsed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePreviewCollapse}
                    className="lg:hidden flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span>Show Preview</span>
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* HTML Editor Container - Only show for HTML creatives */}
                {isHtml && (
                  <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3 sm:gap-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                          HTML Editor
                        </h3>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleHtmlEditorFullscreen}
                          className="flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-50 hover:text-purple-800 transition-colors flex-1 sm:flex-initial"
                        >
                          <Maximize2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Fullscreen</span>
                          <span className="sm:hidden">Full</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveHtml}
                          disabled={isSaving}
                          className="flex items-center gap-2 text-orange-700 border-orange-300 hover:bg-orange-50 hover:text-orange-800 transition-colors flex-1 sm:flex-initial disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                          <FileText className="h-4 w-4" />
                          <span>Save Changes</span>
                            </>
                          )}
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
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>
                          ) => setHtmlContent(e.target.value)}
                          placeholder="Edit your HTML code here..."
                          rows={8}
                          className="w-full resize-none text-xs sm:text-sm font-mono border-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Make changes to your HTML creative. The preview will
                          update automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Content Group */}
                <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                        Email Content
                      </h3>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateContent}
                      disabled={isGeneratingContent}
                      className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors w-full sm:w-auto disabled:opacity-50"
                    >
                      {isGeneratingContent ? (
                        <>
                          <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">
                            Generating...
                          </span>
                          <span className="sm:hidden">Generating...</span>
                        </>
                      ) : (
                        <>
                      <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            Generate From & Subject Lines
                          </span>
                      <span className="sm:hidden">Generate Content</span>
                        </>
                      )}
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
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFromLines(e.target.value)
                        }
                        placeholder={
                          Constants.fromSubjectLinesConfig.fromLines.placeholder
                        }
                        rows={3}
                        className="w-full resize-none text-xs sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setSubjectLines(e.target.value)
                        }
                        placeholder={
                          Constants.fromSubjectLinesConfig.subjectLines
                            .placeholder
                        }
                        rows={3}
                        className="w-full resize-none text-xs sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {Constants.fromSubjectLinesConfig.subjectLines.helpText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proofreading Container - LLM-based proofreading implemented with /api/proofread-creative */}
                <div className="p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-800">
                        Proofreading & Optimization
                      </h3>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateAnalysis}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 transition-colors w-full sm:w-auto disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">Analyzing...</span>
                          <span className="sm:hidden">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">Analyze Creative</span>
                          <span className="sm:hidden">Analyze</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Grammar & Spelling Issues */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Issues Found{proofreadingData.issues !== undefined ? ` (${proofreadingData.issues.length})` : ''}
                      </h4>
                      
                      <div className="space-y-2">
                        {proofreadingData.issues &&
                        proofreadingData.issues.length > 0 ? (
                          proofreadingData.issues.map(
                            (issue, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-red-50 border border-red-200 rounded-lg"
                              >
                              <div className="flex items-start gap-2">
                                  <span className="text-xs px-2 py-1 rounded font-medium bg-red-200 text-red-800 w-max text-nowrap">
                                    {issue.type}
                                  </span>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-red-800">
                                      {issue.note || issue.type}
                                    </p>
                                    {issue.original && (
                                  <p className="text-xs text-red-600 mt-1">
                                        <span className="line-through">
                                          {issue.original}
                                        </span>
                                  </p>
                                    )}
                                    {issue.correction && (
                                  <p className="text-xs text-green-600 mt-1">
                                        <strong>Correction:</strong>{" "}
                                        {issue.correction}
                                  </p>
                                    )}
                                </div>
                              </div>
                            </div>
                            )
                          )
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">
                              Click the &quot;Analyze Creative&quot; button to start proofreading.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {proofreadingData.suggestions &&
                      proofreadingData.suggestions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Suggestions{proofreadingData.suggestions !== undefined ? ` (${proofreadingData.suggestions.length})` : ''}
                      </h4>
                      <div className="space-y-2">
                            {proofreadingData.suggestions.map(
                              (suggestion, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                >
                              <div className="flex items-start gap-2">
                                    <span className="text-xs px-2 py-1 rounded font-medium bg-blue-200 text-blue-800 w-max text-nowrap">
                                      {suggestion.type}
                                    </span>
                                    <p className="text-xs text-blue-800">
                                    {suggestion.description}
                                  </p>
                                </div>
                              </div>
                              )
                            )}
                            </div>
                          </div>
                        )}

                    {/* Quality Score */}
                    {proofreadingData.qualityScore && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Quality Score
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                            <p className="text-xs text-purple-600 font-medium">
                              Grammar
                            </p>
                            <p className="text-lg font-bold text-purple-800">
                              {proofreadingData.qualityScore.grammar}/100
                            </p>
                      </div>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                            <p className="text-xs text-purple-600 font-medium">
                              Readability
                            </p>
                            <p className="text-lg font-bold text-purple-800">
                              {proofreadingData.qualityScore.readability}/100
                            </p>
                    </div>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                            <p className="text-xs text-purple-600 font-medium">
                              Conversion
                            </p>
                            <p className="text-lg font-bold text-purple-800">
                              {proofreadingData.qualityScore.conversion}/100
                            </p>
                  </div>
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                            <p className="text-xs text-purple-600 font-medium">
                              Brand Alignment
                            </p>
                            <p className="text-lg font-bold text-purple-800">
                              {proofreadingData.qualityScore.brandAlignment}/100
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
          <div className="bg-white w-full h-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Fullscreen Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-200 gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                  HTML Editor - {creative.name}
                </h2>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleHtmlEditorFullscreen}
                  className="flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-50 hover:text-purple-800 transition-colors flex-1 sm:flex-initial"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span>Exit Fullscreen</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveHtml}
                  disabled={isSaving}
                  className="flex items-center gap-2 text-orange-700 border-orange-300 hover:bg-orange-50 hover:text-orange-800 transition-colors flex-1 sm:flex-initial disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                  <FileText className="h-4 w-4" />
                  <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Fullscreen Content - Responsive Split View */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* HTML Editor */}
              <div className="lg:w-1/2 lg:border-r border-gray-200 flex flex-col min-h-0">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    HTML Code
                  </Label>
                </div>
                <div className="flex-1 p-3 sm:p-4">
                  <Textarea
                    value={htmlContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setHtmlContent(e.target.value)
                    }
                    placeholder="Edit your HTML code here..."
                    className="w-full h-full resize-none text-xs sm:text-sm font-mono border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:w-1/2 flex flex-col min-h-0 border-t lg:border-t-0 border-gray-200">
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Live Preview
                  </Label>
                </div>
                <div className="flex-1 bg-gray-50 min-h-[300px] lg:min-h-0">
                  <iframe
                    srcDoc={
                      htmlContent ||
                      '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'
                    }
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

      {/* Fullscreen HTML Preview Modal */}
      {isHtmlPreviewFullscreen && isHtml && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="bg-white w-full h-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Fullscreen Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-200 gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                  HTML Preview - {creative.name}
                </h2>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleHtmlPreviewFullscreen}
                className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors w-full sm:w-auto"
              >
                <Minimize2 className="h-4 w-4" />
                <span>Exit Fullscreen</span>
              </Button>
            </div>

            {/* Fullscreen Content - Full Width Preview */}
            <div className="flex-1 bg-gray-50 p-3 sm:p-6">
              <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200">
                <iframe
                  srcDoc={
                    htmlContent ||
                    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:#666;"><p>HTML content will appear here</p></div>'
                  }
                  title="HTML Preview - Fullscreen"
                  className="w-full h-full border-0 rounded-lg"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {isImagePreviewFullscreen &&
        isImage &&
        (creative.previewUrl || creative.url) && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Exit Fullscreen Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleImagePreviewFullscreen}
              className="absolute top-3 sm:top-6 right-3 sm:right-6 flex items-center gap-2 text-white border-white/30 hover:bg-white/10 hover:text-white transition-colors z-10"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Exit Fullscreen</span>
            </Button>
            
            {/* Header with filename */}
            <div className="absolute top-3 sm:top-6 left-3 sm:left-6 flex items-center gap-3 text-white z-10">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Image className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
                <h2 className="text-sm sm:text-lg font-semibold truncate max-w-[200px] sm:max-w-none">
                  {creative.name}
                </h2>
            </div>

            {/* Fullscreen Image */}
              <div onClick={(e) => e.stopPropagation()}>
                <ImagePreview
                  src={creative.previewUrl || creative.url}
              alt={creative.name}
                  fileName={creative.name}
                  className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
              </div>
            
            {/* Click outside to close */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={toggleImagePreviewFullscreen}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCreativeView;
