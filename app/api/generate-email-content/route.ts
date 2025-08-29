import { NextResponse } from "next/server";

type Req = {
  creativeType?: string;
  audience?: string;
  brandVoice?: string;
  industry?: string;
  campaignGoal?: string;
  notes?: string;
  sampleText?: string;
  maxFrom?: number;
  maxSubject?: number;
};

type Resp = {
  fromLines: string[];
  subjectLines: string[];
};

export const dynamic = "force-dynamic";

const SYS_INSTRUCTIONS = `
You generate high-performing "From" lines and Subject lines for email campaigns.
Return STRICT JSON ONLY with keys: fromLines (string[]), subjectLines (string[]).
Do not include commentary.
Rules:
- Make From lines look like real people/brands (avoid spammy ALL CAPS).
- Subject lines: concise, curiosity-driven, 35–55 chars when possible, no clickbait.
- Avoid spam trigger words (free!!!, winner, guarantee).
- Tailor tone to brandVoice and audience. 
`;

function buildUserPrompt(payload: Req) {
  const {
    creativeType = "Email",
    audience = "",
    brandVoice = "",
    industry = "",
    campaignGoal = "",
    notes = "",
    sampleText = "",
    maxFrom = 5,
    maxSubject = 10,
  } = payload;

  return `
Context:
- Creative Type: ${creativeType}
- Audience: ${audience || "n/a"}
- Brand Voice: ${brandVoice || "n/a"}
- Industry: ${industry || "n/a"}
- Campaign Goal: ${campaignGoal || "n/a"}
- Extra Notes: ${notes || "n/a"}

Sample Creative/Text (optional):
${sampleText || "n/a"}

Requirements:
- Generate up to ${maxFrom} From lines and up to ${maxSubject} Subject lines.
- Output JSON: {"fromLines": [...], "subjectLines": [...]}
`;
}

async function callAnthropic(jsonPrompt: string) {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
  if (!apiKey) {
    console.log("CLAUDE_API_KEY not configured, skipping Anthropic call");
    return null;
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        system: SYS_INSTRUCTIONS,
        messages: [{ role: "user", content: jsonPrompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Claude error: ${res.status} ${t}`);
    }
    const data = await res.json();

    const text =
      data?.content?.map((b: { text?: string }) => b?.text).filter(Boolean).join("\n") ?? "";
    return text;
  } catch (error) {
    console.error("Anthropic API call failed:", error);
    return null;
  }
}

async function callOpenAI(jsonPrompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    console.log("OPENAI_API_KEY not configured, skipping OpenAI call");
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYS_INSTRUCTIONS },
          { role: "user", content: jsonPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`OpenAI error: ${res.status} ${t}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return text;
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    return null;
  }
}

function safeParseLLMJson(text: string | null): Resp | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    const fromLines = Array.isArray(parsed.fromLines) ? parsed.fromLines : [];
    const subjectLines = Array.isArray(parsed.subjectLines) ? parsed.subjectLines : [];
    return { fromLines, subjectLines };
  } catch {
    const match = text.match(/\{[\s\S]*\}$/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const fromLines = Array.isArray(parsed.fromLines) ? parsed.fromLines : [];
        const subjectLines = Array.isArray(parsed.subjectLines) ? parsed.subjectLines : [];
        return { fromLines, subjectLines };
      } catch {}
    }
    return null;
  }
}

function generateFallbackContent(payload: Req): Resp {
  const { creativeType = "Email", industry = "", maxFrom = 5, maxSubject = 10 } = payload;
  
  // Generate industry-specific fallback content
  const industryFallbacks: Record<string, { fromLines: string[], subjectLines: string[] }> = {
    "finance": {
      fromLines: [
        "Your Financial Advisor",
        "Finance Team",
        "Investment Specialist",
        "Wealth Management",
        "Financial Services"
      ],
      subjectLines: [
        "Important financial update for you",
        "Your financial future starts now",
        "Exclusive offer inside",
        "Time-sensitive financial opportunity",
        "Your personalized financial plan"
      ]
    },
    "healthcare": {
      fromLines: [
        "Healthcare Team",
        "Medical Services",
        "Health & Wellness",
        "Patient Care",
        "Medical Center"
      ],
      subjectLines: [
        "Your health matters to us",
        "Important health information",
        "Wellness tips for you",
        "Healthcare update",
        "Your health journey starts here"
      ]
    },
    "technology": {
      fromLines: [
        "Tech Support",
        "Product Team",
        "Technology Solutions",
        "IT Services",
        "Digital Innovation"
      ],
      subjectLines: [
        "Tech solution for your business",
        "Innovation at your fingertips",
        "Digital transformation guide",
        "Tech support available",
        "Future-proof your business"
      ]
    }
  };

  // Default fallback content
  const defaultFallback = {
    fromLines: [
      "Customer Service",
      "Support Team",
      "Your Team",
      "Company Name",
      "Customer Success"
    ],
    subjectLines: [
      "Important update for you",
      "Your exclusive offer",
      "Don't miss this opportunity",
      "Special announcement",
      "Your personalized message"
    ]
  };

  const fallback = industryFallbacks[industry.toLowerCase()] || defaultFallback;
  
  return {
    fromLines: fallback.fromLines.slice(0, maxFrom),
    subjectLines: fallback.subjectLines.slice(0, maxSubject)
  };
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Req;
    const userPrompt = buildUserPrompt(payload);

    let text: string | null = null;
    try {
      text = await callAnthropic(userPrompt);
    } catch (e) {
      console.error(e);
    }
    if (!text) {
      try {
        text = await callOpenAI(userPrompt);
      } catch (e) {
        console.error(e);
      }
    }
    
    // If both API calls fail, provide fallback content
    if (!text) {
      console.log("Both API calls failed, providing fallback content");
      const fallbackContent = generateFallbackContent(payload);
      return NextResponse.json(fallbackContent, { status: 200 });
    }
    
    const parsed = safeParseLLMJson(text);

    if (!parsed || (!parsed.fromLines.length && !parsed.subjectLines.length)) {
      console.log("Model returned empty or invalid JSON, providing fallback content");
      const fallbackContent = generateFallbackContent(payload);
      return NextResponse.json(fallbackContent, { status: 200 });
    }

    const uniq = (arr: string[]) =>
      Array.from(new Set(arr.map((s) => s.trim()))).filter(Boolean);

    const resp: Resp = {
      fromLines: uniq(parsed.fromLines).slice(0, payload.maxFrom ?? 5),
      subjectLines: uniq(parsed.subjectLines).slice(0, payload.maxSubject ?? 10),
    };
    return NextResponse.json(resp, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Generation failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
