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
      "You are an expert proofreader with OCR capabilities. Extract all user-facing ad text from the image (ignore UI chrome, nav, boilerplate), then check for spelling errors only. " +
      'Return JSON ONLY: {"errors": [{"word": "string", "suggestion": "string"}], "if_no_errors": "no error found"}. ' +
      "Focus ONLY on spelling mistakes, not grammar or style issues.";

    const userText =
      "Extract headline, subheads, body, CTA. Preserve helpful line breaks. " +
      "Then check the extracted text for spelling errors only. Return the specified JSON format.";

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
    const spellingResult = safeParseJson<{errors: Array<{word: string, suggestion: string}>, if_no_errors?: string}>(raw, { errors: [] });

    const result: ProofreadResult = {
      corrected: "",
      edits: spellingResult.errors?.map((error) => ({
        start: 0, 
        end: error.word.length,
        original: error.word,
        suggestion: error.suggestion,
        reason: "Spelling error",
        severity: "minor" as const
      })) || []
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error("proofread-image error", e);
    return NextResponse.json<ProofreadResult>({ corrected: "", edits: [] }, { status: 200 });
  }
}
