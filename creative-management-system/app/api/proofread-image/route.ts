import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ProofreadResult } from "@/types/proofread";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

function asImagePart(imageUrlOrData: string) {
  return { type: "image_url" as const, image_url: { url: imageUrlOrData } };
}

function safeParseJson<T>(s: string, fallback: T): T {
  try {
    const cleaned = s.trim().replace(/^```(?:json)?/i, "").replace(/```$/,"").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const { imageUrl } = await req.json() as { imageUrl?: string };
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const system =
      "You are a precise OCR + copy editor for ads. Extract all user-facing ad text from the image (ignore UI chrome, nav, boilerplate), then proofread it. " +
      'Return JSON ONLY: {"corrected": string, "edits": [{"start": number, "end": number, "original": string, "suggestion": string, "reason": string, "severity": "minor"|"major"}]}. ' +
      "Indices must reference the extracted text string.";

    const userText =
      "Extract headline, subheads, body, CTA. Preserve helpful line breaks. " +
      "Then proofread for clarity, spelling, grammar. Keep brand claims. Be concise. 'major' only for meaning/policy-risk changes. Return JSON ONLY.";

    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: [
            { type: "text", text: userText },
            asImagePart(imageUrl),
        ] }
      ],
    });

    const raw = resp.choices[0]?.message?.content ?? "";
    const result = safeParseJson<ProofreadResult>(raw, { corrected: "", edits: [] });

    const base = result.corrected || "";
    result.edits = (result.edits || []).filter(e =>
      Number.isFinite(e.start) && Number.isFinite(e.end) &&
      e.start >= 0 && e.end >= e.start && e.end <= base.length &&
      typeof e.original === "string" && typeof e.suggestion === "string"
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("proofread-image error", e);
    return NextResponse.json<ProofreadResult>({ corrected: "", edits: [] }, { status: 200 });
  }
}
