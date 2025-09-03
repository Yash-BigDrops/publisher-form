import { NextResponse } from 'next/server';
import { detectFileType } from '@/lib/security/fileType';
import { previewZipCentralDirectory } from '@/lib/zipPreview';
import { processZipBuffer } from '@/lib/zip';
import { extractEncryptedZipBuffer } from '@/lib/zipPassword';
import { sendToLoggingService } from '@/lib/logging';
import { rateLimit } from '@/lib/rateLimit';
import { progressStart, progressUpdate, progressDone, progressError } from '@/lib/progressStore';
import { createUploadAssetIndex, storeUploadAssetIndex } from '@/lib/uploadAssetIndex';

const ALLOW = new Set([
  'image/png','image/jpeg','image/gif','image/webp','image/svg+xml',
  'text/html','application/pdf',
]);
const MAX_FILES = Number(process.env.ZIP_MAX_FILES ?? 200);
const MAX_TOTAL = Number(process.env.ZIP_MAX_TOTAL ?? 300 * 1024 * 1024);
const MAX_DEPTH = Number(process.env.ZIP_MAX_DEPTH ?? 2);
const PER_FILE_MAX = Number(process.env.ZIP_PER_FILE_MAX ?? 50 * 1024 * 1024);
const ENABLE_SCAN = process.env.ENABLE_VIRUS_SCAN === '1';
const ENCRYPTED_POLICY: 'skip' | 'error' | 'attempt' = (process.env.ZIP_ENCRYPTED_POLICY as 'skip' | 'error' | 'attempt') ?? 'skip';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown-ip';
  if (!rateLimit(`zip:${ip}`, { capacity: 10, refillPerSec: 0.2 })) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const form = await req.formData();
  const file = (form.get('file') || form.get('zip')) as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  progressStart(uploadId, { name: file.name, size: file.size });
  
  try {
    progressUpdate(uploadId, 1, 'reading');

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(ab);

    const head = await detectFileType(buf, file.name);
    if (head.mime !== 'application/zip') {
      progressError(uploadId, 'Not a ZIP', 0);
      return NextResponse.json({ error: 'Not a ZIP archive' }, { status: 415 });
    }

    progressUpdate(uploadId, 5, 'previewing');
    const preview = previewZipCentralDirectory(buf);
    if (!preview) {
      progressError(uploadId, 'EOCD not found', 5);
      return NextResponse.json({ error: 'Failed to parse ZIP (EOCD not found)' }, { status: 422 });
    }

    const encryptedEntries = preview.entries.filter(e => e.encrypted && !e.isDirectory);
    const hasEncrypted = encryptedEntries.length > 0;
    const compression = {
      totalCompressedBytes: preview.totals.compressed,
      totalUncompressedBytes: preview.totals.uncompressed,
      overallCompressionRatio: preview.totals.overallRatio,
      entryCount: preview.totals.files + preview.totals.dirs,
      highExpansionEntries: preview.suspicious.highExpansionEntries,
      highOverallExpansion: preview.suspicious.highOverallExpansion,
    };

    const extracted: Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      hash: string;
      depth: number;
      encrypted?: boolean;
      priority?: number;
      originalPath?: string;
      previewUrl?: string;
    }> = [];
    const skipped: Array<{
      path?: string;
      reason: string;
    }> = [];

    
    const password = req.headers.get('x-zip-password') || undefined;
    if (hasEncrypted) {
      if (ENCRYPTED_POLICY === 'error') {
        progressError(uploadId, 'Encrypted entries present', 10);
        return NextResponse.json({
          error: 'ZIP contains password-protected entries',
          encryptedEntries: encryptedEntries.map(e => e.name),
          compression, uploadId
        }, { status: 422 });
      }
      if (ENCRYPTED_POLICY === 'attempt' && password) {
        progressUpdate(uploadId, 12, 'decrypting encrypted entries');
        const dec = await extractEncryptedZipBuffer(buf, password, {
          allow: ALLOW, 
          enableVirusScan: ENABLE_SCAN, 
          perFileMaxBytes: PER_FILE_MAX,
          prioritizeHtml: true 
        });
        extracted.push(...dec.extracted);
        skipped.push(...dec.skipped);
      } else if (ENCRYPTED_POLICY === 'skip') {
        skipped.push(...encryptedEntries.map(e => ({ path: e.name, reason: 'encrypted' })));
      }
    }

    progressUpdate(uploadId, 15, 'extracting safe entries');
    const safe = await processZipBuffer(buf, {
      allow: ALLOW,
      maxFiles: MAX_FILES,
      maxTotalBytes: MAX_TOTAL,
      maxDepth: MAX_DEPTH,
      perFileMaxBytes: PER_FILE_MAX,
      enableVirusScan: ENABLE_SCAN,
      dedup: true,
      prioritizeHtml: true, 
      
      onEntry: ({ path, index, total }) => {
        if (index % 5 === 0) progressUpdate(uploadId, Math.min(90, Math.round(15 + (index / Math.max(1, total)) * 70)), `processing: ${path}`);
      },
      onProgress: (pct) => progressUpdate(uploadId, Math.min(95, pct), 'processing')
    });

    extracted.push(...safe.extracted);
    skipped.push(...safe.skipped);

    progressUpdate(uploadId, 97, 'finalizing');

    const assetIndex = createUploadAssetIndex(extracted.map(f => ({
      fileId: f.fileId,
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileType: f.fileType,
      originalPath: (f as { originalPath?: string }).originalPath || f.fileName 
    })));
    storeUploadAssetIndex(uploadId, assetIndex);
    
    await sendToLoggingService({
      event: 'zip-complete',
      uploadId, extractedCount: extracted.length, skippedCount: skipped.length, totals: compression
    });

    progressDone(uploadId, { extractedCount: extracted.length, skippedCount: skipped.length });
    return NextResponse.json({
      uploadId, preview, compression,
      files: extracted.map(f => f.fileName),
      extractedFiles: extracted, skipped, totalBytes: safe.totalBytes
    });
  } catch (e) {
    progressError(uploadId, (e as Error).message || 'unknown', 0);
    return NextResponse.json({ error: 'ZIP processing failed', detail: (e as Error).message, uploadId }, { status: 500 });
  }
}
