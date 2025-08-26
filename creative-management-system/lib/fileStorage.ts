
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


export function getFileDir(id: string) {
  return path.join(ROOT, id);
}

async function walkFiles(dir: string) {
  const out: { path: string; bytes: number }[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        const child = await walkFiles(p);
        out.push(...child);
      } else if (e.isFile()) {
        const stat = await fs.stat(p);
        out.push({ path: p, bytes: stat.size });
      }
    }
  } catch {
    // ignore
  }
  return out;
}

export async function deleteFileTreeById(id: string) {
  const dir = getFileDir(id);
  const files = await walkFiles(dir);
  let bytes = 0;
  for (const f of files) bytes += f.bytes;

  // best-effort rm
  await fs.rm(dir, { recursive: true, force: true });

  return {
    filesDeleted: files.map(f => f.path),
    bytesReclaimed: bytes,
    dir,
  };
}
