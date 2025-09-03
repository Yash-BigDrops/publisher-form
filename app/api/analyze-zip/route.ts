import { NextResponse } from "next/server";
import JSZip from "jszip";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { getFilePath } from "@/lib/fileStorage";
import { Constants } from "@/app/Constants/Constants";
import { JSDOM } from "jsdom";

type AnalyzedItem = {
  id: string;
  name: string;           
  type: "image" | "html" | "other";
  size: number;
  url: string;            
  previewUrl?: string;    
  html?: boolean;
  embeddedHtml?: string;  
  entryFile?: string;     
  assets?: string[];      
};

type UploadAnalysis = {
  uploadId: string;
  isSingleCreative: boolean;
  items: AnalyzedItem[];
  counts: { images: number; htmls: number; others: number; total: number };
  summary: {
    totalSize: number;
    processingTime: number;
    warnings: string[];
    errors: string[];
  };
};

export const dynamic = "force-dynamic";

const ZIP_CONFIG = Constants.zipProcessing;
const MAX_DEPTH = ZIP_CONFIG.MAX_ZIP_DEPTH;
const MAX_ZIP_SIZE = ZIP_CONFIG.MAX_ZIP_SIZE;
const LARGE_ZIP_WARNING_THRESHOLD = ZIP_CONFIG.LARGE_ZIP_WARNING_THRESHOLD;
const MAX_FILES_PER_ZIP = ZIP_CONFIG.MAX_FILES_PER_ZIP;

// Enhanced path normalization with ZipSlip protection
const norm = (p: string) => {
  const n = p.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
  if (n.includes("..")) {
    throw new Error(`Unsafe path detected: ${p}`);
  }
  return n;
};

// Case-insensitive normalization for consistent claiming
const lc = (p: string) => norm(p).toLowerCase();

// Noise file detection
const isNoise = (p: string) => p.startsWith("__MACOSX/") || /(^|\/)\.DS_Store$/i.test(p);

// File type detection helpers
const isHtml = (p: string) => /\.html?$/i.test(p);
const isText = (p: string) => /\.txt$/i.test(p);
const isImage = (p: string) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(p);

// Helper to get parent directory
function parentDir(p: string) { 
  const a = norm(p).split("/"); 
  a.pop(); 
  return a.join("/"); 
}

// Helper to resolve relative paths
function resolveRelative(baseHtmlPath: string, ref: string) {
  if (/^(data:|https?:|mailto:|javascript:)/i.test(ref)) return null;
  const base = parentDir(baseHtmlPath);
  return norm(`${base}/${ref}`);
}

const isImg = (n: string) => ZIP_CONFIG.IMAGE_EXTENSIONS.some(ext => n.toLowerCase().endsWith(ext));
const isZip = (n: string) => /\.zip$/i.test(n);
const isAllowedFile = (n: string) => ZIP_CONFIG.ALLOWED_EXTENSIONS.some(ext => n.toLowerCase().endsWith(ext));


type WorkItem = { 
  data: ArrayBuffer; 
  basePath: string; 
  depth: number; 
  zip: JSZip;
};

type ZipEntryLite = { 
  path: string; 
  dir: boolean; 
  size: number; 
  getData?: () => Promise<ArrayBuffer>;
  originalEntry?: unknown;
};


function getTopLevelGroupKey(fullPath: string): string {
  const parts = norm(fullPath).split("/");
  if (parts.length > 1) {
    return parts[0]; 
  }
  const filename = parts[0];
  return filename.replace(/\.[^.]+$/, "");
}

// Case-insensitive file matching helper with bulletproof normalization
function buildLowerIndex<T extends { path: string; isDir?: boolean }>(files: T[]) {
  const map = new Map<string, T>();
  for (const f of files) {
    if (!f.isDir && !isNoise(f.path)) {
      map.set(lc(f.path), f);
    }
  }
  return (query: string): T | null => {
    return map.get(lc(query)) || null;
  };
}

