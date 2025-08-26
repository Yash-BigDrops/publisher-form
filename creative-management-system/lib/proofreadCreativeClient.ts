export interface ProofreadCreativeRequest {
  creativeId?: string;
  creativeType?: "email"|"display"|"search"|"social"|"native"|"push";
  fileType: "image"|"html";
  fileUrl?: string;
  htmlContent?: string;
  offerId?: string;
  industry?: string;
  targetAudience?: string;
  campaignGoal?: string;
  brandVoice?: string;
}

export interface ProofreadCreativeResponse {
  success: boolean;
  issues: Array<{
    icon: string;
    type: string;
    original?: string;
    correction?: string;
    note?: string;
  }>;
  suggestions: Array<{
    icon: string;
    type: string;
    description: string;
  }>;
  qualityScore: {
    grammar: number;
    readability: number;
    conversion: number;
    brandAlignment: number;
  };
}

export async function proofreadCreative(request: ProofreadCreativeRequest): Promise<ProofreadCreativeResponse> {
  const response = await fetch('/api/proofread-creative', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
