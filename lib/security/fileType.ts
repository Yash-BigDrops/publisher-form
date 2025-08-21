import type { FileTypeResult } from 'file-type';

let fileType: { fileTypeFromBuffer?: (buffer: Buffer) => Promise<FileTypeResult | undefined> } | null = null;
try {
  fileType = await import('file-type');
} catch {}

export type DetectedType = { mime: string; ext: string | null };

function fallbackDetect(buf: Buffer, name?: string): DetectedType | null {
  if (buf.length >= 8 && buf.toString('hex', 0, 8) === '89504e470d0a1a0a')
    return { mime: 'image/png', ext: 'png' };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length >= 6 && (buf.slice(0, 6).toString() === 'GIF87a' || buf.slice(0, 6).toString() === 'GIF89a'))
    return { mime: 'image/gif', ext: 'gif' };
  if (buf.length >= 4 && buf.slice(0, 4).toString() === '%PDF')
    return { mime: 'application/pdf', ext: 'pdf' };
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07))
    return { mime: 'application/zip', ext: 'zip' };
  const str = buf.slice(0, 512).toString('utf8').trim().toLowerCase();
  if (str.startsWith('<svg '))
    return { mime: 'image/svg+xml', ext: 'svg' };
  if (str.startsWith('<!doctype html') || str.startsWith('<html') || (name && /\.html?$/i.test(name)))
    return { mime: 'text/html', ext: name?.match(/\.html?$/i) ? name.split('.').pop()!.toLowerCase() : 'html' };
  return null;
}

export async function detectFileType(buffer: Buffer, originalName?: string): Promise<DetectedType> {
  let res: FileTypeResult | undefined;
  if (fileType?.fileTypeFromBuffer) {
    try { res = await fileType.fileTypeFromBuffer(buffer); } catch {}
  }
  if (res?.mime) return { mime: res.mime, ext: res.ext ?? null };
  const fb = fallbackDetect(buffer, originalName ?? undefined);
  if (fb) return fb;
  return { mime: 'application/octet-stream', ext: null };
}
