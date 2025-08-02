import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const tempDir = path.join(process.cwd(), "public", "temp-uploads");

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get("fileKey");

    if (!fileKey) {
      return NextResponse.json({ error: "No file key provided" }, { status: 400 });
    }

    const filePath = path.join(tempDir, fileKey);
    const previewPath = path.join(tempDir, `preview-${fileKey}.jpg`);

    await Promise.all([
      fs.unlink(filePath).catch(() => {}),
      fs.unlink(previewPath).catch(() => {}),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
} 