"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription2,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, CheckCircle, X, RotateCw } from "lucide-react";
import JSZip from "jszip";

type UploadedFile = { file: File; previewUrl: string | null };

const isImageFile = (file: File): boolean => {
  const acceptedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileName = file.name.toLowerCase();
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  return acceptedImageExtensions.some((ext) => fileName.endsWith(ext));
};

export default function CreativeForm() {
  const [step, setStep] = useState(1);
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
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [trackingLink, setTrackingLink] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        setIsLoadingOffers(false);
      }
    };
    fetchOffers();
  }, []);

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
    setPreviewImage(null);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(event.target.files)) {
      if (file.type === "application/zip" || file.name.endsWith(".zip")) {
        const zip = new JSZip();
        try {
          const content = await zip.loadAsync(file);
          for (const filename of Object.keys(content.files)) {
            const zipEntry = content.files[filename];
            if (!zipEntry.dir && !zipEntry.name.startsWith("__MACOSX/")) {
              const fileData = await zipEntry.async("blob");
              const unzippedFile = new File([fileData], filename, {
                type: fileData.type || "application/octet-stream",
              });
              const previewUrl = isImageFile(unzippedFile)
                ? URL.createObjectURL(unzippedFile)
                : null;
              newFiles.push({ file: unzippedFile, previewUrl });
            }
          }
        } catch (e) {
          console.error("Error unzipping file:", e);
          alert(`Could not read zip file.`);
        }
      } else {
        const previewUrl = isImageFile(file) ? URL.createObjectURL(file) : null;
        newFiles.push({ file, previewUrl });
      }
    }
    setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (fileNameToRemove: string) => {
    setUploadedFiles((prevFiles) => {
      const newFiles = prevFiles.filter((item) => {
        if (item.file.name === fileNameToRemove && item.previewUrl)
          URL.revokeObjectURL(item.previewUrl);
        return item.file.name !== fileNameToRemove;
      });
      return newFiles;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateStep = () => {
    if (step === 1) {
      if (
        !formData.affiliateId ||
        !formData.companyName ||
        !formData.firstName ||
        !formData.lastName
      ) {
        alert("Please fill out all required fields.");
        return false;
      }
    } else if (step === 2) {
      if (
        !formData.offerId ||
        !formData.creativeType ||
        !formData.contactEmail
      ) {
        alert("Please fill out all required fields.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) setStep((prev) => prev + 1);
  };
  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one creative file.");
      return;
    }
    setIsSubmitting(true);
    const submissionData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key as keyof typeof formData]) {
        submissionData.append(key, formData[key as keyof typeof formData]);
      }
    });
    uploadedFiles.forEach((item) => {
      submissionData.append("files", item.file);
    });

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: submissionData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Full Preview"
              className="max-w-full max-h-full rounded-md shadow-lg"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 text-white bg-red-600 hover:bg-red-700 rounded-full p-2 shadow-lg transition-transform hover:scale-110"
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900">
                Publisher Form - Step {step} of 3
              </CardTitle>
              <CardDescription className="text-lg text-left mt-2">
                Please complete the following and Big Drops will respond as soon
                as possible.
              </CardDescription>
              <CardDescription2 className="text-sm text-muted-foreground mt-2 text-left">
                Please Note: Your submission does not constitute an approval.
                All request decisions will be delivered via email to the email
                address provided. If you should have any questions/concerns
                please feel free to reach out to your Big Drops representative.
              </CardDescription2>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="affiliateId">Affiliate ID *</Label>
                    <Input
                      id="affiliateId"
                      type="text"
                      value={formData.affiliateId}
                      onChange={(e) =>
                        handleInputChange("affiliateId", e.target.value)
                      }
                      placeholder="Enter your affiliate ID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) =>
                        handleInputChange("companyName", e.target.value)
                      }
                      placeholder="Enter your company name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        handleInputChange("contactEmail", e.target.value)
                      }
                      placeholder="Enter your contact email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegramId">Telegram ID (Optional)</Label>
                    <Input
                      id="telegramId"
                      type="text"
                      value={formData.telegramId}
                      onChange={(e) =>
                        handleInputChange("telegramId", e.target.value)
                      }
                      placeholder="e.g., @username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offerId">Offer ID *</Label>
                    <Select
                      value={formData.offerId}
                      onValueChange={(value) =>
                        handleInputChange("offerId", value)
                      }
                      required
                      disabled={isLoadingOffers || offers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingOffers
                              ? "Loading offers..."
                              : "Select an offer"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!isLoadingOffers && offers.length > 0 ? (
                          offers.map((offerId) => (
                            <SelectItem key={offerId} value={offerId}>
                              {offerId}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-offers" disabled>
                            {isLoadingOffers
                              ? "Loading..."
                              : "No offers found."}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creativeType">Creative Type *</Label>
                    <Select
                      value={formData.creativeType}
                      onValueChange={(value) =>
                        handleInputChange("creativeType", value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select creative type" />
                      </SelectTrigger>
                      <SelectContent>
                        {creativeTypes.map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>"Creative" Request *</Label>
                    <div className="rounded-lg border bg-background">
                      <input
                        id="creativeUpload"
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.zip,.psd,.ai"
                      />
                      <label
                        htmlFor="creativeUpload"
                        className="flex cursor-pointer items-center justify-between p-4"
                      >
                        <span className="text-sm text-muted-foreground">
                          Choose File(s) or ZIP archive...
                        </span>
                        <Upload className="h-5 w-5 text-gray-500" />
                      </label>
                      {uploadedFiles.length > 0 && (
                        <div className="border-t px-4 py-3 space-y-3">
                          {uploadedFiles.map((item, index) => (
                            <div
                              key={`${item.file.name}-${index}`}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                {item.previewUrl ? (
                                  <img
                                    src={item.previewUrl}
                                    alt="preview"
                                    className="h-10 w-10 object-cover rounded-md border cursor-pointer transition-transform hover:scale-110"
                                    onClick={() =>
                                      setPreviewImage(item.previewUrl!)
                                    }
                                  />
                                ) : (
                                  <FileText className="h-6 w-6 flex-shrink-0 text-gray-500" />
                                )}
                                <div className="flex flex-col">
                                  <span
                                    className="text-sm font-medium text-foreground truncate max-w-[200px]"
                                    title={item.file.name}
                                  >
                                    {item.file.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatFileSize(item.file.size)}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(item.file.name)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Remove ${item.file.name}`}
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Please upload the "Creatives" that you are requesting
                      approval on.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromLine">From Line</Label>
                    <Textarea
                      id="fromLine"
                      value={formData.fromLine}
                      onChange={(e) =>
                        handleInputChange("fromLine", e.target.value)
                      }
                      placeholder="Enter the from line for the creative"
                      className="min-h-[80px] w-full resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjectLines">Subject Lines</Label>
                    <Textarea
                      id="subjectLines"
                      value={formData.subjectLines}
                      onChange={(e) =>
                        handleInputChange("subjectLines", e.target.value)
                      }
                      placeholder="Enter the subject lines for the creative"
                      className="min-h-[80px] w-full resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherRequest">Notes for the creative</Label>
                    <Textarea
                      id="otherRequest"
                      value={formData.otherRequest}
                      onChange={(e) =>
                        handleInputChange("otherRequest", e.target.value)
                      }
                      placeholder="Enter any additional notes for the creative"
                      className="min-h-[80px] w-full resize-none"
                    />
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  Previous
                </Button>
              )}
              {step < 3 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto"
                >
                  Next
                </Button>
              )}
              {step === 3 && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
