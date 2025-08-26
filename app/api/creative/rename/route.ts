import { NextRequest, NextResponse } from "next/server";
import { getFilePath } from "@/lib/fileStorage";
import { rename as fsRename } from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, newName } = (await req.json()) as { fileUrl?: string; newName: string };
    if (!fileUrl || !newName) {
      return NextResponse.json({ error: "fileUrl and newName required" }, { status: 400 });
    }

    const m = fileUrl.match(/\/api\/files\/([^/]+)\/([^?#]+)/);
    if (!m) return NextResponse.json({ error: "bad fileUrl" }, { status: 400 });
    const id = decodeURIComponent(m[1]);
    const oldName = decodeURIComponent(m[2]);

    const oldAbs = await getFilePath(id, oldName);
    const newAbs = await getFilePath(id, newName);
    await fsRename(oldAbs, newAbs);

    return NextResponse.json({
      ok: true,
      newName,
      fileUrl: `/api/files/${encodeURIComponent(id)}/${encodeURIComponent(newName)}`,
    });
  } catch (e) {
    console.error("rename error:", e);
    return NextResponse.json({ error: "Failed to rename" }, { status: 500 });
  }
}
