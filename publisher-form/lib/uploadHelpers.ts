import { put } from "@vercel/blob";
import imageCompression from "browser-image-compression";

export async function uploadToBlob(file: File) {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const uniqueFileName = `${fileNameWithoutExt}_${timestamp}_${randomSuffix}.${fileExtension}`;

    const { url } = await put(uniqueFileName, file, {
      access: "public",
      contentType: file.type,
    });

    return url;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload file");
  }
}

export async function createCompressedPreview(file: File) {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1000,
    useWebWorker: true,
  };
  return await imageCompression(file, options);
} 