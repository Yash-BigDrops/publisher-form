import imageCompression from "browser-image-compression";

export async function uploadToBlob(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  const { url } = await response.json();
  return url;
}

export async function createCompressedPreview(file: File) {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1000,
    useWebWorker: true,
  };
  return await imageCompression(file, options);
} 