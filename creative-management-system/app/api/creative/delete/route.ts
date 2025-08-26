import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, creativeId, previewUrl, relatedIds = [] } = await req.json() as {
      fileUrl?: string; 
      creativeId?: string; 
      previewUrl?: string; 
      relatedIds?: string[]
    };

    const ids = new Set<string>();
    if (creativeId) ids.add(creativeId);
    if (fileUrl) {
      const m = fileUrl.match(/\/api\/files\/([^/]+)\//) || fileUrl.match(/[?&]id=([^&]+)/);
      if (m) ids.add(decodeURIComponent(m[1]));
    }
    if (previewUrl) {
      const m = previewUrl.match(/\/api\/files\/([^/]+)\//) || previewUrl.match(/[?&]id=([^&]+)/);
      if (m) ids.add(decodeURIComponent(m[1]));
    }
    for (const x of relatedIds) if (x) ids.add(x);

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/files/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(ids) }),
    });

    const out = await res.json();
    return NextResponse.json(out, { status: res.status });
  } catch (e) {
    console.error("delete creative error:", e);
    return NextResponse.json({ error: "Failed to delete creative" }, { status: 500 });
  }
}
