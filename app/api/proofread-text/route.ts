import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProofreadResult } from "@/types/proofread";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
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
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const { text } = await req.json() as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const systemPrompt =
      "You are a precise copy editor. Return JSON ONLY matching: " +
      `{"corrected": string, "edits": [{"start": number, "end": number, "original": string, "suggestion": string, "reason": string, "severity": "minor"|"major"}]}` +
      ". The indices MUST be 0-based offsets over the ORIGINAL input text. Keep meaning & claims; fix grammar/spelling/style. Use 'major' only if meaning/policy risk changes.";

    const userPrompt =
      `Input text:\n${text}\n\n` +
      "Find issues and propose minimal fixes. Keep indices aligned to the ORIGINAL input string.";

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (msg.content?.[0] as { text?: string })?.text ?? "";
    const result = safeParseJson<ProofreadResult>(raw, { corrected: text, edits: [] });

    result.edits = (result.edits || []).filter(e =>
      Number.isFinite(e.start) && Number.isFinite(e.end) &&
      e.start >= 0 && e.end >= e.start && e.end <= text.length &&
      typeof e.original === "string" && typeof e.suggestion === "string"
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("proofread-text error", e);
    return NextResponse.json<ProofreadResult>({ corrected: "", edits: [] }, { status: 200 });
  }
}
