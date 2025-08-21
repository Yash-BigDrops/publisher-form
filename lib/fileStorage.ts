
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

const ROOT = '/tmp/creatives';
async function ensureDir(dir: string) { await fs.mkdir(dir, { recursive: true }); }

export async function saveBuffer(buf: Buffer, originalName: string) {
  const id = randomUUID();
  const safeName = originalName.replace(/[^\w.\-]+/g, '_');
  const dir = path.join(ROOT, id);
  await ensureDir(dir);
  const full = path.join(dir, safeName);
  await fs.writeFile(full, buf);
  return { id, fileName: safeName };
}

export async function getFilePath(id: string, fileName: string) {
  return path.join(ROOT, id, fileName);
}
