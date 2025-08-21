import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".html"]);
const MAX_FILES = 200;

function extOf(name: string) {
  const m = name.toLowerCase().match(/\.[a-z0-9]+$/i);
  return m ? m[0] : "";
}

function guessType(name: string) {
  const n = name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(n)) return "image/" + n.split(".").pop();
  if (/\.html?$/.test(n)) return "text/html";
  return "application/octet-stream";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const type = (file.type || "").toLowerCase();
    const name = file.name.toLowerCase();
    const isZip =
      type === "application/zip" ||
      type === "application/x-zip" ||
      type === "application/x-zip-compressed" ||
      type === "multipart/x-zip" ||
      extOf(name) === ".zip";

    if (!isZip) {
      return NextResponse.json({ error: "not a zip" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const zip = await JSZip.loadAsync(buf);

    const files = Object.values(zip.files)
      .filter((f) => !f.dir)
      .slice(0, MAX_FILES);

    const extractedFiles: Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      originalPath: string;
    }> = [];

    for (const entry of files) {
      const entryName = entry.name.split("/").pop() || "file";
      const ext = extOf(entryName);
      if (!ALLOWED_EXT.has(ext)) continue;

      const content = await entry.async("nodebuffer");
      const unique = `${entryName.replace(/\.[^/.]+$/, "")}_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;

      const { url } = await put(unique, content, {
        access: "public",
        contentType: guessType(entryName),
        addRandomSuffix: false,
      });

      extractedFiles.push({
        fileId: unique,
        fileName: entryName,
        fileUrl: url,
        fileType: guessType(entryName),
        fileSize: content.length,
        originalPath: entry.name,
      });
    }

    return NextResponse.json({
      success: true,
      zipFileId: `${Date.now()}`,
      extractedFiles,
      totalFiles: extractedFiles.length,
      extractionDate: new Date().toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "zip processing failed" }, { status: 500 });
  }
}
