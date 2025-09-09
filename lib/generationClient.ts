import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export async function analyzeCreatives(opts: {
  files: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    html?: boolean;
    embeddedHtml?: string;
    uploadId?: string;
  }>;
  creativeType: string;
  offerId?: string;
}) {
  const r = await fetch(API_ENDPOINTS.ANALYZE_CREATIVES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return (await r.json()) as {
    success: boolean;
    analysis?: {
      extractedText: string;
      imageDescriptions: string[];
      htmlContent: string;
      fileCount: number;
      creativeTypes: string[];
      contentType: string;
    };
    error?: string;
  };
}

export async function generateEmailContent(opts: {
  creativeType?: string;
  audience?: string;
  brandVoice?: string;
  industry?: string;
  campaignGoal?: string;
  sampleText?: string;
  maxFrom?: number;
  maxSubject?: number;
  creativeAnalysis?: {
    extractedText: string;
    imageDescriptions: string[];
    htmlContent: string;
    fileCount: number;
    creativeTypes: string[];
    contentType: string;
  };
}) {
  const r = await fetch(API_ENDPOINTS.GENERATE_EMAIL_CONTENT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${r.status}`);
  }
  return (await r.json()) as { fromLines: string[]; subjectLines: string[] };
}
