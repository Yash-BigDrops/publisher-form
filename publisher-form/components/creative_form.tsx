"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  RotateCw,
  File,
  FileArchive,
  Search,
  ChevronDown,
} from "lucide-react";
import JSZip from "jszip";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import { uploadToBlob, createCompressedPreview } from "@/lib/uploadHelpers";

type UploadedFile = { 
  file: File; 
  previewUrl: string | null;
  originalUrl?: string;
  zipImages?: string[];
  currentImageIndex?: number;
  isHtml?: boolean;
};

type ExtractedCreative = {
  type: "image" | "html";
  url: string;
  htmlContent?: string;
};

const isImageFile = (file: File): boolean => {
  const acceptedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileName = file.name.toLowerCase();
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  return acceptedImageExtensions.some((ext) => fileName.endsWith(ext));
};

const normalizePath = (p: string) => p.replace(/\\/g, "/").toLowerCase();

async function extractCreativesFromZip(
  zipBlob: Blob,
  depth = 0
): Promise<ExtractedCreative[]> {
  if (depth > 2) return [];

  const jszip = new JSZip();
  const zipData = await jszip.loadAsync(zipBlob);
  let creatives: ExtractedCreative[] = [];
  const usedImages = new Set<string>();

  const htmlFiles: { path: string; content: string }[] = [];
  for (const [path, entry] of Object.entries(zipData.files)) {
    if (entry.dir) continue;
    const lowerPath = normalizePath(path);

    if (lowerPath.endsWith(".html")) {
      const htmlContent = await entry.async("string");
      htmlFiles.push({ path, content: htmlContent });

      const imgMatches = [
        ...htmlContent.matchAll(/src=["']([^"']+)["']/gi),
        ...htmlContent.matchAll(/background=["']([^"']+)["']/gi),
        ...htmlContent.matchAll(/url\(["']?([^"']+)["']?\)/gi),
        ...htmlContent.matchAll(
          /background-image:\s*url\(["']?([^"']+)["']?\)/gi
        ),
        ...htmlContent.matchAll(
          /["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi
        ),
      ].map((m) => m[1]);

      console.log("🔍 Found image references in HTML:", imgMatches);

      imgMatches.forEach((imgPath) => {
        if (
          imgPath &&
          !imgPath.startsWith("data:") &&
          !imgPath.startsWith("http") &&
          !imgPath.startsWith("#")
        ) {
          const normalizedPath = normalizePath(imgPath);
          const fileName = normalizePath(imgPath.split("/").pop() || "");
          const fileNameWithoutExt = fileName.split(".")[0];

          usedImages.add(fileName);
          usedImages.add(normalizedPath);
          usedImages.add(fileNameWithoutExt);

          console.log(
            `📸 Added image paths: "${fileName}", "${normalizedPath}", "${fileNameWithoutExt}"`
          );
        }
      });
    }
  }

  for (const { content } of htmlFiles) {
    let htmlContent = content;

    const cssLinks = [
      ...htmlContent.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi),
    ];
    for (const [, cssPath] of cssLinks) {
      const cssEntryKey = Object.keys(zipData.files).find((k) =>
        normalizePath(k).endsWith(normalizePath(cssPath))
      );
      if (cssEntryKey) {
        try {
          const cssContent = await zipData.files[cssEntryKey].async("string");
          htmlContent = htmlContent.replace(
            new RegExp(
              `<link[^>]+${cssPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>`,
              "i"
            ),
            `<style>${cssContent}</style>`
          );
        } catch (error) {
          console.warn(`Failed to inline CSS file: ${cssPath}`, error);
        }
      }
    }

    console.log("🔄 Starting simplified image inlining process...");
    console.log("📋 Images to look for:", Array.from(usedImages));
    console.log("📁 Available files in ZIP:", Object.keys(zipData.files));

    for (const imgName of usedImages) {
      console.log(`🔍 Looking for image: "${imgName}"`);

      let imgKey = Object.keys(zipData.files).find((k) =>
        normalizePath(k).endsWith(normalizePath(imgName))
      );

      if (!imgKey && imgName.includes("/")) {
        const fileName = imgName.split("/").pop();
        if (fileName) {
          imgKey = Object.keys(zipData.files).find((k) =>
            normalizePath(k).endsWith(normalizePath(fileName))
          );
          console.log(`🔍 Retrying with filename only: "${fileName}"`);
        }
      }

      if (!imgKey) {
        imgKey = Object.keys(zipData.files).find((k) =>
          normalizePath(k).includes(normalizePath(imgName))
        );
        console.log(`🔍 Retrying with partial match: "${imgName}"`);
      }

      if (imgKey) {
        console.log(`✅ Found image: "${imgName}" -> "${imgKey}"`);
        try {
          const ext = imgKey.split(".").pop()?.toLowerCase() || "jpeg";
          const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

          const imgBase64 = await zipData.files[imgKey].async("base64");
          const imgSize = imgBase64.length;

          console.log(
            `🔄 Processing image: ${imgName} (${mimeType}, ${imgSize} chars)`
          );

          const escapedImgName = imgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          const imgSrcRegex = new RegExp(
            `src=["']([^"']*${escapedImgName}[^"']*)["']`,
            "gi"
          );
          const imgSrcMatches = htmlContent.match(imgSrcRegex) || [];
          htmlContent = htmlContent.replace(
            imgSrcRegex,
            `src="data:${mimeType};base64,${imgBase64}"`
          );
          console.log(`✅ Replaced ${imgSrcMatches.length} img src references`);

          const bgRegex = new RegExp(
            `url\\(["']?[^"']*${escapedImgName}[^"']*["']?\\)`,
            "gi"
          );
          const bgMatches = htmlContent.match(bgRegex) || [];
          htmlContent = htmlContent.replace(
            bgRegex,
            `url("data:${mimeType};base64,${imgBase64}")`
          );
          console.log(
            `✅ Replaced ${bgMatches.length} CSS background references`
          );

          const remainingRegex = new RegExp(`(${escapedImgName})`, "gi");
          const remainingMatches = htmlContent.match(remainingRegex) || [];
          htmlContent = htmlContent.replace(
            remainingRegex,
            `data:${mimeType};base64,${imgBase64}`
          );
          console.log(
            `✅ Replaced ${remainingMatches.length} remaining references`
          );

          const fileName = imgName.split("/").pop() || imgName;
          if (fileName !== imgName) {
            const escapedFileName = fileName.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            const fileNameRegex = new RegExp(
              `src=["']([^"']*${escapedFileName}[^"']*)["']`,
              "gi"
            );
            const fileNameMatches = htmlContent.match(fileNameRegex) || [];
            htmlContent = htmlContent.replace(
              fileNameRegex,
              `src="data:${mimeType};base64,${imgBase64}"`
            );
            console.log(
              `✅ Replaced ${fileNameMatches.length} filename-only references`
            );
          }

          console.log(`✅ Successfully inlined image: ${imgName}`);
        } catch (error) {
          console.warn(`❌ Failed to process image: ${imgName}`, error);
        }
      } else {
        console.warn(`❌ Image not found in ZIP: "${imgName}"`);
        console.log(`🔍 Available files:`, Object.keys(zipData.files));
      }
    }

    if (!htmlContent.includes("<html")) {
      htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${htmlContent}</body></html>`;
    }

    const dataImageCount = (
      htmlContent.match(/data:image\/[^;]+;base64,/g) || []
    ).length;
    const remainingImgSrc = (
      htmlContent.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/g) ||
      []
    ).length;
    console.log(
      `📊 Image inlining results: ${dataImageCount} base64 images, ${remainingImgSrc} remaining image references`
    );

    if (remainingImgSrc > 0) {
      console.warn(
        `⚠️ Warning: ${remainingImgSrc} image references were not inlined!`
      );
      console.log(
        `🔍 Remaining image references:`,
        htmlContent.match(/src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/g)
      );
    }

    const responsiveStyle = `
      <style>
        body {
          margin: 0 !important;
          padding: 10px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          background-color: #f9fafb !important;
        }
        * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        iframe {
          max-width: 100% !important;
        }
        .bg {
          height: auto !important;
          width: 100% !important;
          max-width: 600px !important;
        }
      </style>
    `;

    if (htmlContent.includes("<head>")) {
      htmlContent = htmlContent.replace("<head>", `<head>${responsiveStyle}`);
    } else if (htmlContent.includes("<html>")) {
      htmlContent = htmlContent.replace(
        "<html>",
        `<html><head>${responsiveStyle}</head>`
      );
    }

    console.log("📄 Final HTML content length:", htmlContent.length);
    console.log("📄 HTML contains images:", htmlContent.includes("data:image"));
    console.log("📄 HTML contains img tags:", htmlContent.includes("<img"));

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    creatives.push({ type: "html", url, htmlContent });
  }

  const hasHtmlFiles = htmlFiles.length > 0;
  console.log(`📊 Found ${htmlFiles.length} HTML files in ZIP`);

  if (!hasHtmlFiles) {
    console.log("📸 No HTML files found, processing standalone images...");
    for (const [path, entry] of Object.entries(zipData.files)) {
      if (entry.dir) continue;
      const lowerPath = normalizePath(path);

      if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lowerPath)) {
        if (
          usedImages.has(lowerPath) ||
          usedImages.has(lowerPath.split("/").pop() || "")
        )
          continue;
        const blob = await entry.async("blob");
        const url = URL.createObjectURL(blob);
        creatives.push({ type: "image", url });
        console.log(`✅ Added standalone image: ${path}`);
      }

      if (lowerPath.endsWith(".zip")) {
        const innerBlob = await entry.async("blob");
        const innerCreatives: ExtractedCreative[] =
          await extractCreativesFromZip(innerBlob, depth + 1);
        creatives = creatives.concat(innerCreatives);
      }
    }
  } else {
    console.log(
      "🚫 HTML files found, skipping standalone images to avoid duplication"
    );
  }

  console.log(
    `📊 ZIP processing complete: ${creatives.length} creatives extracted`
  );
  console.log(
    `📊 Breakdown: ${creatives.filter((c) => c.type === "html").length} HTML creatives, ${creatives.filter((c) => c.type === "image").length} image creatives`
  );

  return creatives;
}

export default function CreativeForm() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
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
  const [uploadType, setUploadType] = useState<null | "single" | "multiple">(
    null
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const [tempFileKey, setTempFileKey] = useState<string | null>(null);
  const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);
  const [isCreativeTypeDropdownOpen, setIsCreativeTypeDropdownOpen] =
    useState(false);

  const [fromLine, setFromLine] = useState("");
  const [subjectLines, setSubjectLines] = useState("");
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

  const [multiCreatives, setMultiCreatives] = useState<
    {
      id: number;
      imageUrl: string;
      fromLine: string;
      subjectLine: string;
      notes: string;
      type?: "image" | "html";
      htmlContent?: string;
    }[]
  >([]);
  const [editingCreativeIndex, setEditingCreativeIndex] = useState<
    number | null
  >(null);
  const [originalZipFileName, setOriginalZipFileName] = useState<string>("");
  const [savedMultiCreatives, setSavedMultiCreatives] = useState<
    {
      id: number;
      imageUrl: string;
      fromLine: string;
      subjectLine: string;
      notes: string;
    }[]
  >([]);
  const [isZipProcessing, setIsZipProcessing] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [priority, setPriority] = useState<"High" | "Moderate">("Moderate");

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/offers");
        if (!response.ok) throw new Error("Failed to fetch offers");
        const data: string[] = await response.json();
        setOffers(data);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
      }
    };
    fetchOffers();
  }, []);

  // Removed temp file cleanup since we're using Vercel Blob now

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

  const handleNextStep = () => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.affiliateId.trim()) {
        newErrors.affiliateId = "Please enter your Affiliate ID";
      }
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Please enter your Company Name";
      }
      if (!formData.firstName.trim()) {
        newErrors.firstName = "Please enter your First Name";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Please enter your Last Name";
      }
    }

    if (step === 2) {
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = "Please enter your Email ID";
      } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        newErrors.contactEmail = "Please enter a valid email address";
      }
    }

    if (step === 3) {
      if (!formData.offerId.trim()) {
        newErrors.offerId = "Please enter an Offer ID";
      }
      if (!formData.creativeType.trim()) {
        newErrors.creativeType = "Please enter a Creative Type";
      }
    }

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const creativeTypes = [
    "Email",
    "Display",
    "Search",
    "Social",
    "Native",
    "Push",
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      await handleCancelUpload();
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

  const handleFileSelect = async (file: File) => {
    setUploadedFiles([]);
    setUploadedCreative(null);
    setTempFileKey(null);

    try {
      const originalUrl = await uploadToBlob(file);
      let previewUrl = originalUrl;

      if (
        file.type === "text/html" ||
        file.name.toLowerCase().endsWith(".html")
      ) {
        const text = await file.text();
        setHtmlCode(text);

        let processedHtml = text;
        if (!processedHtml.includes("<html")) {
          processedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${processedHtml}</body></html>`;
        }

        const blob = new Blob([processedHtml], { type: "text/html" });
        const htmlUrl = URL.createObjectURL(blob);
        setUploadedFiles([{ file, previewUrl: htmlUrl, originalUrl, isHtml: true }]);
      } else if (file.name.toLowerCase().endsWith(".zip")) {
      setIsZipProcessing(true);
      setZipError(null);

      try {
        const creativesFound = await extractCreativesFromZip(file);

        if (creativesFound.length === 0) {
          setZipError("No valid creatives found in ZIP or nested ZIPs.");
          setIsZipProcessing(false);
          return;
        }

        console.log("ZIP processing results:", creativesFound);

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
            console.log("📝 Updated htmlCode state with processed HTML");
            console.log("📝 htmlCode length:", htmlContent.length);
            console.log(
              "📝 htmlCode contains data:image:",
              htmlContent.includes("data:image")
            );
            console.log(
              "📝 htmlCode contains blob:",
              htmlContent.includes("blob:")
            );
            console.log(
              "📝 First 500 chars of htmlCode:",
              htmlContent.substring(0, 500)
            );
            console.log(
              "📝 Sample img tags in htmlCode:",
              htmlContent.match(/<img[^>]+>/g)?.slice(0, 3)
            );
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
      if (file.type.startsWith("image/")) {
        const compressed = await createCompressedPreview(file);
        previewUrl = URL.createObjectURL(compressed);
      } else {
        previewUrl = URL.createObjectURL(file);
      }
      setUploadedFiles([{ file, previewUrl, originalUrl, isHtml: false }]);
      setTempFileKey(originalUrl);
    } else {
      setUploadedFiles([{ file, previewUrl: null, originalUrl }]);
      setTempFileKey(originalUrl);
    }
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to upload creative. Please try again.");
  }
  };

  const handleCancelUpload = async () => {
    setTempFileKey(null);
    setUploadedFiles([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!uploadedCreative && multiCreatives.length === 0) {
      alert("Please upload at least one creative before submitting.");
      return;
    }
    setIsSubmitting(true);
    const submissionData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key as keyof typeof formData]) {
        submissionData.append(key, formData[key as keyof typeof formData]);
      }
    });

    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((item) => {
        if (item.originalUrl) {
          submissionData.append("creativeUrls", item.originalUrl);
        }
      });
    }

    if (uploadedCreative && uploadedCreative.url) {
      submissionData.append("creativeUrls", uploadedCreative.url);
    }

    if (multiCreatives.length > 0) {
      submissionData.append("multiCreatives", JSON.stringify(multiCreatives));
    }

    submissionData.append("priority", priority);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: submissionData,
      });
      if (!response.ok) {
        let errorMessage = "Submission failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
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
      const creativeData = {
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        multiCreatives,
        fileUrl: tempFileKey,
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">
              Form Submitted Successfully!
            </h2>
            <p className="text-muted-foreground text-center">
              Thank you for your submission. Please save your tracking link.
            </p>
            {trackingLink && (
              <div className="mt-6 w-full text-center">
                <p className="text-sm text-gray-600">Your tracking link is:</p>
                <div className="mt-2 w-full bg-gray-100 p-3 rounded-md text-center">
                  <a
                    href={trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-mono break-all"
                  >
                    {trackingLink}
                  </a>
                </div>
              </div>
            )}
            <Button onClick={handleResetForm} className="mt-8 w-full">
              <RotateCw className="mr-2 h-4 w-4" /> Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
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
        <img
          src="/images/logo.svg"
          alt="Big Drops Marketing Group"
          className="h-10 sm:h-12 w-auto transition-transform hover:scale-105 duration-300"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-3xl p-4 sm:p-8 animate-slide-up hover:shadow-xl transition-all duration-500">
        <h1 className="font-sans text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-snug animate-fade-in-delay">
          Submit Your Creatives For Approval
        </h1>

        <p className="font-sans text-base sm:text-lg text-gray-600 mb-5 sm:mb-6 leading-relaxed animate-fade-in-delay-2">
          Upload your static images or HTML creatives with offer details to
          begin the approval process. Our team will review and notify you
          shortly.
        </p>

        <p className="font-sans text-base sm:text-lg font-semibold text-sky-500 mb-4 sm:mb-6 animate-fade-in-delay-3">
          Step {step} of 3:{" "}
          {step === 1
            ? "Personal Details"
            : step === 2
              ? "Contact Details"
              : "Creative Details"}
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
            <>
              <div>
                <input
                  type="text"
                  placeholder="Affiliate ID"
                  value={formData.affiliateId}
                  onChange={(e) =>
                    handleInputChange("affiliateId", e.target.value)
                  }
                  className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left ${
                    errors.affiliateId ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.affiliateId && (
                  <p className="text-red-500 text-sm mt-1 animate-fade-in">
                    {errors.affiliateId}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left-delay ${
                    errors.companyName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1 animate-fade-in">
                    {errors.companyName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left-delay-2 ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1 animate-fade-in">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left-delay-3 ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1 animate-fade-in">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="animate-fade-in">
                <input
                  type="email"
                  placeholder="Email ID"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 ${
                    errors.contactEmail ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.contactEmail && (
                  <p className="text-red-500 text-sm mt-1 animate-fade-in">
                    {errors.contactEmail}
                  </p>
                )}
              </div>

              <div className="animate-fade-in-delay">
                <input
                  type="text"
                  placeholder="Telegram ID (Optional)"
                  value={formData.telegramId}
                  onChange={(e) =>
                    handleInputChange("telegramId", e.target.value)
                  }
                  className="w-full h-14 border border-gray-300 rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400"
                />
              </div>
            </>
          )}

          {step === 3 && (
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
                    className={`w-full h-12 sm:h-14 border rounded-lg pl-10 sm:pl-12 pr-8 sm:pr-10 font-sans text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 mb-4 ${
                      errors.offerId ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
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
                      {creativeTypes.map((type, index) => (
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
                          setUploadedFiles([]);
                          setUploadedCreative(null);
                          setTempFileKey(null);
                          fetch(`/api/creative/delete`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              fileName: uploadedCreative.name,
                            }),
                          }).catch((error) => {
                            console.error("Error deleting creative:", error);
                          });
                        }}
                        className="px-3 py-1 text-sm border border-red-400 text-red-700 rounded bg-red-50 hover:bg-red-100 font-sans transition-all duration-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {multiCreatives.length > 0 && formData.creativeType === "Email" && (
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
                  {formData.creativeType === "Email" && (
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
                onLoad={(e) => {
                  try {
                    const iframeDoc = (e.target as HTMLIFrameElement)
                      .contentDocument;
                    if (iframeDoc) {
                      const style = iframeDoc.createElement("style");
                      style.innerHTML = `
                        body {
                          display: flex;
                          justify-content: center;
                          align-items: flex-start;
                          background-color: #f9fafb;
                          padding: 20px;
                          margin: 0;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        }
                        * {
                          max-width: 100%;
                          box-sizing: border-box;
                        }
                        img {
                          max-width: 100%;
                          height: auto;
                        }
                        iframe {
                          max-width: 100%;
                        }
                      `;
                      iframeDoc.head.appendChild(style);
                    }
                  } catch (err) {
                    console.error("Error styling preview iframe", err);
                  }
                }}
                onError={(e) => {
                  console.error("Iframe load error:", e);
                }}
              />
            ) : (
              <img
                src={previewImage}
                alt="Full Preview"
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
                {uploadType === "single" &&
                  editingCreativeIndex !== null &&
                  uploadedFiles[0]?.isHtml &&
                  "Edit HTML Creative"}
                {uploadType === "single" &&
                  editingCreativeIndex !== null &&
                  !uploadedFiles[0]?.isHtml &&
                  "Edit Image Creative"}
                {uploadType === "single" &&
                  editingCreativeIndex === null &&
                  "Upload Single Creative"}
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
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-5/12 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-2 max-h-[85vh] relative">
                      {uploadedFiles[0].previewUrl ? (
                        <div className="relative group w-full h-full">
                          <div className="w-full h-full overflow-hidden">
                            {uploadedFiles[0].isHtml ? (
                              <iframe
                                src={uploadedFiles[0].previewUrl || ""}
                                className="w-full h-full border-0 min-h-[400px] group-hover:blur-sm transition duration-300 bg-white"
                                sandbox="allow-scripts allow-same-origin"
                                title="HTML Creative Preview"
                              />
                            ) : (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                  src={uploadedFiles[0].previewUrl || ""}
                                  alt="Uploaded Creative"
                                  className="max-h-full w-auto object-contain group-hover:blur-sm transition duration-300"
                                />

                                {uploadedFiles[0].zipImages &&
                                  uploadedFiles[0].zipImages.length > 1 && (
                                    <>
                                      <button
                                        onClick={() => {
                                          const currentIndex =
                                            uploadedFiles[0]
                                              .currentImageIndex || 0;
                                          const newIndex =
                                            currentIndex > 0
                                              ? currentIndex - 1
                                              : uploadedFiles[0].zipImages!
                                                  .length - 1;
                                          setUploadedFiles([
                                            {
                                              ...uploadedFiles[0],
                                              previewUrl:
                                                uploadedFiles[0].zipImages![
                                                  newIndex
                                                ],
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
                                            uploadedFiles[0]
                                              .currentImageIndex || 0;
                                          const newIndex =
                                            currentIndex <
                                            uploadedFiles[0].zipImages!.length -
                                              1
                                              ? currentIndex + 1
                                              : 0;
                                          setUploadedFiles([
                                            {
                                              ...uploadedFiles[0],
                                              previewUrl:
                                                uploadedFiles[0].zipImages![
                                                  newIndex
                                                ],
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
                                        {(uploadedFiles[0].currentImageIndex ||
                                          0) + 1}{" "}
                                        / {uploadedFiles[0].zipImages!.length}
                                      </div>
                                    </>
                                  )}
                              </div>
                            )}
                          </div>

                          <div
                            onClick={() =>
                              setPreviewImage(uploadedFiles[0].previewUrl || "")
                            }
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
                                       transition-opacity duration-300 cursor-pointer z-20"
                          >
                            <div className="bg-black bg-opacity-60 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-bold">
                              Preview Image
                            </div>
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
                                setUploadedFiles((prev) =>
                                  prev.map((file) => ({
                                    ...file,
                                    file:
                                      file.file instanceof File
                                        ? Object.assign(file.file, {
                                            name: tempFileName,
                                          })
                                        : file.file,
                                  }))
                                );
                                setIsRenaming(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setUploadedFiles((prev) =>
                                    prev.map((file) => ({
                                      ...file,
                                      file:
                                        file.file instanceof File
                                          ? Object.assign(file.file, {
                                              name: tempFileName,
                                            })
                                          : file.file,
                                    }))
                                  );
                                  setIsRenaming(false);
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
                                  uploadedFiles[0]?.file?.name ||
                                    "creative.html"
                                );
                                setIsRenaming(true);
                              }}
                            >
                              {uploadedFiles[0]?.file?.name || "creative.html"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(
                                "modal-file-upload"
                              ) as HTMLInputElement;
                              if (input) {
                                input.click();
                              }
                            }}
                            className="ml-3 text-sky-500 hover:text-sky-600 font-sans"
                          >
                            Edit
                          </button>
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

                        {(() => {
                          const isHtmlCreative = uploadedFiles[0]?.isHtml;

                          return (
                            isHtmlCreative && (
                              <div className="mb-6 relative">
                                <div className="flex justify-between items-center mb-2">
                                  <h3 className="text-lg font-semibold font-sans">
                                    HTML Code
                                  </h3>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log("HTML Debug Info:", {
                                          file:
                                            uploadedFiles[0]?.file?.name ||
                                            "creative.html",
                                          isHtml: uploadedFiles[0]?.isHtml,
                                          previewUrl:
                                            uploadedFiles[0]?.previewUrl,
                                          htmlCodeLength: htmlCode.length,
                                        });
                                      }}
                                      className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                                      title="Debug Info"
                                    >
                                      🔍
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsCodeMinimized(!isCodeMinimized);
                                        setIsCodeMaximized(false);
                                      }}
                                      className="p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                                      title={
                                        isCodeMinimized ? "Restore" : "Minimize"
                                      }
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
                                      title={
                                        isCodeMaximized
                                          ? "Exit Fullscreen"
                                          : "Maximize"
                                      }
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
                                            onClick={() =>
                                              setIsCodeMaximized(false)
                                            }
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
                                            const updatedUrl =
                                              URL.createObjectURL(blob);
                                            setUploadedFiles((prev) => {
                                              if (prev[0]?.previewUrl) {
                                                URL.revokeObjectURL(
                                                  prev[0].previewUrl
                                                );
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
                                          const updatedUrl =
                                            URL.createObjectURL(blob);
                                          setUploadedFiles((prev) => {
                                            if (prev[0]?.previewUrl) {
                                              URL.revokeObjectURL(
                                                prev[0].previewUrl
                                              );
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
                                        height={
                                          isCodeMinimized ? "100px" : "300px"
                                        }
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
                            )
                          );
                        })()}

                        <h3 className="text-lg font-semibold mb-3 font-sans">
                          Creative Specific Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <textarea
                            placeholder="From Lines"
                            value={fromLine}
                            onChange={(e) => setFromLine(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 min-h-[80px] font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none"
                          />
                          <textarea
                            placeholder="Subject Lines"
                            value={subjectLines}
                            onChange={(e) => setSubjectLines(e.target.value)}
                            className="border border-gray-300 rounded-lg p-3 min-h-[80px] font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none"
                          />
                        </div>

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
                        onClick={async () => {
                          if (uploadedFiles.length === 0) {
                            alert("Please upload a creative before saving.");
                            return;
                          }

                          try {
                            const creativeData = {
                              offerId: formData.offerId,
                              creativeType: formData.creativeType,
                              fromLine,
                              subjectLines,
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
                        }}
                        className="mt-6 w-full bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                      >
                        Save & Continue
                      </button>
                    </div>
                  </div>
                ) : uploadType === "multiple" && multiCreatives.length > 0 ? (
                  <div className="w-full">
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
                                  console.error(
                                    "Creative iframe load error:",
                                    e
                                  );
                                }}
                              />
                            ) : (
                              <img
                                src={creative.imageUrl}
                                alt={`Creative ${idx + 1}`}
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
                              Type:{" "}
                              {creative.type === "html" ? "HTML" : "Image"}
                            </p>
                          </div>

                          <div className="p-3 border-t border-gray-100 flex gap-2">
                            <button
                              onClick={() => {
                                if (creative.type === "html") {
                                  const htmlContent =
                                    creative.htmlContent || "";
                                  setHtmlCode(htmlContent);

                                  const blob = new Blob([htmlContent], {
                                    type: "text/html",
                                  });
                                  const previewUrl = URL.createObjectURL(blob);

                                  setUploadedFiles([
                                    {
                                      file: new Blob([htmlContent], {
                                        type: "text/html",
                                      }) as File,
                                      previewUrl: previewUrl,
                                      isHtml: true,
                                    },
                                  ]);
                                } else {
                                  const fileName = `creative-${idx + 1}.jpg`;
                                  const file = {
                                    name: fileName,
                                    size: 0,
                                    type: "image/jpeg",
                                  } as File;

                                  setUploadedFiles([
                                    {
                                      file: file,
                                      previewUrl: creative.imageUrl,
                                      isHtml: false,
                                    },
                                  ]);
                                }

                                setEditingCreativeIndex(idx);
                                setUploadType("single");
                                setModalOpen(true);
                                setSelectedOption("Single Creative");
                              }}
                              className="flex-1 bg-sky-400 hover:bg-sky-500 text-white text-sm rounded-lg py-1 transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setMultiCreatives(
                                  multiCreatives.filter(
                                    (c) => c.id !== creative.id
                                  )
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

                    <button
                      onClick={handleMultipleCreativesSave}
                      className="mt-6 w-full bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                    >
                      Save All Creatives & Continue
                    </button>
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
                      } ${isZipProcessing ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() =>
                        !isZipProcessing &&
                        document.getElementById("file-upload")?.click()
                      }
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
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
                      <p
                        className={`font-sans text-3xl transition-colors duration-300 ${
                          isDragOver ? "text-sky-600" : "text-gray-600"
                        }`}
                      >
                        {isDragOver
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
                        multiple={uploadType === "multiple"}
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
              </>
            )}

            {!uploadType && selectedOption === "From & Subject Lines" && (
              <div className="w-full max-w-6xl mx-auto">
                <div className="bg-white rounded-lg p-8">
                  <h3 className="text-2xl font-semibold mb-8 font-sans text-gray-800">
                    From & Subject Lines
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-lg font-medium text-gray-700 font-sans">
                        From Lines
                      </label>
                      <textarea
                        placeholder="Enter your from lines here..."
                        value={fromLine}
                        onChange={(e) => setFromLine(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-6 min-h-[400px] font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none text-base"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-lg font-medium text-gray-700 font-sans">
                        Subject Lines
                      </label>
                      <textarea
                        placeholder="Enter your subject lines here..."
                        value={subjectLines}
                        onChange={(e) => setSubjectLines(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-6 min-h-[400px] font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none text-base"
                      />
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          fromLine: fromLine,
                          subjectLines: subjectLines,
                        }));
                        closeModal();
                      }}
                      className="bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-medium py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 text-lg"
                    >
                      Save & Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
