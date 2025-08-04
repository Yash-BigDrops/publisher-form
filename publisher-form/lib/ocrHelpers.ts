import Tesseract from "tesseract.js";

type UploadedFile = {
  file: File;
  previewUrl: string | null;
  originalUrl?: string;
  zipImages?: string[];
  currentImageIndex?: number;
  isHtml?: boolean;
  extractedContent?: string;
};

export async function extractCreativeText(
  uploadedFiles: UploadedFile[]
): Promise<string> {
  if (uploadedFiles.length === 0) return "";

  const file = uploadedFiles[0];

  console.log("Extracting text from file:", {
    name: file.file?.name || 'Unknown',
    type: file.file?.type || 'Unknown',
    size: file.file?.size ? `${(file.file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
    isHtml: file.isHtml || false,
    hasPreviewUrl: !!file.previewUrl,
    hasExtractedContent: !!file.extractedContent,
  });

  if (file.isHtml && file.previewUrl) {
    try {
      const response = await fetch(file.previewUrl);
      const html = await response.text();
      return html.replace(/<[^>]+>/g, " ");
    } catch (error) {
      console.error("Error fetching HTML content:", error);
      return "";
    }
  }

  if (file.file && file.file.type.startsWith("image/")) {
    try {
      if (file.file.size < 1024 || file.file.size > 50 * 1024 * 1024) {
        console.log("File size not suitable for OCR:", file.file.size);
        return "";
      }

      if (file.previewUrl) {
        console.log("Using preview URL for OCR:", file.previewUrl);
        const result = await Tesseract.recognize(file.previewUrl, "eng", {
          logger: (m) => {
            if (m.status === "loading tesseract core")
              console.log("Loading Tesseract core...");
            else if (m.status === "loading language traineddata")
              console.log("Loading language data...");
            else if (m.status === "initializing tesseract")
              console.log("Initializing Tesseract...");
            else if (m.status === "recognizing text")
              console.log("Recognizing text...");
            else console.log("Tesseract:", m.status);
          },
        });
        console.log("OCR completed successfully");
        const extractedText = result.data.text || "";
        console.log("Extracted text length:", extractedText.length);
        if (extractedText.length > 0) {
          console.log("First 200 characters:", extractedText.substring(0, 200));
        }
        return extractedText;
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OCR timeout")), 15000);
      });

      console.log("Using original file for OCR");
      const ocrPromise = Tesseract.recognize(file.file, "eng", {
        logger: (m) => {
          if (m.status === "loading tesseract core")
            console.log("Loading Tesseract core...");
          else if (m.status === "loading language traineddata")
            console.log("Loading language data...");
          else if (m.status === "initializing tesseract")
            console.log("Initializing Tesseract...");
          else if (m.status === "recognizing text")
            console.log("Recognizing text...");
          else console.log("Tesseract:", m.status);
        },
      });

      const result = (await Promise.race([
        ocrPromise,
        timeoutPromise,
      ])) as Awaited<ReturnType<typeof Tesseract.recognize>>;
      console.log("OCR completed successfully");
      const extractedText = result.data.text || "";
      console.log("Extracted text length:", extractedText.length);
      if (extractedText.length > 0) {
        console.log("First 200 characters:", extractedText.substring(0, 200));
      }
      return extractedText;
    } catch (error) {
      console.error("Error extracting text from image:", error);
      return "";
    }
  }

  if (file.extractedContent) {
    return file.extractedContent;
  }

  return "";
}
