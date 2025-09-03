import JSZip from 'jszip';
import { detectFileType } from '@/lib/security/fileType';
import { scanBufferWithClamAV } from '@/lib/security/clamav';
import { sha256 } from '@/lib/security/checksums';
import { saveBuffer } from '@/lib/fileStorage';
import { makeImagePreview, makeHtmlPreview } from '@/lib/preview';

export type ZipProcessOptions = {
  allow: Set<string>;
  maxFiles: number;
  maxTotalBytes: number;
  maxDepth: number;
  perFileMaxBytes?: number;
  enableVirusScan?: boolean;
  dedup?: boolean;
  prioritizeHtml?: boolean; 

  onEntry?: (info: { path: string; index: number; total: number }) => void;
  onProgress?: (pct: number) => void; 
};

// Function to check if a file is Mac metadata
function isMacMetadata(path: string, fileName: string): boolean {
  // Filter out Mac-specific metadata files
  if (fileName.startsWith('._') || fileName.startsWith('.DS_Store')) return true;
  if (path.includes('__MACOSX/')) return true;
  if (path.includes('/._')) return true;
  
  // Filter out AppleDouble files and other Mac metadata
  if (fileName.includes('com.apple.') || fileName.includes('ATTR')) return true;
  
  return false;
}

// Function to get file priority for sorting (higher number = higher priority)
function getFilePriority(fileName: string, mime: string): number {
  if (mime === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) return 10;
  if (mime.startsWith('image/')) return 8;
  if (mime === 'application/pdf') return 6;
  if (mime === 'text/plain' || fileName.endsWith('.txt')) return 2;
  return 1; // Default priority for other file types
}

