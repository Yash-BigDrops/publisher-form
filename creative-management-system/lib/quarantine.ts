import { saveBuffer } from '@/lib/fileStorage';

export async function quarantineBuffer(buf: Buffer, originalName: string, reason: string) {
  const safeName = `QUARANTINE_${Date.now()}_${reason.replace(/[^a-z0-9_-]+/gi,'-')}_${originalName}`;
  const { id, fileName } = await saveBuffer(buf, safeName);
  return { id, fileName };
}
