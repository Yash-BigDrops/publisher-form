import { JSDOM } from "jsdom";

export function isAbsoluteUrl(u: string) {
  return /^(https?:)?\/\//i.test(u) || /^(data:|blob:|mailto:|tel:)/i.test(u);
}

export function joinUrl(base: string, rel: string) {
  try {
    return new URL(rel, base).toString();
  } catch {
    if (base.endsWith("/") && rel.startsWith("/")) return base + rel.slice(1);
    if (!base.endsWith("/") && !rel.startsWith("/")) return `${base}/${rel}`;
    return base + rel;
  }
}

// Enhanced asset mapping for ZIP files
export interface AssetMapping {
  [relativePath: string]: string; // relativePath -> full file URL
}

// Simple in-memory store for asset mappings
const assetMappingStore = new Map<string, AssetMapping>();

export function storeAssetMapping(uploadId: string, mapping: AssetMapping) {
  assetMappingStore.set(uploadId, mapping);
}

export function getAssetMapping(uploadId: string): AssetMapping | undefined {
  return assetMappingStore.get(uploadId);
}

export function clearAssetMapping(uploadId: string) {
  assetMappingStore.delete(uploadId);
}

// Intelligent asset path resolver
function resolveAssetPath(relativePath: string, baseUrl: string, assetMapping?: AssetMapping): string {
  // If it's already an absolute URL, return as is
  if (isAbsoluteUrl(relativePath)) {
    return relativePath;
  }

  // If we have an asset mapping, use it first
  if (assetMapping && assetMapping[relativePath]) {
    return assetMapping[relativePath];
  }

  // Handle common image path patterns
  if (relativePath.includes('/')) {
    // Extract just the filename from the path
    const fileName = relativePath.split('/').pop() || relativePath;
    
    // For paths like "images/Logo.jpg", we'll try to find "Logo.jpg" in the base directory
    // This is a simplified approach that should work for most cases
    return `${baseUrl}${fileName}`;
  }

  // If no path separators, just append to base
  return `${baseUrl}${relativePath}`;
}

export function rewriteHtmlAssets(html: string, baseUrl: string, assetMapping?: AssetMapping) {
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const rewriteAttr = (selector: string, attr: "src" | "href") => {
    document.querySelectorAll(selector).forEach((el) => {
      const v = el.getAttribute(attr);
      if (!v || isAbsoluteUrl(v) || v.startsWith("#")) return;

      let newUrl: string;
      if (assetMapping && assetMapping[v]) {
        // Use the asset mapping if available
        newUrl = assetMapping[v];
      } else {
        // Use intelligent path resolution
        newUrl = resolveAssetPath(v, baseUrl, assetMapping);
      }

      el.setAttribute(attr, newUrl);
    });
  };

  rewriteAttr("img[src]", "src");
  rewriteAttr("script[src]", "src");
  rewriteAttr("link[href]", "href");

  document.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const style = el.getAttribute("style");
    if (!style) return;
    el.setAttribute("style", rewriteCssUrls(style, baseUrl, assetMapping));
  });

  document.querySelectorAll("style").forEach((styleEl) => {
    const css = styleEl.textContent || "";
    styleEl.textContent = rewriteCssUrls(css, baseUrl, assetMapping);
  });

  return dom.serialize();
}

export function rewriteCssUrls(css: string, baseUrl: string, assetMapping?: AssetMapping) {
  return css.replace(
    /url\(\s*(?:'([^']+)'|"([^"]+)"|([^'")]+))\s*\)/gi,
    (_m, s1, s2, s3) => {
      const raw = s1 || s2 || s3 || "";
      const trimmed = raw.trim();
      if (!trimmed || isAbsoluteUrl(trimmed) || trimmed.startsWith("#")) {
        return `url(${raw})`;
      }

      let newUrl: string;
      if (assetMapping && assetMapping[trimmed]) {
        // Use the asset mapping if available
        newUrl = assetMapping[trimmed];
      } else {
        // Use intelligent path resolution
        newUrl = resolveAssetPath(trimmed, baseUrl, assetMapping);
      }

      return `url(${newUrl})`;
    }
  );
}

// Function to create asset mapping from ZIP extraction results
export function createAssetMapping(
  extractedFiles: Array<{
    fileId: string;
    fileName: string;
    originalPath?: string;
    fileUrl: string;
  }>
): AssetMapping {
  const mapping: AssetMapping = {};

  extractedFiles.forEach(file => {
    // Map by original path if available
    if (file.originalPath) {
      mapping[file.originalPath] = file.fileUrl;
    }

    // Map by filename as fallback
    mapping[file.fileName] = file.fileUrl;

    // Map common image subdirectories - this is the key fix
    if (file.fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      const imageName = file.fileName;
      
      // Map various path patterns to the actual file
      mapping[`images/${imageName}`] = file.fileUrl;
      mapping[`img/${imageName}`] = file.fileUrl;
      mapping[`assets/${imageName}`] = file.fileUrl;
      mapping[`css/${imageName}`] = file.fileUrl;
      
      // Also map the filename without path for broader compatibility
      mapping[imageName] = file.fileUrl;
    }
  });

  return mapping;
}