export async function processZipBuffer(zipBuf: Buffer, opts: ZipProcessOptions, depth = 0, seenHashes?: Set<string>) {
  if (depth > opts.maxDepth) return { extracted: [], totalBytes: 0, skipped: [{ reason: 'depth-limit' }] };

  const zip = await JSZip.loadAsync(zipBuf).catch(() => null);
  if (!zip) return { extracted: [], totalBytes: 0, skipped: [{ reason: 'corrupted-zip' }] };

  const extracted: Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    hash: string;
    depth: number;
    previewUrl?: string;
    priority: number;
    originalPath?: string;
    embeddedHtml?: string; // For HTML files with embedded images
  }> = [];
  const skipped: Array<{
    path?: string;
    reason: string;
  }> = [];
  let totalBytes = 0;
  let count = 0;
  const dedupSet = seenHashes ?? new Set<string>();

  const entries = Object.entries(zip.files);
  const totalCount = Math.min(entries.length, opts.maxFiles);
  let processed = 0;

  // First pass: collect all files and group them by folder
  const allFiles: Array<{
    path: string;
    entry: JSZip.JSZipObject;
    fileName: string;
    mime: string;
    buf: Buffer;
    hash: string;
    previewUrl?: string;
  }> = [];

  for (const [path, entry] of entries) {
    if ((entry as JSZip.JSZipObject).dir) continue;
    
    const fileName = path.split('/').pop() || 'file';
    
    // Skip Mac metadata files
    if (isMacMetadata(path, fileName)) {
      skipped.push({ path, reason: 'mac-metadata' });
      continue;
    }
    
    count++;
    processed++;
    
    opts.onEntry?.({ path, index: processed, total: totalCount });
    if (opts.onProgress) {
      const pct = Math.round((processed / totalCount) * 50); 
      opts.onProgress(pct);
    }
    
    if (count > opts.maxFiles) { skipped.push({ path, reason: 'file-count-limit' }); break; }
    if (path.includes('..')) { skipped.push({ path, reason: 'path-traversal' }); continue; }

    let buf: Buffer;
    try { buf = await (entry as JSZip.JSZipObject).async('nodebuffer'); }
    catch { skipped.push({ path, reason: 'extract-failed' }); continue; }

    totalBytes += buf.length;
    if (totalBytes > opts.maxTotalBytes) { skipped.push({ path, reason: 'total-size-limit' }); break; }
    if (opts.perFileMaxBytes && buf.length > opts.perFileMaxBytes) { skipped.push({ path, reason: 'per-file-size-limit' }); continue; }

    const { mime } = await detectFileType(buf, path);

    if (mime === 'application/zip') {
      const nested = await processZipBuffer(buf, opts, depth + 1, dedupSet);
      extracted.push(...nested.extracted);
      skipped.push(...nested.skipped);
      totalBytes += nested.totalBytes;
      continue;
    }

    if (!opts.allow.has(mime)) { skipped.push({ path, reason: `disallowed-mime:${mime}` }); continue; }

    if (opts.enableVirusScan) {
      const verdict = await scanBufferWithClamAV(buf);
      if (verdict !== 'OK') { skipped.push({ path, reason: `virus:${verdict}` }); continue; }
    }

    const hash = sha256(buf);
    if (opts.dedup && dedupSet.has(hash)) { skipped.push({ path, reason: 'duplicate' }); continue; }
    dedupSet.add(hash);

    // Generate preview for images and HTML files
    let previewUrl: string | undefined;
    if (mime.startsWith('image/') && mime !== 'image/svg+xml') {
      const thumb = await makeImagePreview(buf, 400);
      if (thumb) {
        const prev = await saveBuffer(thumb, `preview_${fileName}.jpg`);
        previewUrl = `/api/files/${prev.id}/${prev.fileName}`;
      }
    } else if (mime === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      const htmlContent = buf.toString('utf-8');
      const htmlPreview = await makeHtmlPreview(htmlContent, 400, 300);
      if (htmlPreview) {
        const prev = await saveBuffer(htmlPreview, `preview_${fileName}.jpg`);
        previewUrl = `/api/files/${prev.id}/${prev.fileName}`;
      }
    }

    allFiles.push({
      path,
      entry: entry as JSZip.JSZipObject,
      fileName,
      mime,
      buf,
      hash,
      previewUrl
    });
  }

  // Second pass: group files by folder and apply creative grouping logic
  const folderGroups = new Map<string, typeof allFiles>();
  const rootFiles: typeof allFiles = [];

  for (const file of allFiles) {
    const pathParts = file.path.split('/');
    if (pathParts.length === 1) {
      // Root level file
      rootFiles.push(file);
    } else {
      // File in a folder
      const folderPath = pathParts[0];
      if (!folderGroups.has(folderPath)) {
        folderGroups.set(folderPath, []);
      }
      folderGroups.get(folderPath)!.push(file);
    }
  }

  // Process root files
  await processRootFiles(rootFiles, extracted, skipped, dedupSet, opts);

  // Process each folder group
  for (const [folderPath, files] of folderGroups.entries()) {
    await processCreativeGroup(folderPath, files, extracted, skipped, dedupSet, opts);
  }

  // Sort by priority if HTML prioritization is enabled
  if (opts.prioritizeHtml) {
    extracted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  opts.onProgress?.(95);

  return { extracted, totalBytes, skipped };
}

