"use client";

import React from "react";
import Image from "next/image";
import { useCreativeForm } from "@/hooks/useCreativeForm";
import PersonalDetailsForm from "@/components/forms/PersonalDetailsForm";
import ContactDetailsForm from "@/components/forms/ContactDetailsForm";
import CreativeDetailsForm from "@/components/forms/CreativeDetailsForm";
import SuccessScreen from "@/components/screens/SuccessScreen";
import SingleUploadModal from "@/components/modals/SingleUploadModal";
import MultipleUploadModal from "@/components/modals/MultipleUploadModal";
import CreativeModal from "@/components/modals/CreativeModal";
import FromSubjectModal from "@/components/modals/FromSubjectModal";
import { STEP_LABELS } from "@/constants/creative";

export default function CreativeForm() {
  const {
    step,
    errors,
    formData,
    offers,
    uploadedFiles,
    isSubmitting,
    isSubmitted,
    trackingLink,
    previewImage,
    previewedCreative,
    offerSearchTerm,
    modalOpen,
    selectedOption,
    uploadType,
    isDragOver,
    tempFileKey,
    isOfferDropdownOpen,
    isCreativeTypeDropdownOpen,
    fromLine,
    subjectLines,
    modalFromLine,
    modalSubjectLines,
    creativeNotes,
    priority,
    uploadedCreative,
    isRenaming,
    tempFileName,
    htmlCode,
    isCodeMaximized,
    isCodeMinimized,
    multiCreatives,
    editingCreativeIndex,
    originalZipFileName,
    savedMultiCreatives,
    isZipProcessing,
    zipError,
    aiLoading,
    isUploading,
    telegramCheckStatus,
    handleInputChange,
    handleTelegramBlur,
    enhanceWithClaude,
    handleFileSelect,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    handleResetForm,
    setPreviewImage,
    setPreviewedCreative,
    setOfferSearchTerm,
    setModalOpen,
    setSelectedOption,
    setUploadType,
    setIsDragOver,
    setTempFileKey,
    setIsOfferDropdownOpen,
    setIsCreativeTypeDropdownOpen,
    setFromLine,
    setSubjectLines,
    setModalFromLine,
    setModalSubjectLines,
    setCreativeNotes,
    setPriority,
    setIsRenaming,
    setTempFileName,
    setHtmlCode,
    setIsCodeMaximized,
    setIsCodeMinimized,
    setMultiCreatives,
    setEditingCreativeIndex,
    setOriginalZipFileName,
    setSavedMultiCreatives,
    setIsZipProcessing,
    setZipError,
    setAiLoading,
    setIsUploading,
    setTelegramCheckStatus,
    setUploadedFiles,
    setUploadedCreative,
    openModal,
    closeModal,
    deleteCreative,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMultipleCreativesSave,
    saveCreative,
  } = useCreativeForm();

  if (isSubmitted) {
    return (
      <SuccessScreen
        trackingLink={trackingLink}
        handleResetForm={handleResetForm}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-12 animate-fade-in"
      style={{
        backgroundImage: "url('/images/Step 1.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <div className="mb-6 sm:mb-8 animate-slide-down">
        <Image
          src="/images/logo.svg"
          alt="Big Drops Marketing Group"
          width={48}
          height={48}
          className="h-10 sm:h-12 w-auto transition-transform hover:scale-105 duration-300"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-3xl p-4 sm:p-8 animate-slide-up hover:shadow-xl transition-all duration-500">
        <h1 className="font-sans text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-snug animate-fade-in-delay">
          Submit Your Creatives For Approval Sami Changed
        </h1>

        <p className="font-sans text-base sm:text-lg text-gray-600 mb-5 sm:mb-6 leading-relaxed animate-fade-in-delay-2">
          Upload your static images or HTML creatives with offer details to
          begin the approval process. Our team will review and notify you
          shortly.
        </p>

        <p className="font-sans text-base sm:text-lg font-semibold text-sky-500 mb-4 sm:mb-6 animate-fade-in-delay-3">
          Step {step} of 3: {STEP_LABELS[step as keyof typeof STEP_LABELS]}
        </p>

        <div
          className="w-full mb-6 animate-fade-in-delay-3"
          style={{
            borderBottom: "1px solid #BFE5FA",
            marginTop: "24px",
          }}
        ></div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {step === 1 && (
            <PersonalDetailsForm
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
            />
          )}

          {step === 2 && (
            <ContactDetailsForm
              formData={formData}
              errors={errors}
              telegramCheckStatus={telegramCheckStatus}
              handleInputChange={handleInputChange}
              handleTelegramBlur={handleTelegramBlur}
            />
          )}

          {step === 3 && (
            <CreativeDetailsForm
              formData={formData}
              errors={errors}
              offers={offers}
              offerSearchTerm={offerSearchTerm}
              isOfferDropdownOpen={isOfferDropdownOpen}
              isCreativeTypeDropdownOpen={isCreativeTypeDropdownOpen}
              priority={priority}
              uploadedCreative={uploadedCreative}
              savedMultiCreatives={savedMultiCreatives}
              handleInputChange={handleInputChange}
              setOfferSearchTerm={setOfferSearchTerm}
              setIsOfferDropdownOpen={setIsOfferDropdownOpen}
              setIsCreativeTypeDropdownOpen={setIsCreativeTypeDropdownOpen}
              setPriority={setPriority}
              openModal={openModal}
              setUploadType={setUploadType}
              setMultiCreatives={setMultiCreatives}
              setUploadedFiles={setUploadedFiles}
              setUploadedCreative={setUploadedCreative}
              setTempFileKey={setTempFileKey}
              deleteCreative={deleteCreative}
            />
          )}

          <div className="flex flex-col sm:flex-row justify-between pt-4 gap-4 sm:gap-0 animate-fade-in-delay-4">
            {step === 1 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full h-14 bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-sky-200 transition-all duration-300 active:scale-95"
              >
                Save & Add Contact Details
              </button>
            )}
            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto h-14 px-6 border border-sky-400 text-sky-500 font-sans font-semibold rounded-lg hover:bg-sky-50 transition-all duration-300 active:scale-95"
                >
                  Edit Personal Details
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto h-14 px-6 bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-sky-200 transition-all duration-300 active:scale-95"
                >
                  Save & Add Contact Details
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto h-12 sm:h-14 px-4 sm:px-6 border border-sky-400 rounded-lg font-sans text-sm sm:text-base font-medium text-sky-500 bg-sky-50 hover:bg-sky-100 transition-all duration-300 hover:border-sky-500 hover:shadow-md active:scale-95"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-12 sm:h-14 px-4 sm:px-6 bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans text-sm sm:text-base font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-sky-200 transition-all duration-300 disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">
                        Submitting...
                      </span>
                    </div>
                  ) : (
                    "Submit Creative"
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => {
            setPreviewImage(null);
            setPreviewedCreative(null);
          }}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {previewedCreative?.type === "html" || uploadedFiles[0]?.isHtml ? (
              <iframe
                src={previewImage}
                className="w-[90vw] h-[90vh] border-0 bg-white rounded-md shadow-lg"
                title="HTML Full Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            ) : (
              <Image
                src={previewImage}
                alt="Full Preview"
                width={1200}
                height={900}
                className="h-auto w-auto max-h-[85vh] max-w-[85vw] rounded-md shadow-lg object-contain bg-gray-50 p-4"
              />
            )}

            <button
              onClick={() => {
                setPreviewImage(null);
                setPreviewedCreative(null);
              }}
              className="absolute -top-3 -right-3 text-white bg-red-600 hover:bg-red-700 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Close preview"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-6xl h-auto lg:h-[90vh] overflow-y-auto relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-sans">
                {uploadType === "single" && "Upload Single Creative"}
                {uploadType === "multiple" && "Upload Multiple Creatives"}
                {!uploadType && selectedOption}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                  title="Close"
                >
                  ✖
                </button>
              </div>
            </div>

            {(uploadType === "single" || uploadType === "multiple") && (
              <>
                {uploadType === "single" && uploadedFiles.length > 0 ? (
                  <SingleUploadModal
                    uploadedFiles={uploadedFiles}
                    htmlCode={htmlCode}
                    isCodeMaximized={isCodeMaximized}
                    isCodeMinimized={isCodeMinimized}
                    isRenaming={isRenaming}
                    tempFileName={tempFileName}
                    creativeNotes={creativeNotes}
                    modalFromLine={modalFromLine}
                    modalSubjectLines={modalSubjectLines}
                    previewImage={previewImage}
                    setPreviewImage={setPreviewImage}
                    setHtmlCode={setHtmlCode}
                    setIsCodeMaximized={setIsCodeMaximized}
                    setIsCodeMinimized={setIsCodeMinimized}
                    setIsRenaming={setIsRenaming}
                    setTempFileName={setTempFileName}
                    setCreativeNotes={setCreativeNotes}
                    setModalFromLine={setModalFromLine}
                    setModalSubjectLines={setModalSubjectLines}
                    setUploadedFiles={setUploadedFiles}
                    handleFileSelect={handleFileSelect}
                    openModal={openModal}
                    closeModal={closeModal}
                    saveCreative={saveCreative}
                  />
                ) : uploadType === "multiple" && multiCreatives.length > 0 ? (
                  <MultipleUploadModal
                    multiCreatives={multiCreatives}
                    isZipProcessing={isZipProcessing}
                    zipError={zipError}
                    isDragOver={isDragOver}
                    isUploading={isUploading}
                    previewImage={previewImage}
                    previewedCreative={previewedCreative}
                    setPreviewImage={setPreviewImage}
                    setPreviewedCreative={setPreviewedCreative}
                    setMultiCreatives={setMultiCreatives}
                    handleFileSelect={handleFileSelect}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                    handleMultipleCreativesSave={handleMultipleCreativesSave}
                  />
                ) : (
                  <CreativeModal
                    uploadedFiles={uploadedFiles}
                    isDragOver={isDragOver}
                    isUploading={isUploading}
                    handleFileSelect={handleFileSelect}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                  />
                )}
              </>
            )}

            {!uploadType && selectedOption === "From & Subject Lines" && (
              <FromSubjectModal
                fromLine={fromLine}
                subjectLines={subjectLines}
                aiLoading={aiLoading}
                setFromLine={setFromLine}
                setSubjectLines={setSubjectLines}
                enhanceWithClaude={enhanceWithClaude}
                closeModal={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
} 