import JSZip from "jszip";
import { ExtractedCreative } from "@/types/creative";
import { ACCEPTED_IMAGE_EXTENSIONS, MAX_ZIP_DEPTH, RESPONSIVE_STYLE, DEFAULT_HTML_TEMPLATE } from "@/constants/creative";

export const isImageFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  return ACCEPTED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export const normalizePath = (p: string) => p.replace(/\\/g, "/").toLowerCase();

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export async function extractCreativesFromZip(
  zipBlob: Blob,
  depth = 0
): Promise<ExtractedCreative[]> {
  if (depth > MAX_ZIP_DEPTH) return [];

  const jszip = new JSZip();
  const zipData = await jszip.loadAsync(zipBlob);
  let creatives: ExtractedCreative[] = [];
  const usedImages = new Set<string>();

  const htmlFiles: { path: string; content: string }[] = [];
  
  // First pass: collect HTML files and their image references
  for (const [path, entry] of Object.entries(zipData.files)) {
    if (entry.dir) continue;
    const lowerPath = normalizePath(path);

    if (lowerPath.endsWith(".html")) {
      const htmlContent = await entry.async("string");
      htmlFiles.push({ path, content: htmlContent });

      const imgMatches = [
        ...htmlContent.matchAll(/src=["']([^"']+)["']/gi),
        ...htmlContent.matchAll(/background=["']([^"']+)["']/gi),
        ...htmlContent.matchAll(/url\(["']?([^"']+)["']?\)/gi),
        ...htmlContent.matchAll(
          /background-image:\s*url\(["']?([^"']+)["']?\)/gi
        ),
        ...htmlContent.matchAll(
          /["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi
        ),
      ].map((m) => m[1]);

      console.log("🔍 Found image references in HTML:", imgMatches);

      imgMatches.forEach((imgPath) => {
        if (
          imgPath &&
          !imgPath.startsWith("data:") &&
          !imgPath.startsWith("http") &&
          !imgPath.startsWith("#")
        ) {
          const normalizedPath = normalizePath(imgPath);
          const fileName = normalizePath(imgPath.split("/").pop() || "");
          const fileNameWithoutExt = fileName.split(".")[0];

          usedImages.add(fileName);
          usedImages.add(normalizedPath);
          usedImages.add(fileNameWithoutExt);

          console.log(
            `📸 Added image paths: "${fileName}", "${normalizedPath}", "${fileNameWithoutExt}"`
          );
        }
      });
    }
  }

  // Second pass: process HTML files and inline images
  for (const { content } of htmlFiles) {
    let htmlContent = content;

    // Inline CSS files
    const cssLinks = [
      ...htmlContent.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi),
    ];
    for (const [, cssPath] of cssLinks) {
      const cssEntryKey = Object.keys(zipData.files).find((k) =>
        normalizePath(k).endsWith(normalizePath(cssPath))
      );
      if (cssEntryKey) {
        try {
          const cssContent = await zipData.files[cssEntryKey].async("string");
          htmlContent = htmlContent.replace(
            new RegExp(
              `<link[^>]+${cssPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*>`,
              "i"
            ),
            `<style>${cssContent}</style>`
          );
        } catch (error) {
          console.warn(`Failed to inline CSS file: ${cssPath}`, error);
        }
      }
    }

    console.log("🔄 Starting simplified image inlining process...");
    console.log("📋 Images to look for:", Array.from(usedImages));
    console.log("📁 Available files in ZIP:", Object.keys(zipData.files));

    // Inline images
    for (const imgName of usedImages) {
      console.log(`🔍 Looking for image: "${imgName}"`);

      let imgKey = Object.keys(zipData.files).find((k) =>
        normalizePath(k).endsWith(normalizePath(imgName))
      );

      if (!imgKey && imgName.includes("/")) {
        const fileName = imgName.split("/").pop();
        if (fileName) {
          imgKey = Object.keys(zipData.files).find((k) =>
            normalizePath(k).endsWith(normalizePath(fileName))
          );
          console.log(`🔍 Retrying with filename only: "${fileName}"`);
        }
      }

      if (!imgKey) {
        imgKey = Object.keys(zipData.files).find((k) =>
          normalizePath(k).includes(normalizePath(imgName))
        );
        console.log(`🔍 Retrying with partial match: "${imgName}"`);
      }

      if (imgKey) {
        console.log(`✅ Found image: "${imgName}" -> "${imgKey}"`);
        try {
          const ext = imgKey.split(".").pop()?.toLowerCase() || "jpeg";
          const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

          const imgBase64 = await zipData.files[imgKey].async("base64");
          const imgSize = imgBase64.length;

          console.log(
            `🔄 Processing image: ${imgName} (${mimeType}, ${imgSize} chars)`
          );

          const escapedImgName = imgName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          // Replace img src attributes
          const imgSrcRegex = new RegExp(
            `src=["']([^"']*${escapedImgName}[^"']*)["']`,
            "gi"
          );
          const imgSrcMatches = htmlContent.match(imgSrcRegex) || [];
          htmlContent = htmlContent.replace(
            imgSrcRegex,
            `src="data:${mimeType};base64,${imgBase64}"`
          );
          console.log(`✅ Replaced ${imgSrcMatches.length} img src references`);

          // Replace CSS background references
          const bgRegex = new RegExp(
            `url\\(["']?[^"']*${escapedImgName}[^"']*["']?\\)`,
            "gi"
          );
          const bgMatches = htmlContent.match(bgRegex) || [];
          htmlContent = htmlContent.replace(
            bgRegex,
            `url("data:${mimeType};base64,${imgBase64}")`
          );
          console.log(
            `✅ Replaced ${bgMatches.length} CSS background references`
          );

          // Replace remaining references
          const remainingRegex = new RegExp(`(${escapedImgName})`, "gi");
          const remainingMatches = htmlContent.match(remainingRegex) || [];
          htmlContent = htmlContent.replace(
            remainingRegex,
            `data:${mimeType};base64,${imgBase64}`
          );
          console.log(
            `✅ Replaced ${remainingMatches.length} remaining references`
          );

          // Handle filename-only references
          const fileName = imgName.split("/").pop() || imgName;
          if (fileName !== imgName) {
            const escapedFileName = fileName.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            const fileNameRegex = new RegExp(
              `src=["']([^"']*${escapedFileName}[^"']*)["']`,
              "gi"
            );
            const fileNameMatches = htmlContent.match(fileNameRegex) || [];
            htmlContent = htmlContent.replace(
              fileNameRegex,
              `src="data:${mimeType};base64,${imgBase64}"`
            );
            console.log(
              `✅ Replaced ${fileNameMatches.length} filename-only references`
            );
          }

          console.log(`✅ Successfully inlined image: ${imgName}`);
        } catch (error) {
          console.warn(`❌ Failed to process image: ${imgName}`, error);
        }
      } else {
        console.warn(`❌ Image not found in ZIP: "${imgName}"`);
        console.log(`🔍 Available files:`, Object.keys(zipData.files));
      }
    }

    // Add HTML structure if missing
    if (!htmlContent.includes("<html")) {
      htmlContent = DEFAULT_HTML_TEMPLATE.replace("</body>", `${htmlContent}</body>`);
    }

    // Add responsive styles
    if (htmlContent.includes("<head>")) {
      htmlContent = htmlContent.replace("<head>", `<head>${RESPONSIVE_STYLE}`);
    } else if (htmlContent.includes("<html>")) {
      htmlContent = htmlContent.replace(
        "<html>",
        `<html><head>${RESPONSIVE_STYLE}</head>`
      );
    }

    console.log("📄 Final HTML content length:", htmlContent.length);
    console.log("📄 HTML contains images:", htmlContent.includes("data:image"));
    console.log("📄 HTML contains img tags:", htmlContent.includes("<img"));

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    creatives.push({ type: "html", url, htmlContent });
  }

  const hasHtmlFiles = htmlFiles.length > 0;
  console.log(`📊 Found ${htmlFiles.length} HTML files in ZIP`);

  if (!hasHtmlFiles) {
    console.log("📸 No HTML files found, processing standalone images...");
    for (const [path, entry] of Object.entries(zipData.files)) {
      if (entry.dir) continue;
      const lowerPath = normalizePath(path);

      if (/\.(png|jpg|jpeg|gif|webp)$/i.test(lowerPath)) {
        if (
          usedImages.has(lowerPath) ||
          usedImages.has(lowerPath.split("/").pop() || "")
        )
          continue;
        const blob = await entry.async("blob");
        const url = URL.createObjectURL(blob);
        creatives.push({ type: "image", url });
        console.log(`✅ Added standalone image: ${path}`);
      }

      if (lowerPath.endsWith(".zip")) {
        const innerBlob = await entry.async("blob");
        const innerCreatives: ExtractedCreative[] =
          await extractCreativesFromZip(innerBlob, depth + 1);
        creatives = creatives.concat(innerCreatives);
      }
    }
  } else {
    console.log(
      "🚫 HTML files found, skipping standalone images to avoid duplication"
    );
  }

  console.log(
    `📊 ZIP processing complete: ${creatives.length} creatives extracted`
  );
  console.log(
    `📊 Breakdown: ${creatives.filter((c) => c.type === "html").length} HTML creatives, ${creatives.filter((c) => c.type === "image").length} image creatives`
  );

  return creatives;
} 