import { NextResponse } from 'next/server';
import { detectFileType } from '@/lib/security/fileType';
import { scanBufferWithClamAV } from '@/lib/security/clamav';
import { sha256 } from '@/lib/security/checksums';
import { sendToLoggingService } from '@/lib/logging';
import { rateLimit } from '@/lib/rateLimit';
import { quarantineBuffer } from '@/lib/quarantine';
import { makeImagePreview, makeBasicTextPreview } from '@/lib/preview';
import { maybeConvert } from '@/lib/conversion';
import { saveBuffer } from '@/lib/fileStorage';
import { progressStart, progressUpdate, progressDone, progressError } from '@/lib/progressStore';


const ALLOW = new Set([
  'image/png','image/jpeg','image/gif','image/webp','image/svg+xml',
  'text/html','application/pdf','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
]);
const PER_TIER_MAX: Record<string, number> = {
  free: 20 * 1024 * 1024,
  pro: 200 * 1024 * 1024,
  enterprise: 2 * 1024 * 1024 * 1024,
};
const REQUIRE_SCAN = process.env.REQUIRE_VIRUS_SCAN === '1';
const ENABLE_SCAN  = process.env.ENABLE_VIRUS_SCAN === '1';
const ENABLE_CONVERSION = process.env.ENABLE_IMAGE_CONVERSION === '1';

function getClientKey(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown-ip';
  const uid = req.headers.get('x-user-id') || 'anon';
  return `${uid}:${ip}`;
}
function getUserTier(req: Request): keyof typeof PER_TIER_MAX {
  const t = (req.headers.get('x-user-tier') || 'free') as keyof typeof PER_TIER_MAX;
  return PER_TIER_MAX[t] ? t : 'free';
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const key = getClientKey(req);
  if (!rateLimit(key, { capacity: 20, refillPerSec: 0.5 })) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  progressStart(uploadId, { type: 'single', name: file.name, size: file.size });
  
  try {
    progressUpdate(uploadId, 5, 'reading');

    const tier = getUserTier(req);
    const maxSize = PER_TIER_MAX[tier];

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > maxSize) {
      progressError(uploadId, `File exceeds tier limit (${tier})`, 5);
      return NextResponse.json({ error: `File exceeds tier limit (${tier})` }, { status: 413 });
    }

    progressUpdate(uploadId, 15, 'validating');
    const detected = await detectFileType(buf, file.name);
    if (!ALLOW.has(detected.mime)) {
      await sendToLoggingService({ event: 'disallowed-mime', mime: detected.mime, name: file.name });
      progressError(uploadId, `Unsupported MIME type: ${detected.mime}`, 15);
      return NextResponse.json({ error: `Unsupported MIME type: ${detected.mime}` }, { status: 415 });
    }

    progressUpdate(uploadId, 25, 'processing');
    let working = buf;
    let effectiveMime = detected.mime;
    if (ENABLE_CONVERSION) {
      const conv = await maybeConvert(buf, detected.mime);
      working = Buffer.from(conv.buffer); effectiveMime = conv.mime;
    }

    progressUpdate(uploadId, 40, 'scanning');
    if (ENABLE_SCAN || REQUIRE_SCAN) {
      const verdict = await scanBufferWithClamAV(working);
      if (verdict === 'UNAVAILABLE') {
        if (REQUIRE_SCAN) {
          progressError(uploadId, 'Virus scanner unavailable', 40);
          return NextResponse.json({ error: 'Virus scanner unavailable' }, { status: 503 });
        }
      } else if (verdict !== 'OK') {
        await quarantineBuffer(working, file.name, `scan-${verdict}`);
        await sendToLoggingService({ event: 'virus-detected', verdict, name: file.name });
        progressError(uploadId, 'File failed virus scanning', 40);
        return NextResponse.json({ error: 'File failed virus scanning' }, { status: 422 });
      }
    }

    progressUpdate(uploadId, 60, 'generating checksum');
    const hash = sha256(working);

    progressUpdate(uploadId, 70, 'saving');
    const { id, fileName } = await saveBuffer(working, file.name);
    const fileUrl = `/api/files/${id}/${fileName}`;

    progressUpdate(uploadId, 85, 'generating preview');
    let previewUrl: string | null = null;
    try {
      if (effectiveMime.startsWith('image/')) {
        const thumb = await makeImagePreview(working);
        if (thumb) {
          const thumbSave = await saveBuffer(thumb, `preview_${file.name}.jpg`);
          previewUrl = `/api/files/${thumbSave.id}/${thumbSave.fileName}`;
        }
      } else if (effectiveMime === 'text/html') {
        const txt = await makeBasicTextPreview(working, 2048);
        const previewBuf = Buffer.from(txt as string, 'utf8');
        const prev = await saveBuffer(previewBuf, `preview_${file.name}.txt`);
        previewUrl = `/api/files/${prev.id}/${prev.fileName}`;
      }
    } catch (e) {
      await sendToLoggingService({ event: 'preview-failed', error: (e as Error).message, name: file.name });
    }

    progressDone(uploadId, { url: fileUrl });
    return NextResponse.json({
      uploadId,
      url: fileUrl,
      key: `${id}/${fileName}`,
      mime: effectiveMime,
      hash,
      previewUrl,
      tier,
    });
  } catch (e) {
    progressError(uploadId, (e as Error).message || 'Upload failed', 0);
    return NextResponse.json({ error: 'Upload failed', detail: (e as Error).message, uploadId }, { status: 500 });
  }
}