// Process root-level files (same logic as folder groups)
async function processRootFiles(
  files: Array<{
    path: string;
    entry: JSZip.JSZipObject;
    fileName: string;
    mime: string;
    buf: Buffer;
    hash: string;
    previewUrl?: string;
  }>,
  extracted: Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    hash: string;
    depth: number;
    previewUrl?: string;
    priority: number;
    originalPath?: string;
    embeddedHtml?: string;
  }>,
  skipped: Array<{ path?: string; reason: string }>,
  dedupSet: Set<string>,
  opts: ZipProcessOptions
): Promise<void> {
  const htmlFiles = files.filter(f => f.mime === 'text/html' || f.fileName.endsWith('.html') || f.fileName.endsWith('.htm'));
  const imageFiles = files.filter(f => f.mime.startsWith('image/'));
  
  if (htmlFiles.length > 0) {
    // If there are HTML files, process them and embed images
    for (const htmlFile of htmlFiles) {
      try {
        const htmlContent = htmlFile.buf.toString('utf-8');
        const processedHtmlContent = await embedImagesInHTML(htmlContent, imageFiles, '');
        
        const baseName = htmlFile.fileName;
        const { id, fileName: savedFileName } = await saveBuffer(htmlFile.buf, baseName);
        
        // Generate HTML preview
        let previewUrl: string | undefined;
        const htmlPreview = await makeHtmlPreview(processedHtmlContent, 400, 300);
        if (htmlPreview) {
          const prev = await saveBuffer(htmlPreview, `preview_${savedFileName}.jpg`);
          previewUrl = `/api/files/${prev.id}/${prev.fileName}`;
        }
        
        const priority = getFilePriority(htmlFile.fileName, htmlFile.mime);
        
        extracted.push({
          fileId: id,
          fileName: savedFileName,
          fileUrl: `/api/files/${id}/${savedFileName}`,
          fileSize: htmlFile.buf.length,
          fileType: htmlFile.mime,
          hash: htmlFile.hash,
          depth: 0,
          previewUrl,
          priority,
          originalPath: htmlFile.path,
          embeddedHtml: processedHtmlContent
        });
        

      } catch (error) {
        console.error(`[ROOT FILES] Error processing HTML file ${htmlFile.path}:`, error);
        skipped.push({ path: htmlFile.path, reason: 'html-processing-failed' });
      }
    }
  } else {
    // If no HTML files, process images as separate creatives
    for (const imageFile of imageFiles) {
      try {
        const baseName = imageFile.fileName;
        const { id, fileName: savedFileName } = await saveBuffer(imageFile.buf, baseName);
        
        const priority = getFilePriority(imageFile.fileName, imageFile.mime);
        
        extracted.push({
          fileId: id,
          fileName: savedFileName,
          fileUrl: `/api/files/${id}/${savedFileName}`,
          fileSize: imageFile.buf.length,
          fileType: imageFile.mime,
          hash: imageFile.hash,
          depth: 0,
          previewUrl: imageFile.previewUrl,
          priority,
          originalPath: imageFile.path
        });
        

      } catch (error) {
        console.error(`[ROOT FILES] Error processing image file ${imageFile.path}:`, error);
        skipped.push({ path: imageFile.path, reason: 'image-processing-failed' });
      }
    }
  }
}

