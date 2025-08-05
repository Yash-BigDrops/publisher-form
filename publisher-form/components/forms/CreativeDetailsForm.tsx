"use client";

import React from "react";
import { CreativeFormData, Priority, MultiCreative, UploadedFile } from "@/types/creative";
import { ChevronDown, File, FileArchive } from "lucide-react";
import { CREATIVE_TYPES } from "@/constants/creative";

interface CreativeDetailsFormProps {
  formData: CreativeFormData;
  errors: { [key: string]: string };
  offers: string[];
  offerSearchTerm: string;
  isOfferDropdownOpen: boolean;
  isCreativeTypeDropdownOpen: boolean;
  priority: Priority;
  uploadedCreative: null | { name: string; url?: string };
  savedMultiCreatives: MultiCreative[];
  handleInputChange: (field: string, value: string) => void;
  setOfferSearchTerm: (term: string) => void;
  setIsOfferDropdownOpen: (open: boolean) => void;
  setIsCreativeTypeDropdownOpen: (open: boolean) => void;
  setPriority: (priority: Priority) => void;
  openModal: (option: string, preserveExisting?: boolean) => void;
  setUploadType: (type: "single" | "multiple" | null) => void;
  setMultiCreatives: (creatives: MultiCreative[]) => void;
  setUploadedFiles: (files: UploadedFile[]) => void;
  setUploadedCreative: (creative: null | { name: string; url?: string }) => void;
  setTempFileKey: (key: string | null) => void;
  deleteCreative: (fileName: string) => void;
}

