"use client";

import React from "react";
import Image from "next/image";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import { UploadedFile } from "@/types/creative";
import { formatFileSize } from "@/utils/fileUtils";

interface SingleUploadModalProps {
  uploadedFiles: UploadedFile[];
  htmlCode: string;
  isCodeMaximized: boolean;
  isCodeMinimized: boolean;
  isRenaming: boolean;
  tempFileName: string;
  creativeNotes: string;
  modalFromLine: string;
  modalSubjectLines: string;
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
  setHtmlCode: (code: string) => void;
  setIsCodeMaximized: (maximized: boolean) => void;
  setIsCodeMinimized: (minimized: boolean) => void;
  setIsRenaming: (renaming: boolean) => void;
  setTempFileName: (name: string) => void;
  setCreativeNotes: (notes: string) => void;
  setModalFromLine: (line: string) => void;
  setModalSubjectLines: (lines: string) => void;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  handleFileSelect: (file: File) => void;
  openModal: (option: string) => void;
  closeModal: () => void;
  saveCreative: () => void;
}

export default function SingleUploadModal({
  uploadedFiles,
  htmlCode,
  isCodeMaximized,
  isCodeMinimized,
  isRenaming,
  tempFileName,
  creativeNotes,
  modalFromLine,
  modalSubjectLines,
  previewImage,
  setPreviewImage,
  setHtmlCode,
  setIsCodeMaximized,
  setIsCodeMinimized,
  setIsRenaming,
  setTempFileName,
  setCreativeNotes,
  setModalFromLine,
  setModalSubjectLines,
  setUploadedFiles,
  handleFileSelect,
  openModal,
  closeModal,
  saveCreative,
}: SingleUploadModalProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-7/12 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-2 max-h-[90vh] relative">
        {uploadedFiles[0]?.previewUrl ? (
          <div className="relative group w-full h-full">
            <button
              onClick={() => setPreviewImage(uploadedFiles[0].previewUrl || "")}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 z-30"
              title="Maximize"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 16v4h-4M4 16v4h4M20 8V4h-4" />
              </svg>
            </button>
            
            <div className="w-full h-full overflow-auto">
              {uploadedFiles[0].isHtml ? (
                <iframe
                  src={uploadedFiles[0].previewUrl || ""}
                  className="w-[95%] min-h-[900px] border-0 bg-white mx-auto"
                  sandbox="allow-scripts allow-same-origin"
                  title="HTML Creative Preview"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={uploadedFiles[0].previewUrl || ""}
                    alt="Uploaded Creative"
                    width={800}
                    height={600}
                    className="max-h-full w-auto object-contain"
                  />

                  {uploadedFiles[0].zipImages &&
                    uploadedFiles[0].zipImages.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const currentIndex =
                              uploadedFiles[0].currentImageIndex || 0;
                            const newIndex =
                              currentIndex > 0
                                ? currentIndex - 1
                                : uploadedFiles[0].zipImages!.length - 1;
                            setUploadedFiles([
                              {
                                ...uploadedFiles[0],
                                previewUrl:
                                  uploadedFiles[0].zipImages![newIndex],
                                currentImageIndex: newIndex,
                              },
                            ]);
                          }}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
                          aria-label="Previous image"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => {
                            const currentIndex =
                              uploadedFiles[0].currentImageIndex || 0;
                            const newIndex =
                              currentIndex <
                              uploadedFiles[0].zipImages!.length - 1
                                ? currentIndex + 1
                                : 0;
                            setUploadedFiles([
                              {
                                ...uploadedFiles[0],
                                previewUrl:
                                  uploadedFiles[0].zipImages![newIndex],
                                currentImageIndex: newIndex,
                              },
                            ]);
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10"
                          aria-label="Next image"
                        >
                          →
                        </button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
                          {(uploadedFiles[0].currentImageIndex || 0) + 1}{" "}
                          / {uploadedFiles[0].zipImages!.length}
                        </div>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-sans">
                {uploadedFiles[0]?.file?.name?.endsWith(".zip")
                  ? "ZIP File Uploaded"
                  : "File Uploaded"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="lg:w-7/12 flex flex-col justify-between bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-full">
        <div>
          <h3 className="text-lg font-semibold mb-3 font-sans">
            File Details
          </h3>
          <p className="text-sm mb-1 flex items-center">
            <strong>Name:</strong>
            {isRenaming ? (
              <input
                type="text"
                value={tempFileName}
                onChange={(e) => setTempFileName(e.target.value)}
                onBlur={() => {
                  const currentDisplayName = uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html";
                  if (tempFileName !== currentDisplayName) {
                    setUploadedFiles((prev) =>
                      prev.map((file) => ({
                        ...file,
                        displayName: tempFileName,
                      }))
                    );
                  }
                  setIsRenaming(false);
                  setTempFileName("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const currentDisplayName = uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html";
                    if (tempFileName !== currentDisplayName) {
                      setUploadedFiles((prev) =>
                        prev.map((file) => ({
                          ...file,
                          displayName: tempFileName,
                        }))
                      );
                    }
                    setIsRenaming(false);
                    setTempFileName("");
                  }
                }}
                className="ml-2 border border-gray-300 rounded px-1 py-0.5 text-sm font-sans"
                autoFocus
              />
            ) : (
              <span
                className="ml-2 cursor-pointer text-gray-700 hover:underline font-sans"
                onClick={() => {
                  setTempFileName(
                    uploadedFiles[0]?.displayName ||
                    uploadedFiles[0]?.file?.name ||
                      "creative.html"
                  );
                  setIsRenaming(true);
                }}
              >
                {uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html"}
              </span>
            )}

            {!isRenaming ? (
              <button
                type="button"
                onClick={() => {
                  setTempFileName(
                    uploadedFiles[0]?.displayName ||
                    uploadedFiles[0]?.file?.name ||
                      "creative.html"
                  );
                  setIsRenaming(true);
                }}
                className="ml-3 text-sky-500 hover:text-sky-600 font-sans"
              >
                Edit
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  const currentTempFileName = tempFileName;
                  
                  const currentDisplayName = uploadedFiles[0]?.displayName || uploadedFiles[0]?.file?.name || "creative.html";
                  if (currentTempFileName !== currentDisplayName) {
                    setUploadedFiles((prev) =>
                      prev.map((file) => ({
                        ...file,
                        displayName: currentTempFileName,
                      }))
                    );
                  }
                  
                  setIsRenaming(false);
                  setTempFileName("");
                }}
                className="ml-3 text-green-600 hover:text-green-700 font-sans font-medium relative z-30"
              >
                Done
              </button>
            )}
          </p>
          <p className="text-sm mb-1">
            <strong>Size:</strong>{" "}
            {uploadedFiles[0]?.file?.size
              ? formatFileSize(uploadedFiles[0].file.size)
              : "Unknown"}
          </p>
          <p className="text-sm mb-4">
            <strong>Type:</strong>{" "}
            {uploadedFiles[0]?.isHtml
              ? "HTML"
              : uploadedFiles[0]?.file?.type?.toUpperCase() ||
                uploadedFiles[0]?.file?.name
                  ?.split(".")
                  .pop()
                  ?.toUpperCase() ||
                "IMAGE"}
          </p>

          <input
            id="modal-file-upload"
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.html,.zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
          />

          <hr className="my-4 border-gray-200" />

          {uploadedFiles[0]?.isHtml && (
            <div className="mb-6 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold font-sans">
                  HTML Code
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCodeMinimized(!isCodeMinimized);
                      setIsCodeMaximized(false);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                    title={isCodeMinimized ? "Restore" : "Minimize"}
                  >
                    {isCodeMinimized ? "▢" : "▁"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCodeMaximized(!isCodeMaximized);
                      setIsCodeMinimized(false);
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                    title={isCodeMaximized ? "Exit Fullscreen" : "Maximize"}
                  >
                    ⤡
                  </button>
                </div>
              </div>

              {!isCodeMinimized &&
                (isCodeMaximized ? (
                  <div className="fixed inset-0 z-[9999] bg-black bg-opacity-60 flex flex-col">
                    <div className="flex justify-between items-center bg-white px-4 py-2 border-b border-gray-200 shadow-md">
                      <h3 className="text-lg font-semibold font-sans">
                        HTML Code (Fullscreen)
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCodeMaximized(false);
                            setIsCodeMinimized(true);
                          }}
                          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                          title="Minimize to small view"
                        >
                          ▁
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCodeMaximized(false)}
                          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                          title="Exit Fullscreen"
                        >
                          ⤢
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 bg-white p-4">
                      <AceEditor
                        mode="html"
                        theme="github"
                        name="htmlEditorFullscreen"
                        value={htmlCode}
                        onChange={(newCode) => {
                          setHtmlCode(newCode);
                          const blob = new Blob([newCode], {
                            type: "text/html",
                          });
                          const updatedUrl = URL.createObjectURL(blob);
                          setUploadedFiles((prev) => {
                            if (prev[0]?.previewUrl) {
                              URL.revokeObjectURL(prev[0].previewUrl);
                            }
                            return [
                              {
                                ...prev[0],
                                previewUrl: updatedUrl,
                              },
                            ];
                          });
                        }}
                        width="100%"
                        height="100%"
                        fontSize={14}
                        setOptions={{
                          useWorker: false,
                          tabSize: 2,
                          wrap: true,
                        }}
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <AceEditor
                      mode="html"
                      theme="github"
                      name="htmlEditor"
                      value={htmlCode}
                      onChange={(newCode) => {
                        setHtmlCode(newCode);
                        const blob = new Blob([newCode], {
                          type: "text/html",
                        });
                        const updatedUrl = URL.createObjectURL(blob);
                        setUploadedFiles((prev) => {
                          if (prev[0]?.previewUrl) {
                            URL.revokeObjectURL(prev[0].previewUrl);
                          }
                          return [
                            {
                              ...prev[0],
                              previewUrl: updatedUrl,
                            },
                          ];
                        });
                      }}
                      width="100%"
                      height={isCodeMinimized ? "100px" : "300px"}
                      fontSize={14}
                      setOptions={{
                        useWorker: false,
                        tabSize: 2,
                        wrap: true,
                      }}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                      }}
                    />
                  </div>
                ))}
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3 font-sans">
            Creative Specific Details
          </h3>
          
          <button
            type="button"
            onClick={() => openModal("From & Subject Lines")}
            className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg 
                       hover:border-sky-400 hover:bg-sky-50 transition-all duration-300 font-sans text-sm sm:text-base text-gray-800 mb-6"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span>From & Subject Lines</span>
          </button>

          <h3 className="text-lg font-semibold mb-3 font-sans">
            Any Notes For This Creative
          </h3>
          <textarea
            placeholder="Type your notes here..."
            value={creativeNotes}
            onChange={(e) => setCreativeNotes(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 min-h-[100px] w-full font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none mb-6"
          />
        </div>

        <button
          onClick={saveCreative}
          className="mt-6 w-full bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
} 