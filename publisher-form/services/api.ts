import { CreativeFormData, MultiCreative, TelegramCheckResponse } from "@/types/creative";

export const fetchOffers = async (): Promise<string[]> => {
  try {
    const response = await fetch("/api/offers");
    if (!response.ok) throw new Error("Failed to fetch offers");
    return await response.json();
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
};

export const checkTelegramUser = async (username: string): Promise<TelegramCheckResponse> => {
  try {
    const res = await fetch("/api/check-telegram-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    return await res.json();
  } catch (error) {
    console.error("Telegram check failed", error);
    return { started: false, message: "Failed to check Telegram user" };
  }
};

export const getClaudeSuggestions = async (data: {
  companyName: string;
  offerId: string;
  creativeType: string;
  notes: string;
  creativeContent: string;
}): Promise<{ suggestions?: string }> => {
  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('AI suggestion error:', error);
    throw error;
  }
};

export const saveCreative = async (creativeData: {
  offerId: string;
  creativeType: string;
  fromLine: string;
  subjectLines: string;
  notes: string;
  fileUrl: string;
}): Promise<void> => {
  const res = await fetch("/api/creative/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creativeData),
  });

  if (!res.ok) {
    throw new Error("Failed to save creative");
  }
};

export const saveMultipleCreatives = async (creativeData: {
  offerId: string;
  creativeType: string;
  fromLine: string;
  subjectLines: string;
  multiCreatives: MultiCreative[];
  fileUrl: string;
}): Promise<void> => {
  const res = await fetch("/api/creative/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creativeData),
  });

  if (!res.ok) {
    throw new Error("Failed to save creatives");
  }
};

export const deleteCreative = async (fileName: string): Promise<void> => {
  await fetch(`/api/creative/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });
};

export const submitForm = async (formData: CreativeFormData, creativeUrls: string[], multiCreatives: MultiCreative[], priority: string): Promise<{ trackingLink: string }> => {
  const submissionData = new FormData();
  
  Object.keys(formData).forEach((key) => {
    if (formData[key as keyof CreativeFormData]) {
      submissionData.append(key, formData[key as keyof CreativeFormData]);
    }
  });

  creativeUrls.forEach(url => {
    submissionData.append("creativeUrls", url);
  });

  if (multiCreatives.length > 0) {
    submissionData.append("multiCreatives", JSON.stringify(multiCreatives));
  }

  submissionData.append("priority", priority);

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

  return await response.json();
}; 