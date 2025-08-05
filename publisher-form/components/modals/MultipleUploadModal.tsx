"use client";

import React from "react";
import Image from "next/image";
import { UploadedFile, MultiCreative } from "@/types/creative";

interface MultipleUploadModalProps {
  multiCreatives: MultiCreative[];
  isZipProcessing: boolean;
  zipError: string | null;
  isDragOver: boolean;
  isUploading: boolean;
  previewImage: string | null;
  previewedCreative: { url: string; type?: "image" | "html" } | null;
  setPreviewImage: (url: string | null) => void;
  setPreviewedCreative: (creative: { url: string; type?: "image" | "html" } | null) => void;
  setMultiCreatives: (creatives: MultiCreative[]) => void;
  handleFileSelect: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleMultipleCreativesSave: () => void;
}

export default function MultipleUploadModal({
  multiCreatives,
  isZipProcessing,
  zipError,
  isDragOver,
  isUploading,
  previewImage,
  previewedCreative,
  setPreviewImage,
  setPreviewedCreative,
  setMultiCreatives,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleMultipleCreativesSave,
}: MultipleUploadModalProps) {
  return (
    <div className="w-full">
      {multiCreatives.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mt-6">
          {multiCreatives.map((creative, idx) => (
            <div
              key={creative.id}
              className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="relative group w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                {creative.type === "html" ? (
                  <iframe
                    src={creative.imageUrl}
                    title={`Creative-${idx + 1}`}
                    className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-300"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    onError={(e) => {
                      console.error("Creative iframe load error:", e);
                    }}
                  />
                ) : (
                  <Image
                    src={creative.imageUrl}
                    alt={`Creative ${idx + 1}`}
                    width={400}
                    height={300}
                    className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <button
                  onClick={() => {
                    setPreviewImage(creative.imageUrl);
                    setPreviewedCreative({
                      url: creative.imageUrl,
                      type: creative.type,
                    });
                  }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-medium"
                >
                  Preview
                </button>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p className="font-semibold text-gray-800 truncate">{`Creative-${idx + 1}`}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Type: {creative.type === "html" ? "HTML" : "Image"}
                </p>
              </div>

              <div className="p-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() =>
                    setMultiCreatives(
                      multiCreatives.filter((c) => c.id !== creative.id)
                    )
                  }
                  className="flex-1 border border-red-400 text-red-500 text-sm rounded-lg py-1 hover:bg-red-50 transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {isZipProcessing && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
              <p className="text-gray-600 font-medium">
                Processing ZIP file...
              </p>
            </div>
          )}

          {zipError && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-3 rounded-lg mt-4">
              <strong>Error:</strong> {zipError}
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center
            px-8 py-24 sm:px-20 sm:py-32 min-h-[80vh] w-full max-w-full mx-auto text-center cursor-pointer 
            transition-all duration-300 ${
              isDragOver
                ? "border-sky-400 bg-sky-50"
                : "border-gray-300 bg-gray-50 hover:border-sky-400"
            } ${(isZipProcessing || isUploading) ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() =>
              !isZipProcessing && !isUploading &&
              document.getElementById("file-upload")?.click()
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="w-36 h-36 mb-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500"></div>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-36 h-36 mb-10 transition-colors duration-300 ${
                  isDragOver ? "text-sky-500" : "text-gray-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4m0 0l-4 4m4-4v12"
                />
              </svg>
            )}
            <p
              className={`font-sans text-3xl transition-colors duration-300 ${
                isDragOver ? "text-sky-600" : "text-gray-600"
              }`}
            >
              {isUploading
                ? "Uploading your creative..."
                : isDragOver
                ? "Drop your files here"
                : "Click here to upload your Creative"}
            </p>
            <p className="text-xl text-gray-400 mt-6 font-sans">
              Accepted Files: PNG, JPG, JPEG, HTML, ZIP
            </p>
            <p className="text-lg text-gray-400 font-sans">
              or drag and drop files here
            </p>
            <input
              id="file-upload"
              type="file"
              multiple={true}
              className="hidden"
              accept=".png,.jpg,.jpeg,.html,.zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              }}
            />
          </div>
        </>
      )}

      {multiCreatives.length > 0 && (
        <button
          onClick={handleMultipleCreativesSave}
          className="mt-6 w-full bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
        >
          Save All Creatives & Continue
        </button>
      )}
    </div>
  );
} 