// Enhanced security sanitization
function stripScriptsAndHandlers(html: string): string {
  // Remove <script> tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Remove inline event handlers (onclick, onload, etc.)
  html = html.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  // Remove javascript: URLs
  html = html.replace(/javascript:\s*[^"'\s>]+/gi, "#");
  // Remove data: URLs that might contain scripts
  html = html.replace(/data:\s*text\/html[^"'\s>]*/gi, "#");
  return html;
}

async function writeFile(uploadId: string, relPath: string, data: Buffer) {
  const abs = await getFilePath(uploadId, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return abs;
}

async function makeThumbIfImage(uploadId: string, rel: string, data: Buffer) {
  if (!isImg(rel)) return undefined;
  const thumbRel = `thumbs/${rel.replace(/\//g, "__")}.jpg`;
  try {
    const thumb = await sharp(data)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    await writeFile(uploadId, thumbRel, thumb);
    return thumbRel;
  } catch {
    return undefined;
  }
}

// Bulletproof asset embedding with centralized claiming
async function inlineAssetsForHtml(
  html: string, 
  htmlPath: string, 
  lookup: (q: string) => ZipEntryLite | null,
  claimed: Set<string>
): Promise<string> {
  let out = stripScriptsAndHandlers(html);
  
  const toDataURL = async (ref: string): Promise<string> => {
    const rel = resolveRelative(htmlPath, ref);
    if (!rel) return ref;
    const e = lookup(rel);
    if (!e || !e.getData) return ref;
    
    // BULLETPROOF CLAIMING: Always mark as claimed for any asset reference
    claimed.add(lc(e.path));
    
    try {
      const buf = await e.getData();
      const ext = e.path.split('.').pop()!.toLowerCase();
      const mime = getMimeType(e.path);
      return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
    } catch (error) {
      console.warn(`Failed to convert asset to data URL: ${ref}`, error);
      return ref;
    }
  };

  // Process <img src=""> attributes
  const imgSrcMatches = out.match(/(<img[^>]*\ssrc=["'])([^"']+)(["'][^>]*>)/gi);
  if (imgSrcMatches) {
    for (const match of imgSrcMatches) {
      const matchResult = match.match(/(<img[^>]*\ssrc=["'])([^"']+)(["'][^>]*>)/i);
      if (matchResult) {
        const [fullMatch, prefix, ref, suffix] = matchResult;
        const dataUrl = await toDataURL(ref);
        out = out.replace(fullMatch, prefix + dataUrl + suffix);
      }
    }
  }

  // Process srcset attributes
  const srcsetMatches = out.match(/srcset=["']([^"']+)["']/gi);
  if (srcsetMatches) {
    for (const match of srcsetMatches) {
      const matchResult = match.match(/srcset=["']([^"']+)["']/i);
      if (matchResult) {
        const [fullMatch, set] = matchResult;
        const parts = set.split(',').map((s: string) => s.trim());
        const done = await Promise.all(parts.map(async (part: string) => {
          const [u, dpr] = part.split(/\s+/);
          return `${await toDataURL(u)}${dpr ? ' ' + dpr : ''}`;
        }));
        out = out.replace(fullMatch, `srcset="${done.join(', ')}"`);
      }
    }
  }

  // Process CSS url() in style & <style>
  const urlMatches = out.match(/url\((['"]?)([^'")]+)\1\)/gi);
  if (urlMatches) {
    for (const match of urlMatches) {
      const matchResult = match.match(/url\((['"]?)([^'")]+)\1\)/i);
      if (matchResult) {
        const [fullMatch, quote, ref] = matchResult;
        const dataUrl = await toDataURL(ref);
        out = out.replace(fullMatch, `url(${quote}${dataUrl}${quote})`);
      }
    }
  }

  return out;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
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
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Performance limits for asset embedding
const MAX_EMBEDDED_SIZE_PER_CREATIVE = 10 * 1024 * 1024; 
const MAX_ASSET_SIZE = 2 * 1024 * 1024; 
const LARGE_EMBEDDED_WARNING_THRESHOLD = 5 * 1024 * 1024; 

function findHtmlEntryFile(htmlFiles: string[]): string | null {
  if (htmlFiles.length === 0) return null;
  if (htmlFiles.length === 1) return htmlFiles[0];
  
  for (const preference of ZIP_CONFIG.HTML_ENTRY_PREFERENCES) {
    const found = htmlFiles.find(file => 
      lc(file).endsWith(lc(preference))
    );
    if (found) return found;
  }
  
  return htmlFiles[0];
}


// Enhanced nested ZIP analysis with breadth-first expansion
async function analyzeNestedZipContents(
  rootZipBuffer: ArrayBuffer,
  uploadId: string
): Promise<{ items: AnalyzedItem[]; warnings: string[] }> {
  const baseUrl = `/api/files/${encodeURIComponent(uploadId)}/`;
  const queue: WorkItem[] = [];
  const allEntries: ZipEntryLite[] = [];
  let totalFiles = 0;
  let totalSize = 0;
  const warnings: string[] = [];

  try {
    const rootZip = await JSZip.loadAsync(rootZipBuffer, { createFolders: false });
    queue.push({ 
      data: rootZipBuffer, 
      basePath: "", 
      depth: 0, 
      zip: rootZip 
    });
  } catch (error) {
    throw new Error(`Invalid ZIP file format: ${error instanceof Error ? error.message : String(error)}`);
  }

  while (queue.length > 0) {
    const { data, basePath, depth, zip } = queue.shift()!;
    
    if (depth > MAX_DEPTH) {
      warnings.push(`Skipping nested ZIP at depth ${depth} (max: ${MAX_DEPTH})`);
      continue;
    }

  const entries = Object.values(zip.files);

  for (const entry of entries) {
    if (entry.dir) continue;

    try {
      const rel0 = norm(entry.name);
      const rel = norm(basePath ? `${basePath}/${rel0}` : rel0);
      
      // Skip noise files
      if (isNoise(rel)) continue;
      
      if (!isAllowedFile(rel)) continue;
      
      if (totalFiles >= MAX_FILES_PER_ZIP) {
        throw new Error(`ZIP contains too many files (max: ${MAX_FILES_PER_ZIP})`);
      }
      
      try {
        const data = await entry.async("arraybuffer");
        const size = data.byteLength;
        totalSize += size;
        
        if (totalSize > MAX_ZIP_SIZE) {
          throw new Error(`ZIP size exceeds maximum allowed size of ${MAX_ZIP_SIZE} bytes`);
        }
        
        if (isZip(rel) && depth < MAX_DEPTH) {
          try {
            const nestedZip = await JSZip.loadAsync(data, { createFolders: false });
            const nestedBasePath = rel.replace(/\.zip$/i, "");
            queue.push({ 
              data, 
              basePath: nestedBasePath, 
              depth: depth + 1, 
              zip: nestedZip 
            });
            continue;
          } catch (error) {
            warnings.push(`Failed to process nested ZIP: ${rel}`);
            continue;
          }
        }
        
        allEntries.push({
          path: rel,
          dir: false,
          size,
          getData: async () => data,
          originalEntry: entry
        });
        
        totalFiles++;
      } catch (error) {
        console.warn(`Failed to process file: ${rel}`, error);
      }
    } catch (error) {
      console.warn(`Failed to normalize path: ${entry.name}`, error);
    }
  }
  }

  // Group entries into creatives with enhanced path handling
  const groups = new Map<string, ZipEntryLite[]>();
  for (const entry of allEntries) {
    if (entry.dir) continue;
    try {
      const key = getTopLevelGroupKey(entry.path);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    } catch (error) {
      console.warn(`Failed to group entry: ${entry.path}`, error);
    }
  }

  const analyzedItems: AnalyzedItem[] = [];
  const claimed = new Set<string>(); // Global claimed set for all assets
  
  for (const [groupKey, entries] of groups) {
    const files = entries.filter(e => !e.dir);
    if (!files.length) continue;

    const htmls = files.filter(f => isHtml(f.path));
    const images = files.filter(f => isImg(f.path));
    const texts = files.filter(f => isText(f.path));
    const others = files.filter(f => !isHtml(f.path) && !isImg(f.path) && !isText(f.path));

    // Per-creative .txt rule: ignore .txt files when HTML exists in the same group
    const effectiveFiles = htmls.length > 0 
      ? files.filter(f => !isText(f.path)) 
      : files;

    let entryFile: ZipEntryLite | undefined;
    let creativeType: "image" | "html" | "other";
    
    if (htmls.length > 0) {
      const htmlPaths = htmls.map(h => h.path);
      const preferredHtml = findHtmlEntryFile(htmlPaths);
      entryFile = htmls.find(h => h.path === preferredHtml) || htmls[0];
      creativeType = "html";
    } else if (images.length > 0) {
      entryFile = images[0];
      creativeType = "image";
    } else {
      entryFile = effectiveFiles[0];
      creativeType = "other";
    }

    if (!entryFile) continue;

    let totalCreativeSize = 0;
    for (const file of effectiveFiles) {
      totalCreativeSize += file.size;
      if (file.getData) {
        const data = Buffer.from(await file.getData());
        await writeFile(uploadId, file.path, data);
      }
    }

    const item: AnalyzedItem = {
      id: uploadId,
      name: entryFile.path,
      type: creativeType,
      size: totalCreativeSize,
      url: baseUrl + entryFile.path,
      html: creativeType === "html",
      entryFile: entryFile.path,
      assets: effectiveFiles
        .filter(f => f !== entryFile)
        .map(f => f.path)
    };

    if (creativeType === "image" && entryFile.getData) {
      try {
        const data = Buffer.from(await entryFile.getData());
        const thumbRel = await makeThumbIfImage(uploadId, entryFile.path, data);
      item.previewUrl = thumbRel ? baseUrl + thumbRel : item.url;
      } catch (error) {
        console.warn(`Failed to generate thumbnail for ${entryFile.path}:`, error);
      }
    }

    if (creativeType === "html" && entryFile.getData) {
      try {
        const htmlBuffer = await entryFile.getData();
        const htmlContent = new TextDecoder("utf-8", { fatal: false }).decode(htmlBuffer);
        
        const lookup = buildLowerIndex(effectiveFiles);
        const embeddedHtml = await inlineAssetsForHtml(htmlContent, entryFile.path, lookup, claimed);
        item.embeddedHtml = embeddedHtml;
      } catch (error) {
        console.warn(`Failed to embed assets for ${groupKey}:`, error);
        warnings.push(`Failed to embed assets for ${groupKey}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    analyzedItems.push(item);
  }

  // Add unclaimed images as standalone creatives
  for (const entry of allEntries) {
    if (entry.dir) continue;
    
    const normalizedPath = lc(entry.path);
    if (isImage(entry.path) && !claimed.has(normalizedPath)) {
      const item: AnalyzedItem = {
        id: uploadId,
        name: entry.path,
        type: "image",
        size: entry.size,
        url: baseUrl + entry.path,
        previewUrl: baseUrl + entry.path
      };

      // Generate thumbnail if possible
      if (entry.getData) {
        try {
          const data = Buffer.from(await entry.getData());
          const thumbRel = await makeThumbIfImage(uploadId, entry.path, data);
          if (thumbRel) {
            item.previewUrl = baseUrl + thumbRel;
          }
        } catch (error) {
          console.warn(`Failed to generate thumbnail for unclaimed image ${entry.path}:`, error);
        }
      }

      analyzedItems.push(item);
    }
  }

  return { items: analyzedItems, warnings };
}



export async function POST(req: Request) {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "ZIP file is required" }, { status: 400 });
    }

    const fileType = file.type;
    if (!ZIP_CONFIG.ALLOWED_ZIP_TYPES.includes(fileType) && fileType !== '') {
      warnings.push(`Unexpected file type: ${fileType}. Proceeding with analysis.`);
    }

    const fileSize = file.size;
    if (fileSize > MAX_ZIP_SIZE) {
      return NextResponse.json(
        { error: `File size (${fileSize} bytes) exceeds maximum allowed size (${MAX_ZIP_SIZE} bytes)` },
        { status: 400 }
      );
    }

    // Add warning for large but acceptable ZIP files
    if (fileSize > LARGE_ZIP_WARNING_THRESHOLD) {
      warnings.push(`Large ZIP file detected (${Math.round(fileSize / 1024 / 1024)}MB). Processing may take longer and previews might be slower.`);
    }

    const uploadId = crypto.randomUUID();
    const fileBuffer = await file.arrayBuffer();
    
    const { items: allItems, warnings: analysisWarnings } = await analyzeNestedZipContents(fileBuffer, uploadId);
    warnings.push(...analysisWarnings);

    if (allItems.length === 0) {
      return NextResponse.json(
        { error: "No valid creatives found in ZIP file" },
        { status: 400 }
      );
    }

    const images = allItems.filter(i => i.type === "image").length;
    const htmls = allItems.filter(i => i.type === "html").length;
    const others = allItems.filter(i => i.type === "other").length;
    const totalSize = allItems.reduce((sum, item) => sum + item.size, 0);

    const isSingleCreative = allItems.length === 1;

    if (htmls > 0 && images > 0) {
      warnings.push("ZIP contains both HTML and image creatives. HTML creatives will be prioritized.");
    }
    
    if (others > 0) {
      warnings.push(`${others} non-creative files were found and included.`);
    }

    const processingTime = Date.now() - startTime;

    const analysis: UploadAnalysis = {
      uploadId,
      isSingleCreative,
      items: allItems,
      counts: { images, htmls, others, total: allItems.length },
      summary: {
        totalSize,
        processingTime,
        warnings,
        errors
      }
    };

    return NextResponse.json(analysis, { status: 200 });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('ZIP analysis failed:', error);
    
    return NextResponse.json(
      { 
        error: "ZIP analysis failed", 
        detail: errorMessage,
        summary: {
          totalSize: 0,
          processingTime,
          warnings,
          errors: [...errors, errorMessage]
        }
      },
      { status: 500 }
    );
  }
}
