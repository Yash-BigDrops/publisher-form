import JSZip from 'jszip';
import { detectFileType } from '@/lib/security/fileType';
import { scanBufferWithClamAV } from '@/lib/security/clamav';
import { sha256 } from '@/lib/security/checksums';
import { saveBuffer } from '@/lib/fileStorage';
import { makeImagePreview } from '@/lib/preview';

export type ZipProcessOptions = {
  allow: Set<string>;
  maxFiles: number;
  maxTotalBytes: number;
  maxDepth: number;
  perFileMaxBytes?: number;
  enableVirusScan?: boolean;
  dedup?: boolean;
  prioritizeHtml?: boolean; // New option to prioritize HTML over text files

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
  return 1;
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
      const pct = Math.round((processed / totalCount) * 90); 
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

    const baseName = path.split('/').pop() || 'file';
    const { id, fileName: savedFileName } = await saveBuffer(buf, baseName);

    let previewUrl: string | undefined;
    if (mime.startsWith('image/') && mime !== 'image/svg+xml') {
      const thumb = await makeImagePreview(buf, 400);
      if (thumb) {
        const prev = await saveBuffer(thumb, `preview_${savedFileName}.jpg`);
        previewUrl = `/api/files/${prev.id}/${prev.fileName}`;
      }
    }

    const priority = getFilePriority(fileName, mime);
    
    extracted.push({
      fileId: id,
      fileName: savedFileName,
      fileUrl: `/api/files/${id}/${savedFileName}`,
      fileSize: buf.length,
      fileType: mime,
      hash,
      depth,
      previewUrl,
      priority
    });
  }

  // Sort by priority if HTML prioritization is enabled
  if (opts.prioritizeHtml) {
    extracted.sort((a, b) => b.priority - a.priority);
  }

  opts.onProgress?.(95);

  return { extracted, totalBytes, skipped };
}