export default function CreativeDetailsForm({
  formData,
  errors,
  offers,
  offerSearchTerm,
  isOfferDropdownOpen,
  isCreativeTypeDropdownOpen,
  priority,
  uploadedCreative,
  savedMultiCreatives,
  handleInputChange,
  setOfferSearchTerm,
  setIsOfferDropdownOpen,
  setIsCreativeTypeDropdownOpen,
  setPriority,
  openModal,
  setUploadType,
  setMultiCreatives,
  setUploadedFiles,
  setUploadedCreative,
  setTempFileKey,
  deleteCreative,
}: CreativeDetailsFormProps) {
  return (
    <>
      <div className="animate-fade-in relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Type to search offers..."
            value={offerSearchTerm || formData.offerId}
            onChange={(e) => {
              setOfferSearchTerm(e.target.value);
              if (!e.target.value) {
                handleInputChange("offerId", "");
              }
            }}
            onFocus={() => setIsOfferDropdownOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsOfferDropdownOpen(false), 200);
            }}
            className={`w-full h-12 sm:h-14 border rounded-lg pl-3 sm:pl-4 pr-8 sm:pr-10 font-sans text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 mb-4 ${
              errors.offerId ? "border-red-500" : "border-gray-300"
            }`}
          />

          <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown
              className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 ${isOfferDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {isOfferDropdownOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 sm:max-h-60 overflow-y-auto z-50 animate-scale-in">
            <div className="p-1 sm:p-2">
              {offers.length === 0 ? (
                <div className="flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 text-gray-500 font-sans">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    Loading offers...
                  </span>
                </div>
              ) : (
                <>
                  {offers
                    .filter((offerId: string) =>
                      offerId
                        .toLowerCase()
                        .includes(offerSearchTerm.toLowerCase())
                    )
                    .map((offerId: string, index: number) => (
                      <div
                        key={offerId}
                        className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 cursor-pointer font-sans rounded-lg mx-1 transition-all duration-200 hover:shadow-sm hover:scale-[1.02] group"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => {
                          handleInputChange("offerId", offerId);
                          setOfferSearchTerm("");
                          setIsOfferDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm sm:text-base text-gray-700 group-hover:text-sky-700 font-medium transition-colors duration-200">
                            Offer ID: {offerId}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {offers.filter((offerId: string) =>
                    offerId
                      .toLowerCase()
                      .includes(offerSearchTerm.toLowerCase())
                  ).length === 0 &&
                    offerSearchTerm && (
                      <div className="flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 text-gray-500 font-sans">
                        <div className="text-center">
                          <div className="text-3xl sm:text-4xl mb-2">
                            🔍
                          </div>
                          <div className="text-xs sm:text-sm">
                            No offers found matching
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            &quot;{offerSearchTerm}&quot;
                          </div>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        )}

        {errors.offerId && (
          <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fade-in">
            {errors.offerId}
          </p>
        )}
      </div>

      <div className="animate-fade-in-delay relative z-20">
        <div className="relative">
          <div
            onClick={() =>
              setIsCreativeTypeDropdownOpen(!isCreativeTypeDropdownOpen)
            }
            className={`w-full h-12 sm:h-14 border rounded-lg px-3 sm:px-4 font-sans text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 mb-6 cursor-pointer bg-white shadow-md hover:shadow-lg flex items-center justify-between group ${
              errors.creativeType ? "border-red-500" : "border-gray-300"
            }`}
          >
            <span
              className={
                formData.creativeType
                  ? "text-gray-900 font-medium"
                  : "text-gray-400"
              }
            >
              {formData.creativeType || "Select creative type"}
            </span>
            <ChevronDown
              className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-all duration-300 group-hover:text-sky-500 ${isCreativeTypeDropdownOpen ? "rotate-180 text-sky-500" : ""}`}
            />
          </div>
        </div>

        {isCreativeTypeDropdownOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 sm:max-h-60 overflow-y-auto z-50 animate-scale-in">
            <div className="p-1 sm:p-2">
              {CREATIVE_TYPES.map((type, index) => (
                <div
                  key={type}
                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 cursor-pointer font-sans rounded-lg mx-1 transition-all duration-200 hover:shadow-sm hover:scale-[1.02] group"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    handleInputChange(
                      "creativeType",
                      type.toLowerCase()
                    );
                    setIsCreativeTypeDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-gray-700 group-hover:text-sky-700 font-medium transition-colors duration-200">
                      {type}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.creativeType && (
          <p className="text-red-500 text-xs sm:text-sm mt-1 animate-fade-in">
            {errors.creativeType}
          </p>
        )}
      </div>

      {uploadedCreative ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50 gap-3 sm:gap-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700 font-sans">
                Creative Uploaded
              </p>
              <p className="text-sm text-gray-600 font-sans truncate">
                {uploadedCreative.name}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {savedMultiCreatives.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    openModal("Multiple Creatives", true);
                    setUploadType("multiple");
                    setMultiCreatives([...savedMultiCreatives]);
                  }}
                  className="px-3 py-1 text-sm border border-yellow-400 text-yellow-700 rounded bg-yellow-50 hover:bg-yellow-100 font-sans transition-all duration-300"
                >
                  Edit
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  openModal("Single Creative", true);
                  setUploadType("single");
                }}
                className="px-3 py-1 text-sm border border-sky-400 text-sky-700 rounded bg-sky-50 hover:bg-sky-100 font-sans transition-all duration-300"
              >
                Edit
              </button>

                             <button
                 type="button"
                 onClick={() => {
                   setTempFileKey(null);
                   deleteCreative(uploadedCreative.name);
                 }}
                 className="px-3 py-1 text-sm border border-red-400 text-red-700 rounded bg-red-50 hover:bg-red-100 font-sans transition-all duration-300"
               >
                 Remove
               </button>
            </div>
          </div>

          {(savedMultiCreatives.length > 0 || uploadedCreative) && formData.creativeType.toLowerCase() === "email" && (
            <button
              type="button"
              onClick={() => openModal("From & Subject Lines")}
              className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg 
                         hover:border-sky-400 hover:bg-sky-50 transition-all duration-300 font-sans text-sm sm:text-base text-gray-800"
            >
              <FileArchive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <span>From & Subject Lines</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 animate-fade-in-delay-2">
          <button
            type="button"
            onClick={() => openModal("Single Creative")}
            className="flex-1 h-12 sm:h-14 border border-gray-300 rounded-lg px-3 sm:px-4 flex items-center justify-center gap-2 hover:bg-sky-50 transition-all duration-300 hover:border-sky-300"
          >
            <File className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <span className="text-sm sm:text-base">
              Single Creative
            </span>
          </button>
          <button
            type="button"
            onClick={() => openModal("Multiple Creatives")}
            className="flex-1 h-12 sm:h-14 border border-gray-300 rounded-lg px-3 sm:px-4 flex items-center justify-center gap-2 hover:bg-sky-50 transition-all duration-300 hover:border-sky-300"
          >
            <FileArchive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <span className="text-sm sm:text-base">
              Multiple Creatives
            </span>
          </button>
          {formData.creativeType.toLowerCase() === "email" && (
            <button
              type="button"
              onClick={() => openModal("From & Subject Lines")}
              className="flex-1 h-12 sm:h-14 border border-gray-300 rounded-lg px-3 sm:px-4 flex items-center justify-center gap-2 hover:bg-sky-50 transition-all duration-300 hover:border-sky-300"
            >
              <FileArchive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <span className="text-sm sm:text-base">
                From & Subject Lines
              </span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-6 animate-fade-in-delay-2">
        <span className="font-sans font-medium text-gray-700">
          Set Priority:
        </span>
        <div className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <button
            type="button"
            className={`px-4 py-2 relative overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${
              priority === "High"
                ? "bg-sky-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setPriority("High")}
          >
            <span className="relative z-10 font-medium">High</span>
            {priority === "High" && (
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-600 animate-pulse opacity-20"></div>
            )}
          </button>
          <button
            type="button"
            className={`px-4 py-2 relative overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 ${
              priority === "Moderate"
                ? "bg-sky-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setPriority("Moderate")}
          >
            <span className="relative z-10 font-medium">Moderate</span>
            {priority === "Moderate" && (
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-600 animate-pulse opacity-20"></div>
            )}
          </button>
        </div>
      </div>

      <div className="animate-fade-in-delay-3">
        <textarea
          placeholder="Additional Notes for Client"
          value={formData.otherRequest}
          onChange={(e) =>
            handleInputChange("otherRequest", e.target.value)
          }
          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 min-h-[100px] font-sans text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 mb-6 resize-none"
        />
      </div>
    </>
  );
} 