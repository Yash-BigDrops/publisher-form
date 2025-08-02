import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const tempDir = path.join(process.cwd(), "public", "temp-uploads");

// Helper function to check if file is an image
const isImageFile = (file: File): boolean => {
  const acceptedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const fileName = file.name.toLowerCase();
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  return acceptedImageExtensions.some((ext) => fileName.endsWith(ext));
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    await fs.mkdir(tempDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileKey = `${Date.now()}-${file.name}`;
    const filePath = path.join(tempDir, fileKey);

    await fs.writeFile(filePath, buffer);

    let previewUrl: string | null = null;

    // Only create preview for image files
    if (isImageFile(file)) {
      try {
        const previewKey = `preview-${fileKey}.jpg`;
        const previewPath = path.join(tempDir, previewKey);

        await sharp(buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(previewPath);

        previewUrl = `/temp-uploads/${previewKey}`;
      } catch (previewError) {
        console.error("Preview generation failed:", previewError);
        // Continue without preview if image processing fails
      }
    }

    return NextResponse.json({
      fileKey,
      fullUrl: `/temp-uploads/${fileKey}`,
      previewUrl: previewUrl || null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
} 