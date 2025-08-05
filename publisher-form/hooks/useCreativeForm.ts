import { useState, useEffect } from "react";
import { CreativeFormData, UploadedFile, MultiCreative, TelegramCheckStatus, TelegramCheckResponse, Priority, UploadType } from "@/types/creative";
import { validateFormData } from "@/utils/validation";
import { fetchOffers, checkTelegramUser, getClaudeSuggestions, saveCreative, saveMultipleCreatives, deleteCreative, submitForm } from "@/services/api";
import { extractCreativeText } from "@/lib/ocrHelpers";
import { uploadToBlob, createCompressedPreview } from "@/lib/uploadHelpers";
import { extractCreativesFromZip, isImageFile, formatFileSize } from "@/utils/fileUtils";

export const useCreativeForm = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<CreativeFormData>({
    affiliateId: "",
    companyName: "",
    firstName: "",
    lastName: "",
    contactEmail: "",
    telegramId: "",
    offerId: "",
    creativeType: "",
    fromLine: "",
    subjectLines: "",
    otherRequest: "",
  });

  const [offers, setOffers] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingLink, setTrackingLink] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewedCreative, setPreviewedCreative] = useState<{
    url: string;
    type?: "image" | "html";
  } | null>(null);
  const [offerSearchTerm, setOfferSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tempFileKey, setTempFileKey] = useState<string | null>(null);
  const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);
  const [isCreativeTypeDropdownOpen, setIsCreativeTypeDropdownOpen] = useState(false);
  const [fromLine, setFromLine] = useState("");
  const [subjectLines, setSubjectLines] = useState("");
  const [modalFromLine, setModalFromLine] = useState("");
  const [modalSubjectLines, setModalSubjectLines] = useState("");
  const [creativeNotes, setCreativeNotes] = useState("");
  const [uploadedCreative, setUploadedCreative] = useState<null | {
    name: string;
    url?: string;
  }>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempFileName, setTempFileName] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [isCodeMaximized, setIsCodeMaximized] = useState(false);
  const [isCodeMinimized, setIsCodeMinimized] = useState(false);
  const [multiCreatives, setMultiCreatives] = useState<MultiCreative[]>([]);
  const [editingCreativeIndex, setEditingCreativeIndex] = useState<number | null>(null);
  const [originalZipFileName, setOriginalZipFileName] = useState<string>("");
  const [savedMultiCreatives, setSavedMultiCreatives] = useState<MultiCreative[]>([]);
  const [isZipProcessing, setIsZipProcessing] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("Moderate");
  const [aiLoading, setAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [telegramCheckStatus, setTelegramCheckStatus] = useState<TelegramCheckStatus>("unchecked");

  // Fetch offers on component mount
  useEffect(() => {
    const loadOffers = async () => {
      const offersData = await fetchOffers();
      setOffers(offersData);
    };
    loadOffers();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'firstName' || field === 'lastName') {
      const filteredValue = value.replace(/[^A-Za-z\s]/g, '');
      setFormData((prev) => ({ ...prev, [field]: filteredValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleTelegramBlur = async () => {
    const cleanUsername = formData.telegramId.trim().replace(/^@/, '');
    
    if (!cleanUsername) {
      setTelegramCheckStatus("unchecked");
      return;
    }

    setTelegramCheckStatus("checking");

    try {
      const data = await checkTelegramUser(cleanUsername);
      console.log("Telegram check response:", data);
      
      if (data.started) {
        setTelegramCheckStatus("ok");
        // Show success message
        if (data.message) {
          console.log("Telegram success:", data.message);
        }
      } else {
        setTelegramCheckStatus("not_started");
        // Show error message
        if (data.message) {
          console.log("Telegram error:", data.message);
        }
      }
    } catch (err) {
      console.error("Telegram check failed", err);
      setTelegramCheckStatus("not_started");
    }
  };

  const enhanceWithClaude = async () => {
    if (!formData.companyName?.trim()) {
      alert('Please enter a Company Name first.');
      return;
    }
    
    if (!formData.offerId?.trim()) {
      alert('Please select an Offer ID first.');
      return;
    }

    if (uploadedFiles.length === 0 && !uploadedCreative) {
      alert('Please upload a creative first so AI can analyze it.');
      return;
    }

    setAiLoading(true);
    try {
      console.log('Starting AI suggestion generation...');
      
      let creativeContent = '';
      if (uploadedFiles.length > 0) {
        creativeContent = await extractCreativeText(uploadedFiles);
      } else if (uploadedCreative?.url) {
        try {
          const response = await fetch(uploadedCreative.url);
          const html = await response.text();
          creativeContent = html.replace(/<[^>]+>/g, " ");
        } catch (error) {
          console.error('Error fetching saved creative content:', error);
          creativeContent = 'Creative content available but could not be extracted';
        }
      }

      console.log('Creative content length:', creativeContent.length);
      console.log('Sending request to Claude API...');

      const data = await getClaudeSuggestions({
        companyName: formData.companyName,
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        notes: formData.otherRequest || '',
        creativeContent: creativeContent || 'No creative content available'
      });

      console.log('Claude API response:', data);

      if (data.suggestions) {
        const suggestions = data.suggestions;
        console.log('Raw suggestions:', suggestions);
        
        const fromLinesMatch = suggestions.match(/From.*?:\s*\n((?:\d+\.\s*[^\n]+\n?)+)/i);
        if (fromLinesMatch) {
          const fromLines = fromLinesMatch[1]
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => line.replace(/^\d+\.\s*/, ''))
            .join('\n');
          setFromLine(fromLines);
          console.log('Extracted From lines:', fromLines);
        } else {
          console.log('No From lines pattern found in suggestions');
        }

        const subjectLinesMatch = suggestions.match(/Subject.*?:\s*\n((?:\d+\.\s*[^\n]+\n?)+)/i);
        if (subjectLinesMatch) {
          const subjectLines = subjectLinesMatch[1]
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string) => line.replace(/^\d+\.\s*/, ''))
            .join('\n');
          setSubjectLines(subjectLines);
          console.log('Extracted Subject lines:', subjectLines);
        } else {
          console.log('No Subject lines pattern found in suggestions');
        }

        if (!fromLinesMatch && !subjectLinesMatch) {
          const numberedLists = suggestions.match(/(\d+\.\s*[^\n]+\n?)+/g);
          if (numberedLists && numberedLists.length >= 2) {
            const firstList = numberedLists[0]
              .split('\n')
              .filter((line: string) => line.trim())
              .map((line: string) => line.replace(/^\d+\.\s*/, ''))
              .join('\n');
            const secondList = numberedLists[1]
              .split('\n')
              .filter((line: string) => line.trim())
              .map((line: string) => line.replace(/^\d+\.\s*/, ''))
              .join('\n');
            
            setFromLine(firstList);
            setSubjectLines(secondList);
            console.log('Extracted lists as From/Subject lines');
          }
        }
      } else {
        console.log('No suggestions in response');
        alert('No AI suggestions were generated. Please try again.');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      alert(`Failed to get AI suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setUploadedFiles([]);
    setUploadedCreative(null);
    setTempFileKey(null);
    setIsUploading(true);

    if (file.name.toLowerCase().endsWith(".zip")) {
      setIsZipProcessing(true);
      setZipError(null);
    }

    try {
      const uploadPromise = uploadToBlob(file);
      
      if (file.type === "text/html" || file.name.toLowerCase().endsWith(".html")) {
        const text = await file.text();
        setHtmlCode(text);

        let processedHtml = text;
        if (!processedHtml.includes("<html")) {
          processedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${processedHtml}</body></html>`;
        }

        const blob = new Blob([processedHtml], { type: "text/html" });
        const htmlUrl = URL.createObjectURL(blob);
        
        const originalUrl = await uploadPromise;
        setUploadedFiles([{ file, previewUrl: htmlUrl, originalUrl, isHtml: true }]);
        setTempFileKey(originalUrl);
      } else if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          const creativesFound = await extractCreativesFromZip(file);

          if (creativesFound.length === 0) {
            setZipError("No valid creatives found in ZIP or nested ZIPs.");
            setIsZipProcessing(false);
            return;
          }

          console.log("ZIP processing results:", creativesFound);

          const originalUrl = await uploadPromise;

          if (uploadType === "multiple") {
            const creatives = creativesFound.map((c, idx) => ({
              id: idx,
              type: c.type,
              imageUrl: c.url,
              fromLine: "",
              subjectLine: "",
              notes: "",
              htmlContent: c.htmlContent || "",
            }));
            setMultiCreatives(creatives);
            setOriginalZipFileName(file.name);
            setTempFileKey(originalUrl);
          } else {
            const firstHtml = creativesFound.find((c) => c.type === "html");
            console.log("First HTML found:", firstHtml);

            if (firstHtml) {
              const htmlContent = firstHtml.htmlContent || "";
              console.log("Processing HTML creative:", {
                hasContent: !!htmlContent,
                contentLength: htmlContent.length,
                containsImages: htmlContent.includes("data:image"),
                containsCSS: htmlContent.includes("<style"),
              });

              const blob = new Blob([htmlContent], { type: "text/html" });
              const htmlBlobUrl = URL.createObjectURL(blob);
              console.log("Created HTML blob URL:", htmlBlobUrl);

              setHtmlCode(htmlContent);
              setUploadedFiles([{ file, previewUrl: htmlBlobUrl, originalUrl, isHtml: true }]);
            } else {
              const firstImg = creativesFound.find((c) => c.type === "image");
              if (firstImg) {
                setUploadedFiles([
                  { file, previewUrl: firstImg.url, originalUrl, isHtml: false },
                ]);
              }
            }
            setTempFileKey(originalUrl);
          }
        } catch (err) {
          console.error("Error processing ZIP file:", err);
          setZipError(
            err instanceof Error
              ? err.message
              : "Unknown error while processing ZIP file"
          );
        }

        setIsZipProcessing(false);
      } else if (isImageFile(file)) {
        const originalUrl = await uploadPromise;
        
        let previewUrl: string;
        if (file.type.startsWith("image/")) {
          const compressed = await createCompressedPreview(file);
          previewUrl = URL.createObjectURL(compressed);
        } else {
          previewUrl = URL.createObjectURL(file);
        }
        setUploadedFiles([{ file, previewUrl, originalUrl, isHtml: false }]);
        setTempFileKey(originalUrl);
      } else {
        const originalUrl = await uploadPromise;
        setUploadedFiles([{ file, previewUrl: null, originalUrl }]);
        setTempFileKey(originalUrl);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload creative. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextStep = () => {
    const newErrors = validateFormData(formData, step);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!uploadedCreative && multiCreatives.length === 0) {
      alert("Please upload at least one creative before submitting.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const creativeUrls = uploadedFiles.map(item => item.originalUrl).filter(Boolean) as string[];
      if (uploadedCreative?.url) {
        creativeUrls.push(uploadedCreative.url);
      }

      const result = await submitForm(formData, creativeUrls, multiCreatives, priority);
      setTrackingLink(result.trackingLink);
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert(
        `An error occurred: ${error instanceof Error ? error.message : "Please try again."}`
      );
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    uploadedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setIsSubmitted(false);
    setStep(1);
    setFormData({
      affiliateId: "",
      companyName: "",
      firstName: "",
      lastName: "",
      contactEmail: "",
      telegramId: "",
      offerId: "",
      creativeType: "",
      fromLine: "",
      subjectLines: "",
      otherRequest: "",
    });
    setUploadedFiles([]);
    setTrackingLink("");
    setErrors({});
  };

  const openModal = (option: string, preserveExisting = false) => {
    setSelectedOption(option);
    if (option === "Single Creative") {
      setUploadType("single");
    } else if (option === "Multiple Creatives") {
      setUploadType("multiple");
    } else {
      setUploadType(null);
    }

    if (option === "From & Subject Lines") {
      setFromLine(formData.fromLine || "");
      setSubjectLines(formData.subjectLines || "");
    }

    if (!preserveExisting && option !== "From & Subject Lines") {
      setUploadedFiles([]);
      setTempFileKey(null);
      setHtmlCode("");
      setIsCodeMaximized(false);
      setIsCodeMinimized(false);

      setMultiCreatives([]);
      setOriginalZipFileName("");
      setEditingCreativeIndex(null);
      setSavedMultiCreatives([]);
      setIsZipProcessing(false);
      setZipError(null);
      setPreviewedCreative(null);
    }

    setModalOpen(true);
  };

  const deleteCreative = async (fileName: string) => {
    try {
      await fetch(`/api/creative/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      });
    } catch (error) {
      console.error("Error deleting creative:", error);
      throw error;
    }
  };

  const closeModal = async () => {
    if (editingCreativeIndex !== null) {
      const updated = [...multiCreatives];

      if (uploadedFiles[0]?.isHtml && htmlCode) {
        updated[editingCreativeIndex] = {
          ...updated[editingCreativeIndex],
          htmlContent: htmlCode,
        };
      } else if (!uploadedFiles[0]?.isHtml && uploadedFiles[0]?.previewUrl) {
        updated[editingCreativeIndex] = {
          ...updated[editingCreativeIndex],
          imageUrl: uploadedFiles[0].previewUrl,
        };
      }

      setMultiCreatives(updated);
      setEditingCreativeIndex(null);
    }

    uploadedFiles.forEach((f) => {
      if (f.previewUrl && f.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });

    if (uploadedFiles.length === 0) {
      setTempFileKey(null);
      setUploadedFiles([]);
      setIsUploading(false);
    }

    setModalOpen(false);
    setSelectedOption("");
    setUploadType(null);
    setIsDragOver(false);

    if (selectedOption !== "From & Subject Lines") {
      setFromLine("");
      setSubjectLines("");
    }
    setCreativeNotes("");
    setIsRenaming(false);
    setTempFileName("");
    setHtmlCode("");
    setIsCodeMaximized(false);
    setIsCodeMinimized(false);

    if (selectedOption !== "From & Subject Lines") {
      setMultiCreatives([]);
      setOriginalZipFileName("");
      setEditingCreativeIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleMultipleCreativesSave = async () => {
    if (multiCreatives.length === 0) {
      alert("Please upload creatives before saving.");
      return;
    }

    if (!formData.offerId || !formData.creativeType) {
      alert("Please select an offer and creative type first.");
      return;
    }

    try {
      const fileUrl = uploadType === "multiple" ? tempFileKey : uploadedFiles[0]?.originalUrl;
      
      console.log("Saving creative with data:", {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        fromLine,
        subjectLines,
        multiCreativesCount: multiCreatives?.length || 0,
        fileUrl,
        uploadType,
        tempFileKey,
        uploadedFilesOriginalUrl: uploadedFiles[0]?.originalUrl
      });

      const creativeData = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        fromLine,
        subjectLines,
        multiCreatives,
        fileUrl,
      };

      const res = await fetch("/api/creative/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeData),
      });

      if (!res.ok) {
        throw new Error("Failed to save creatives");
      }

      setUploadedCreative({
        name:
          originalZipFileName ||
          `Multiple Creatives (${multiCreatives.length} items)`,
        url: multiCreatives[0]?.imageUrl,
      });
      setSavedMultiCreatives([...multiCreatives]);
      setModalOpen(false);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to save creatives");
    }
  };

  const saveCreative = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload a creative before saving.");
      return;
    }

    try {
      const creativeData = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        fromLine: modalFromLine,
        subjectLines: modalSubjectLines,
        notes: creativeNotes,
        fileUrl: tempFileKey,
      };

      const res = await fetch("/api/creative/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeData),
      });

      if (!res.ok) {
        throw new Error("Failed to save creative");
      }

      if (editingCreativeIndex !== null) {
        const updated = [...multiCreatives];

        if (uploadedFiles[0]?.isHtml && htmlCode) {
          updated[editingCreativeIndex] = {
            ...updated[editingCreativeIndex],
            htmlContent: htmlCode,
          };
        } else if (
          !uploadedFiles[0]?.isHtml &&
          uploadedFiles[0]?.previewUrl
        ) {
          updated[editingCreativeIndex] = {
            ...updated[editingCreativeIndex],
            imageUrl: uploadedFiles[0].previewUrl,
          };
        }

        setMultiCreatives(updated);
        setEditingCreativeIndex(null);

        setUploadType("multiple");
        setSelectedOption("Multiple Creatives");
        setUploadedFiles([]);
        setHtmlCode("");
      } else {
        setUploadedCreative({
          name:
            uploadedFiles[0]?.file?.name ||
            "creative.html",
          url: uploadedFiles[0].previewUrl || undefined,
        });

        setModalOpen(false);
        setStep(3);
      }
    } catch (error) {
      console.error("Error saving creative:", error);
      alert("Could not save creative. Please try again.");
    }
  };

  return {
    // State
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
    priority,
    aiLoading,
    isUploading,
    telegramCheckStatus,

    // Setters
    setStep,
    setErrors,
    setFormData,
    setOffers,
    setUploadedFiles,
    setIsSubmitting,
    setIsSubmitted,
    setTrackingLink,
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
    setUploadedCreative,
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
    setPriority,
    setAiLoading,
    setIsUploading,
    setTelegramCheckStatus,

    // Methods
    handleInputChange,
    handleTelegramBlur,
    enhanceWithClaude,
    handleFileSelect,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    handleResetForm,
    openModal,
    closeModal,
    deleteCreative,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMultipleCreativesSave,
    saveCreative,
    formatFileSize,
  };
}; 