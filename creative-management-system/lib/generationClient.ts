export async function generateEmailContent(opts: {
  creativeType?: string;
  audience?: string;
  brandVoice?: string;
  industry?: string;
  campaignGoal?: string;
  notes?: string;
  sampleText?: string;
  maxFrom?: number;
  maxSubject?: number;
}) {
  const r = await fetch("/api/generate-email-content", {
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