// Process a creative group (folder) with HTML + image logic
async function processCreativeGroup(
  groupName: string,
  files: Array<{
    path: string;
    entry: JSZip.JSZipObject;
    fileName: string;
    mime: string;
    buf: Buffer;
    hash: string;
    previewUrl?: string;
  }>,
  extracted: Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    hash: string;
    depth: number;
    previewUrl?: string;
    priority: number;
    originalPath?: string;
    embeddedHtml?: string;
  }>,
  skipped: Array<{ path?: string; reason: string }>,
  dedupSet: Set<string>,
  opts: ZipProcessOptions
): Promise<void> {
  const htmlFiles = files.filter(f => f.mime === 'text/html' || f.fileName.endsWith('.html') || f.fileName.endsWith('.htm'));
  const imageFiles = files.filter(f => f.mime.startsWith('image/'));
  
  if (htmlFiles.length > 0) {
    // If there are HTML files, process them and embed images (hide images as separate creatives)
    for (const htmlFile of htmlFiles) {
      try {
        const htmlContent = htmlFile.buf.toString('utf-8');
        const processedHtmlContent = await embedImagesInHTML(htmlContent, imageFiles, groupName);
        
        const baseName = htmlFile.fileName;
        const { id, fileName: savedFileName } = await saveBuffer(htmlFile.buf, baseName);
        
        // Generate HTML preview
        let previewUrl: string | undefined;
        const htmlPreview = await makeHtmlPreview(processedHtmlContent, 400, 300);
        if (htmlPreview) {
          const prev = await saveBuffer(htmlPreview, `preview_${savedFileName}.jpg`);
          previewUrl = `/api/files/${prev.id}/${prev.fileName}`;
        }
        
        const priority = getFilePriority(htmlFile.fileName, htmlFile.mime);
        
        extracted.push({
          fileId: id,
          fileName: savedFileName,
          fileUrl: `/api/files/${id}/${savedFileName}`,
          fileSize: htmlFile.buf.length,
          fileType: htmlFile.mime,
          hash: htmlFile.hash,
          depth: 0,
          previewUrl,
          priority,
          originalPath: htmlFile.path,
          embeddedHtml: processedHtmlContent
        });
        

      } catch (error) {
        console.error(`[FOLDER GROUP] ${groupName}: Error processing HTML file ${htmlFile.path}:`, error);
        skipped.push({ path: htmlFile.path, reason: 'html-processing-failed' });
      }
    }
  } else {
    // If no HTML files, process images as separate creatives
    for (const imageFile of imageFiles) {
      try {
        const baseName = imageFile.fileName;
        const { id, fileName: savedFileName } = await saveBuffer(imageFile.buf, baseName);
        
        const priority = getFilePriority(imageFile.fileName, imageFile.mime);
        
        extracted.push({
          fileId: id,
          fileName: savedFileName,
          fileUrl: `/api/files/${id}/${savedFileName}`,
          fileSize: imageFile.buf.length,
          fileType: imageFile.mime,
          hash: imageFile.hash,
          depth: 0,
          previewUrl: imageFile.previewUrl,
          priority,
          originalPath: imageFile.path
        });
        

      } catch (error) {
        console.error(`[FOLDER GROUP] ${groupName}: Error processing image file ${imageFile.path}:`, error);
        skipped.push({ path: imageFile.path, reason: 'image-processing-failed' });
      }
    }
  }
}

// Embed images into HTML content (using direct file URLs instead of base64)
async function embedImagesInHTML(
  htmlContent: string,
  imageFiles: Array<{
    path: string;
    entry: JSZip.JSZipObject;
    fileName: string;
    mime: string;
    buf: Buffer;
    hash: string;
    previewUrl?: string;
  }>,
  groupName: string
): Promise<string> {
  let processedHTML = htmlContent;
  
  for (const imageFile of imageFiles) {
    try {
      // Save the image file and get its URL
      const baseName = imageFile.fileName;
      const { id, fileName: savedFileName } = await saveBuffer(imageFile.buf, baseName);
      const imageUrl = `/api/files/${id}/${savedFileName}`;
      
      const fileName = imageFile.fileName;
      
      // Try various possible references in the HTML
      const possibleRefs = [
        fileName,
        `./${fileName}`,
        `../${fileName}`,
        imageFile.path,
        `images/${fileName}`,
        `./images/${fileName}`,
        `../images/${fileName}`,
        `${groupName}/${fileName}`,
        `${groupName}/images/${fileName}`
      ];
      
      possibleRefs.forEach(ref => {
        const escapedRef = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Replace src attributes
        processedHTML = processedHTML.replace(
          new RegExp(`src=["']${escapedRef}["']`, 'gi'),
          `src="${imageUrl}"`
        );
        
        // Replace background-image URLs
        processedHTML = processedHTML.replace(
          new RegExp(`background-image:\\s*url\\(["']?${escapedRef}["']?\\)`, 'gi'),
          `background-image: url(${imageUrl})`
        );
      });
      

    } catch (error) {
      console.error(`[EMBED IMAGES] Error embedding image ${imageFile.fileName}:`, error);
    }
  }
  
  return processedHTML;
}
