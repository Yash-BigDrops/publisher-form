/* eslint-disable @typescript-eslint/no-explicit-any */

import { detectFileType } from '@/lib/security/fileType';
import { scanBufferWithClamAV } from '@/lib/security/clamav';
import { sha256 } from '@/lib/security/checksums';
import { saveBuffer } from '@/lib/fileStorage';

export type PwExtractOptions = {
  allow: Set<string>;
  enableVirusScan?: boolean;
  perFileMaxBytes?: number;
  prioritizeHtml?: boolean;
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

export async function extractEncryptedZipBuffer(zipBuf: Buffer, password: string, opts: PwExtractOptions) {
  let AdmZip: any = null;
  try {
    const admZipModule = await import('adm-zip');
    AdmZip = admZipModule.default || admZipModule;
  } catch {
    return { extracted: [], skipped: [{ reason: 'encrypted-zip-support-not-installed' }], usedLibrary: false };
  }

  if (!AdmZip) {
    return { extracted: [], skipped: [{ reason: 'encrypted-zip-support-not-installed' }], usedLibrary: false };
  }

  const zip = new AdmZip(zipBuf);
  zip.setPassword(password);

  const entries = zip.getEntries();
  const extracted: Array<{
    fileId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    hash: string;
    depth: number;
    encrypted: boolean;
    priority: number;
  }> = [];
  const skipped: Array<{
    path?: string;
    reason: string;
  }> = [];

  for (const entry of entries) {
    const name: string = entry.entryName;
    if (entry.isDirectory) continue;
    if (name.includes('..')) { skipped.push({ path: name, reason: 'path-traversal' }); continue; }

    const fileName = name.split('/').pop() || 'file';
    
    // Skip Mac metadata files
    if (isMacMetadata(name, fileName)) {
      skipped.push({ path: name, reason: 'mac-metadata' });
      continue;
    }

    let data: Buffer;
    try {
      data = entry.getData();
    } catch {
      skipped.push({ path: name, reason: 'decrypt-failed' });
      continue;
    }

    if (opts.perFileMaxBytes && data.length > opts.perFileMaxBytes) {
      skipped.push({ path: name, reason: 'per-file-size-limit' });
      continue;
    }

    const { mime } = await detectFileType(data, name);
    if (!opts.allow.has(mime)) { skipped.push({ path: name, reason: `disallowed-mime:${mime}` }); continue; }

    if (opts.enableVirusScan) {
      const verdict = await scanBufferWithClamAV(data);
      if (verdict !== 'OK') { skipped.push({ path: name, reason: `virus:${verdict}` }); continue; }
    }

    const { id, fileName: savedFileName } = await saveBuffer(data, fileName);
    const priority = getFilePriority(fileName, mime);
    
    extracted.push({
      fileId: id,
      fileName: savedFileName,
      fileUrl: `/api/files/${id}/${savedFileName}`,
      fileSize: data.length,
      fileType: mime,
      hash: sha256(data),
      depth: 0,
      encrypted: true,
      priority
    });
  }

  // Sort by priority if HTML prioritization is enabled
  if (opts.prioritizeHtml) {
    extracted.sort((a, b) => b.priority - a.priority);
  }

  return { extracted, skipped, usedLibrary: true };
}
