"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Image, File, Minimize2, FileArchive } from "lucide-react";
import { formatFileSize, getFileType } from "@/constants";
import SingleCreativeView from "./SingleCreativeView";
import { ImagePreview } from "@/components/ui/ImagePreview";
import { bulkDeleteByIds, parseIdsFromUrl } from "@/lib/filesClient";

interface MultipleCreativeViewProps {
  isOpen: boolean;
  onClose: () => void;
  creatives: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    previewUrl?: string;
    html?: boolean;
    uploadId?: string; 
    embeddedHtml?: string; 
  }>;
  zipFileName?: string;
  onRemoveCreative?: (creativeId: string) => void;
  onFileNameChange?: (fileId: string, newFileName: string) => void;
  creativeType?: string; // Add creative type prop to control Email Content visibility
}

const MultipleCreativeView: React.FC<MultipleCreativeViewProps> = ({
  isOpen,
  onClose,
  creatives,
  zipFileName,
  onRemoveCreative,
  onFileNameChange,
  creativeType = "email", // Default to email for backward compatibility
}) => {
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState(0);
  const [isHtmlEditorFullscreen, setIsHtmlEditorFullscreen] = useState(false);
  const [isImagePreviewFullscreen, setIsImagePreviewFullscreen] =
    useState(false);

  const [isSingleCreativeViewOpen, setIsSingleCreativeViewOpen] =
    useState(false);
  const [selectedCreative, setSelectedCreative] = useState<
    MultipleCreativeViewProps["creatives"][0] | null
  >(null);

  const [htmlContent, setHtmlContent] = useState("");

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const currentCreative = creatives[currentCreativeIndex];

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

  // ESC key handler for Save and Continue functionality
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (
      isOpen &&
      currentCreative &&
      (currentCreative.type?.includes("html") ||
        currentCreative.name.toLowerCase().includes(".html"))
    ) {
      console.log("Loading HTML content for HTML creative...");
      fetchHtmlContent();
    }
  }, [isOpen, currentCreative]); 

  const fetchHtmlContent = async () => {
    if (!currentCreative) return;

    try {
      console.log("Fetching HTML content from:", currentCreative.url);

      if ((currentCreative as { embeddedHtml?: string }).embeddedHtml && (currentCreative as { embeddedHtml?: string }).embeddedHtml!.length > 0) {
        console.log("Using embeddedHtml from ZIP analyzer, length:", (currentCreative as { embeddedHtml?: string }).embeddedHtml!.length);
        setHtmlContent((currentCreative as { embeddedHtml?: string }).embeddedHtml!);
        return;
      }

      const encodedFileUrl = encodeURIComponent(currentCreative.url);
      
      let apiUrl = `/api/get-file-content?fileId=${currentCreative.id}&fileUrl=${encodedFileUrl}&processAssets=true`;
      if (currentCreative.uploadId) {
        apiUrl += `&uploadId=${encodeURIComponent(currentCreative.uploadId)}`;
      }
      if ((currentCreative as { embeddedHtml?: string }).embeddedHtml) {
        apiUrl += `&embeddedHtml=${encodeURIComponent((currentCreative as { embeddedHtml?: string }).embeddedHtml!)}`;
      }
      
      const apiResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (apiResponse.ok) {
        const htmlText = await apiResponse.text();
        console.log("HTML content loaded via API, length:", htmlText.length);
        setHtmlContent(htmlText);
        return;
      } else {
        console.log("API response not OK, status:", apiResponse.status);
      }

      console.log("API failed, trying direct URL fetch...");
      const directResponse = await fetch(currentCreative.url, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        mode: "cors",
      });

      if (directResponse.ok) {
        const htmlText = await directResponse.text();
        console.log("HTML content loaded directly, length:", htmlText.length);
        setHtmlContent(htmlText);
      } else {
        console.log("All methods failed, using fallback content");
        setHtmlContent(`<!-- HTML Content Loading Failed -->
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
    </div>
</body>
</html>`);
      }
    } catch (error) {
      console.log("Fetch error, using fallback content...");
      console.error("Error details:", error);
      setHtmlContent(`<!-- HTML Content Loading Failed -->
<!DOCTYPE html>
<html>
<body>
    <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h3>⚠️ Unable to load HTML content</h3>
        <p>Please try refreshing or contact support.</p>
    </div>
</body>
</html>`);
    }
  };

  if (!isOpen) return null;

  const handleSaveHtml = async () => {
    console.log("Saving HTML changes for creative:", currentCreative?.id);
  };

  const toggleHtmlEditorFullscreen = () => {
    setIsHtmlEditorFullscreen(!isHtmlEditorFullscreen);
  };

  const toggleImagePreviewFullscreen = () => {
    setIsImagePreviewFullscreen(!isImagePreviewFullscreen);
  };

  const openSingleCreativeView = (
    creative: MultipleCreativeViewProps["creatives"][0]
  ) => {
    setSelectedCreative(creative);
    setIsSingleCreativeViewOpen(true);
  };

  const closeSingleCreativeView = () => {
    setIsSingleCreativeViewOpen(false);
    setSelectedCreative(null);
  };

  const handleFileNameChangeFromSingle = (
    fileId: string,
    newFileName: string
  ) => {
    const updatedCreatives = creatives.map((creative) =>
      creative.id === fileId ? { ...creative, name: newFileName } : creative
    );

    if (selectedCreative?.id === fileId) {
      setSelectedCreative({ ...selectedCreative, name: newFileName });
    }

    onFileNameChange?.(fileId, newFileName);
  };

  const handleDeleteCreative = async (creative: (typeof creatives)[0]) => {
    if (!confirm(`Are you sure you want to delete "${creative.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(creative.id);

      const ids = new Set<string>();
      ids.add(creative.id);

      if (creative.previewUrl) {
        const previewId = parseIdsFromUrl(creative.previewUrl).id;
        if (previewId) ids.add(previewId);
      }

      await bulkDeleteByIds(Array.from(ids));

      onRemoveCreative?.(creative.id);

      if (currentCreative?.id === creative.id && creatives.length > 1) {
        const currentIndex = creatives.findIndex((c) => c.id === creative.id);
        const nextIndex =
          currentIndex === creatives.length - 1
            ? currentIndex - 1
            : currentIndex + 1;
        setCurrentCreativeIndex(nextIndex);
      }
    } catch (error) {
      console.error("Failed to delete creative:", error);
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header - Single Row Layout */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl shadow-sm flex-shrink-0">
              <FileArchive className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-0.5 sm:mb-1 truncate">
                {zipFileName || "Multiple Creatives"}
              </h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {creatives.length} files
                </span>
                <span className="text-gray-600 text-xs">•</span>
                <span className="text-xs text-gray-600">ZIP Archive</span>
              </div>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            className="px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-150 hover:shadow-md text-xs sm:text-sm flex-shrink-0"
          >
            <span>Save and Continue</span>
          </Button>
        </div>

        {/* Content - Responsive Card Layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-3 sm:p-4 lg:p-6 bg-gray-50 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
              {creatives.map((creative, index) => {
                
                const fileType = getFileType(creative.name);
                const isImage = fileType === "image";
                const isHtml = fileType === "html";

                return (
                  <div
                    key={creative.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden group"
                  >
                    {/* Preview Section */}
                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                      {isImage ? (
                        <ImagePreview
                          src={creative.previewUrl || creative.url}
                          alt={creative.name}
                          fileName={creative.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isHtml ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
                          <div className="text-center">
                            <FileText className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                            <p className="text-xs font-medium text-emerald-700">
                              HTML
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-50">
                          <div className="text-center">
                            <File className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-600">
                              File
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons - Top Right */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                        {/* Delete Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCreative(creative);
                          }}
                          disabled={isDeleting === creative.id}
                          className="h-6 sm:h-7 px-1.5 sm:px-2 bg-white/95 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-medium shadow-sm"
                        >
                          {isDeleting === creative.id ? (
                            <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="hidden sm:inline">Delete</span>
                              <span className="sm:hidden">×</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 sm:p-4">
                      {/* Filename and File Info */}
                      <div className="mb-3">
                        <h3
                          className="font-medium text-gray-900 text-xs sm:text-sm truncate mb-1"
                          title={creative.name}
                        >
                          {creative.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span
                            className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full font-medium text-xs ${
                              isImage
                                ? "bg-blue-50 text-blue-600"
                                : isHtml
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {fileType}
                          </span>
                          <span className="font-medium text-xs">
                            {formatFileSize(creative.size)}
                          </span>
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        onClick={() => {
                          openSingleCreativeView(creative);
                        }}
                        className="w-full bg-blue-400 hover:bg-blue-600 text-white font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm transition-colors duration-200 mb-2"
                      >
                        <span>View Creative</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
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
                  HTML Editor - {currentCreative?.name}
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
                  Exit Fullscreen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveHtml}
                  className="flex items-center gap-2 text-orange-700 border-orange-300 hover:bg-orange-50 hover:text-orange-800 transition-colors flex-1 sm:flex-initial"
                >
                  <FileText className="h-4 w-4" />
                  Save Changes
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

      {/* Fullscreen Image Preview Modal */}
      {isImagePreviewFullscreen &&
        currentCreative &&
        getFileType(currentCreative.name) === "image" &&
        (currentCreative.previewUrl || currentCreative.url) && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] animate-in fade-in duration-200">
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
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
                  {currentCreative?.name}
                </h2>
              </div>

              {/* Fullscreen Image */}
              <div onClick={(e) => e.stopPropagation()}>
                <ImagePreview
                  src={currentCreative?.previewUrl || currentCreative?.url}
                  alt={currentCreative?.name}
                  fileName={currentCreative?.name}
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

      {/* SingleCreativeView Modal */}
      {selectedCreative && (
        <SingleCreativeView
          isOpen={isSingleCreativeViewOpen}
          onClose={closeSingleCreativeView}
          creative={selectedCreative}
          onFileNameChange={handleFileNameChangeFromSingle}
          showAdditionalNotes={true}
          creativeType={creativeType}
        />
      )}
    </div>
  );
};

export default MultipleCreativeView;
