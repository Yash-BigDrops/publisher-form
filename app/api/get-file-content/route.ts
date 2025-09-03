import { NextResponse } from "next/server";
import { getAssetMapping } from "@/lib/assetRewriter";
import { resolveAssetInUpload } from "@/lib/uploadAssetIndex";
import { JSDOM } from "jsdom";
import { getFilePath } from "@/lib/fileStorage";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

function getMimeType(ext: string): string {
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

async function rewriteHtmlAssetsWithUploadIndex(
  html: string, 
  baseUrl: string, 
  assetMapping: Record<string, string> | undefined, 
  uploadId: string, 
  htmlFileId: string
): Promise<string> {
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const toDataURL = async (assetRef: string): Promise<string> => {
    
    if (/^(data:|https?:|mailto:|javascript:)/i.test(assetRef)) {
      return assetRef;
    }

    if (uploadId) {
      console.log(`[ASSET DEBUG] Resolving asset: ${assetRef}, uploadId: ${uploadId}, htmlFileId: ${htmlFileId}`);
      const assetEntry = resolveAssetInUpload(uploadId, htmlFileId, assetRef);
      console.log(`[ASSET DEBUG] Asset entry found:`, assetEntry);
      
      if (assetEntry) {
        // Try direct file URL first (preferred method)
        const directUrl = `/api/files/${assetEntry.fileId}/${assetEntry.name}`;
        console.log(`[ASSET DEBUG] Trying direct URL: ${directUrl}`);
        
        // Use direct URL (no base64 fallback)
        console.log(`[ASSET DEBUG] Using direct URL: ${directUrl}`);
        return directUrl;
      } else {
        console.log(`[ASSET DEBUG] No asset entry found for ${assetRef} in uploadId ${uploadId}`);
      }
    } else {
      console.log(`[ASSET DEBUG] No uploadId provided for asset resolution`);
    }

    if (assetMapping && assetMapping[assetRef]) {
      return assetMapping[assetRef];
    }

    return `${baseUrl}${assetRef}`;
  };

  const imgElements = document.querySelectorAll('img[src]');
  for (const img of imgElements) {
    const src = img.getAttribute('src');
    if (src && !/^(data:|https?:|mailto:|javascript:)/i.test(src)) {
      const newSrc = await toDataURL(src);
      img.setAttribute('src', newSrc);
    }
  }

  const srcsetElements = document.querySelectorAll('[srcset]');
  for (const element of srcsetElements) {
    const srcset = element.getAttribute('srcset');
    if (srcset) {
      const parts = srcset.split(',').map(s => s.trim());
      const newParts = await Promise.all(parts.map(async (part) => {
        const [url, descriptor] = part.split(/\s+/);
        const newUrl = await toDataURL(url);
        return descriptor ? `${newUrl} ${descriptor}` : newUrl;
      }));
      element.setAttribute('srcset', newParts.join(', '));
    }
  }

  const styleElements = document.querySelectorAll('[style]');
  for (const element of styleElements) {
    const style = element.getAttribute('style');
    if (style) {
      const newStyle = await rewriteCssUrlsAsync(style, toDataURL);
      element.setAttribute('style', newStyle);
    }
  }

  const styleBlocks = document.querySelectorAll('style');
  for (const styleBlock of styleBlocks) {
    const css = styleBlock.textContent || '';
    const newCss = await rewriteCssUrlsAsync(css, toDataURL);
    styleBlock.textContent = newCss;
  }

  return dom.serialize();
}

async function rewriteCssUrlsAsync(css: string, toDataURL: (ref: string) => Promise<string>): Promise<string> {
  const urlRegex = /url\(\s*(?:'([^']+)'|"([^"]+)"|([^'")]+))\s*\)/gi;
  const matches = Array.from(css.matchAll(urlRegex));
  
  let result = css;
  for (const match of matches) {
    const [fullMatch, s1, s2, s3] = match;
    const raw = s1 || s2 || s3 || '';
    const trimmed = raw.trim();
    
    if (trimmed && !/^(data:|https?:|mailto:|javascript:)/i.test(trimmed)) {
      const newUrl = await toDataURL(trimmed);
      result = result.replace(fullMatch, `url(${newUrl})`);
    }
  }
  
  return result;
}



export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId") || "";
    const fileUrl = searchParams.get("fileUrl") || "";
    const processAssets = (searchParams.get("processAssets") || "false") === "true";
    const uploadId = searchParams.get("uploadId") || "";
    const embeddedHtml = searchParams.get("embeddedHtml"); 
    
    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    // If embedded HTML is provided, use it directly (images already embedded)
    if (embeddedHtml) {
      return new NextResponse(embeddedHtml, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const decoded = decodeURIComponent(fileUrl);
    const inferredName = decoded.split("/").filter(Boolean).slice(-1)[0] || "index.html";

    const absPath = await getFilePath(fileId, inferredName);
    const html = await readFile(absPath, "utf8");

    if (!processAssets) {
      return new NextResponse(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const origin = process.env.NEXT_PUBLIC_BASE_PATH
      ? new URL(process.env.NEXT_PUBLIC_BASE_PATH, req.url).toString().replace(/\/$/, "")
      : new URL(req.url).origin;

    const base = `${origin}/api/files/${encodeURIComponent(fileId)}/`;

    let assetMapping = undefined;
    if (uploadId) {
      assetMapping = getAssetMapping(uploadId);
    }

    const rewritten = await rewriteHtmlAssetsWithUploadIndex(html, base, assetMapping, uploadId, fileId);

    return new NextResponse(rewritten, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "failed to load content", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
