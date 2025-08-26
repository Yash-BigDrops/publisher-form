/* eslint-disable @typescript-eslint/no-explicit-any */

import { detectFileType } from '@/lib/security/fileType';
import { scanBufferWithClamAV } from '@/lib/security/clamav';
import { sha256 } from '@/lib/security/checksums';
import { saveBuffer } from '@/lib/fileStorage';

export type PwExtractOptions = {
  allow: Set<string>;
  enableVirusScan?: boolean;
  perFileMaxBytes?: number;
};

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
  }> = [];
  const skipped: Array<{
    path?: string;
    reason: string;
  }> = [];

  for (const entry of entries) {
    const name: string = entry.entryName;
    if (entry.isDirectory) continue;
    if (name.includes('..')) { skipped.push({ path: name, reason: 'path-traversal' }); continue; }

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

    const { id, fileName } = await saveBuffer(data, name.split('/').pop() || 'file');
    extracted.push({
      fileId: id,
      fileName,
      fileUrl: `/api/files/${id}/${fileName}`,
      fileSize: data.length,
      fileType: mime,
      hash: sha256(data),
      depth: 0,
      encrypted: true,
    });
  }

  return { extracted, skipped, usedLibrary: true };
}
