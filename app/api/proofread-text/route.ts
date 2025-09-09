import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProofreadResult } from "@/types/proofread";

export const runtime = "nodejs";

const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620";

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
      if (!process.env.CLAUDE_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "CLAUDE_API_KEY or ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

    const { text } = await req.json() as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const systemPrompt =
      "You are an expert proofreader. Check the given text carefully for spelling errors. For each error, provide the incorrect word and the corrected suggestion. If no spelling mistakes are found, simply return the phrase: 'no error found'. " +
      "Return JSON ONLY matching: " +
      `{"errors": [{"word": "string", "suggestion": "string"}], "if_no_errors": "no error found"}` +
      ". Focus ONLY on spelling mistakes, not grammar or style issues.";

    const userPrompt =
      `Input text:\n${text}\n\n` +
      "Check this text for spelling errors only. Return the specified JSON format.";

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (msg.content?.[0] as { text?: string })?.text ?? "";
    const spellingResult = safeParseJson<{errors: Array<{word: string, suggestion: string}>, if_no_errors?: string}>(raw, { errors: [] });

    // Convert spelling errors to the existing ProofreadResult format for compatibility
    const result: ProofreadResult = {
      corrected: text,
      edits: spellingResult.errors?.map((error, index) => ({
        start: text.indexOf(error.word),
        end: text.indexOf(error.word) + error.word.length,
        original: error.word,
        suggestion: error.suggestion,
        reason: "Spelling error",
        severity: "minor" as const
      })) || []
    };

    return NextResponse.json(result);
  } catch (e) {
    console.error("proofread-text error", e);
    return NextResponse.json<ProofreadResult>({ corrected: "", edits: [] }, { status: 200 });
  }
}
