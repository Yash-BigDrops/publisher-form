export type UploadedFile = { 
  file: File; 
  previewUrl: string | null;
  originalUrl?: string;
  zipImages?: string[];
  currentImageIndex?: number;
  isHtml?: boolean;
  displayName?: string;
};

export type ExtractedCreative = {
  type: "image" | "html";
  url: string;
  htmlContent?: string;
};

export type MultiCreative = {
  id: number;
  imageUrl: string;
  fromLine: string;
  subjectLine: string;
  notes: string;
  type?: "image" | "html";
  htmlContent?: string;
};

export type CreativeFormData = {
  affiliateId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  telegramId: string;
  offerId: string;
  creativeType: string;
  fromLine: string;
  subjectLines: string;
  otherRequest: string;
};

export type TelegramCheckStatus = "unchecked" | "checking" | "ok" | "not_started";

export type Priority = "High" | "Moderate";

export type UploadType = null | "single" | "multiple"; 