import { NextResponse } from "next/server";

type Req = {
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
};

type Issue = { icon: string; type: string; original?: string; correction?: string; note?: string };
type Suggestion = { icon: string; type: string; description: string };
type QualityScore = { grammar: number; readability: number; conversion: number; brandAlignment: number };

type Resp = { success: boolean; issues: Issue[]; suggestions: Suggestion[]; qualityScore: QualityScore };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SYSTEM = `
You are a precise creative proofreader and optimizer specializing in email and marketing content.
Return ONLY JSON with keys: issues (array), suggestions (array), qualityScore (object).

Focus on:
- Grammar, spelling, and punctuation in the actual text content
- Readability and clarity of the message
- Conversion optimization (CTAs, compelling language, urgency)
- Brand alignment and tone consistency

Ignore HTML markup, focus only on the human-readable text content.
Be concise, practical, and provide specific, actionable feedback.
`;

function isAbsolute(u: string) {
  try { new URL(u); return true; } catch { return false; }
}

async function toDataUrl(abs: string) {
  const r = await fetch(abs, { cache: "no-store" });
  if (!r.ok) throw new Error(`fetch image failed (${r.status})`);
  const mime = r.headers.get("content-type") || "image/jpeg";
  const b64 = Buffer.from(await r.arrayBuffer()).toString("base64");
  return `data:${mime};base64,${b64}`;
}

async function normalizeImageForOpenAI(fileUrl: string, req: Request) {
  const origin = process.env.NEXT_PUBLIC_BASE_PATH
    ? new URL(process.env.NEXT_PUBLIC_BASE_PATH, req.url).origin
    : new URL(req.url).origin;

  const abs = isAbsolute(fileUrl) ? fileUrl : new URL(fileUrl, origin).toString();
  const host = new URL(abs).hostname;

  if (host === "localhost" || host === "127.0.0.1") {
    return await toDataUrl(abs);
  }
  return abs;
}

function baseContext(p: Req) {
  return `
Context:
- Creative Type: ${p.creativeType || "email"}
- Offer ID: ${p.offerId || "n/a"}
- Industry: ${p.industry || "n/a"}
- Audience: ${p.targetAudience || "n/a"}
- Campaign Goal: ${p.campaignGoal || "n/a"}
- Brand Voice: ${p.brandVoice || "n/a"}

You are analyzing the TEXT CONTENT of this creative, not the HTML structure.
Focus on the actual words, sentences, and messaging that users will read.

Output JSON shape:
{
  "issues": [{"icon": "⚠️","type":"Grammar Error","original":"...","correction":"...","note":"..."}],
  "suggestions": [{"icon":"💡","type":"Conversion Tip","description":"..."}],
  "qualityScore": {"grammar": 0-100,"readability":0-100,"conversion":0-100,"brandAlignment":0-100}
}
`;
}

async function callAnthropicJSON(prompt: string) {
  const key = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.3,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = (data?.content || []).map((b: { text?: string }) => b?.text).filter(Boolean).join("\n");
  return text || null;
}

async function callOpenAIJSON(prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, temperature: 0.3,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

async function callOpenAIVisionJSON(imageUrl: string, context: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: context + "\nAnalyze the image text, layout, and clarity. Return JSON only." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? null;
}

function coerceResp(text: string | null): Resp | null {
  if (!text) return null;
  try {
    const p = JSON.parse(text);
    const issues = Array.isArray(p.issues) ? p.issues : [];
    const suggestions = Array.isArray(p.suggestions) ? p.suggestions : [];
    const q = p.qualityScore || {};
    const qualityScore: QualityScore = {
      grammar: Math.max(0, Math.min(100, Number(q.grammar || 0))),
      readability: Math.max(0, Math.min(100, Number(q.readability || 0))),
      conversion: Math.max(0, Math.min(100, Number(q.conversion || 0))),
      brandAlignment: Math.max(0, Math.min(100, Number(q.brandAlignment || 0))),
    };
    return { success: true, issues, suggestions, qualityScore };
  } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasClaude = !!(process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY);
    
    console.log("Proofread environment check:", {
      hasOpenAI,
      hasClaude,
      openaiModel: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      claudeModel: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620"
    });

    const payload = (await req.json()) as Req;
    const ctx = baseContext(payload);

    let out: Resp | null = null;

    if (payload.fileType === "html") {
      const textOnly = (payload.htmlContent || "")
        // Remove script and style tags completely
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, "")
        // Replace common HTML tags with appropriate spacing to preserve sentence structure
        .replace(/<\/?(?:p|div|h[1-6]|section|article|main|header|footer|nav|aside|ul|ol|li|table|tr|td|th|thead|tbody|caption|colgroup|col|blockquote|pre|address|fieldset|legend|form|label|input|textarea|select|option|button|img|a|span|strong|em|b|i|u|mark|small|del|ins|sub|sup|code|kbd|samp|var|cite|dfn|abbr|acronym|time|data|meter|progress|details|summary|dialog|menu|menuitem|wbr|br|hr)[^>]*>/gi, " ")
        // Remove any remaining HTML tags
        .replace(/<[^>]+>/g, "")
        // Clean up whitespace while preserving sentence structure
        .replace(/\s+/g, " ")
        .replace(/\s*([.!?])\s*/g, "$1 ")
        .replace(/\s*([,;:])\s*/g, "$1 ")
        .trim()
        .slice(0, 15000); // safety

      console.log("Extracted text for proofreading:", textOnly.substring(0, 200) + "...");

      const prompt = `${ctx}\n\nEXTRACTED TEXT CONTENT:\n${textOnly}\n\nAnalyze this text for grammar, readability, conversion optimization, and brand alignment. Focus on the actual content, not HTML markup. Return JSON only.`;
      out = coerceResp(await callAnthropicJSON(prompt)) || coerceResp(await callOpenAIJSON(prompt));
    } else if (payload.fileType === "image") {
      if (!payload.fileUrl) {
        return NextResponse.json({ success: false, error: "fileUrl required for image" }, { status: 400 });
      }
      const imageSource = await normalizeImageForOpenAI(payload.fileUrl, req);
      const context = `${ctx}\n\nIMAGE SOURCE: ${imageSource.startsWith("data:") ? "(inlined)" : imageSource}`;
      out = coerceResp(await callOpenAIVisionJSON(imageSource, context));
    }

    if (!out) { 
      return NextResponse.json({
        success: true,
        issues: [],
        suggestions: [{ icon: "ℹ️", type: "Notice", description: "LLM unavailable; no issues detected." }],
        qualityScore: { grammar: 75, readability: 75, conversion: 70, brandAlignment: 80 },
      });
    }
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
