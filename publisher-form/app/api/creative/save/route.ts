import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const tempDir = path.join(process.cwd(), "public", "temp-uploads");
const permanentDir = path.join(process.cwd(), "public", "creatives");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { offerId, creativeType, fromLine, subjectLines, notes, fileKey } = data;

    if (!fileKey) {
      return NextResponse.json({ error: "No file key provided" }, { status: 400 });
    }

    await fs.mkdir(permanentDir, { recursive: true });

    const tempFilePath = path.join(tempDir, fileKey);
    const tempPreviewPath = path.join(tempDir, `preview-${fileKey}.jpg`);
    
    const permanentFilePath = path.join(permanentDir, fileKey);
    const permanentPreviewPath = path.join(permanentDir, `preview-${fileKey}.jpg`);

    await Promise.all([
      fs.rename(tempFilePath, permanentFilePath).catch(() => {}),
      fs.rename(tempPreviewPath, permanentPreviewPath).catch(() => {})
    ]);

    console.log("Saving creative:", {
      offerId,
      creativeType,
      fromLine,
      subjectLines,
      notes,
      fileKey,
      permanentPath: `/creatives/${fileKey}`,
      previewPath: `/creatives/preview-${fileKey}.jpg`
    });

    return NextResponse.json({ 
      success: true,
      message: "Creative saved successfully",
      filePath: `/creatives/${fileKey}`,
      previewPath: `/creatives/preview-${fileKey}.jpg`
    });
  } catch (error) {
    console.error("Save creative error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
} 