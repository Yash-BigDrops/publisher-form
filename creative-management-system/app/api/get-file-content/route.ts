import { NextResponse } from "next/server";
import { getFilePath } from "@/lib/fileStorage";
import { rewriteHtmlAssets } from "@/lib/assetRewriter";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId") || "";
    const fileUrl = searchParams.get("fileUrl") || "";
    const processAssets = (searchParams.get("processAssets") || "false") === "true";

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    const decoded = decodeURIComponent(fileUrl);
    const inferredName = decoded.split("/").filter(Boolean).slice(-1)[0] || "index.html";

    const absPath = await getFilePath(fileId, inferredName);
    const html = await (await import("fs/promises")).readFile(absPath, "utf8");

    if (!processAssets) {
      return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const origin = process.env.NEXT_PUBLIC_BASE_PATH
      ? new URL(process.env.NEXT_PUBLIC_BASE_PATH, req.url).toString().replace(/\/$/, "")
      : new URL(req.url).origin;

    const base = `${origin}/api/files/${encodeURIComponent(fileId)}/`;
    const rewritten = rewriteHtmlAssets(html, base);

    return new NextResponse(rewritten, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "failed to load content", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
