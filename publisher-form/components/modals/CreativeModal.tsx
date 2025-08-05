"use client";

import React from "react";
import Image from "next/image";
import { UploadedFile } from "@/types/creative";

interface CreativeModalProps {
  uploadedFiles: UploadedFile[];
  isDragOver: boolean;
  isUploading: boolean;
  handleFileSelect: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export default function CreativeModal({
  uploadedFiles,
  isDragOver,
  isUploading,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: CreativeModalProps) {
  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center
        px-8 py-24 sm:px-20 sm:py-32 min-h-[80vh] w-full max-w-full mx-auto text-center cursor-pointer 
        transition-all duration-300 ${
          isDragOver
            ? "border-sky-400 bg-sky-50"
            : "border-gray-300 bg-gray-50 hover:border-sky-400"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() =>
          !isUploading &&
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
    </div>
  );
} 