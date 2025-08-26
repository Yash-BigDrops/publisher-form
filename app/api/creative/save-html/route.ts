import { NextRequest, NextResponse } from "next/server";
import { getFilePath } from "@/lib/fileStorage";
import { rename as fsRename, writeFile } from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, html, newFileName } = (await req.json()) as {
      fileUrl: string; html: string; newFileName?: string;
    };
    if (!fileUrl || typeof html !== "string") {
      return NextResponse.json({ error: "fileUrl and html required" }, { status: 400 });
    }

    const m = fileUrl.match(/\/api\/files\/([^/]+)\/([^?#]+)/);
    if (!m) return NextResponse.json({ error: "bad fileUrl" }, { status: 400 });
    const id = decodeURIComponent(m[1]);
    const name = decodeURIComponent(m[2]);

    const abs = await getFilePath(id, name);
    await writeFile(abs, html, "utf8");

    let finalName = name;
    if (newFileName && newFileName !== name) {
      const newAbs = await getFilePath(id, newFileName);
      await fsRename(abs, newAbs);
      finalName = newFileName;
    }

    return NextResponse.json({
      ok: true,
      fileUrl: `/api/files/${encodeURIComponent(id)}/${encodeURIComponent(finalName)}`
    });
  } catch (e) {
    console.error("save-html error:", e);
    return NextResponse.json({ error: "Failed to save HTML" }, { status: 500 });
  }
}
