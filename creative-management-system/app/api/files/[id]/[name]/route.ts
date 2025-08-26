import { NextRequest } from 'next/server';
import { getFilePath } from '@/lib/fileStorage';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params;
  if (!id || !name) return new Response('missing id/name', { status: 400 });

  const p = await getFilePath(id, name);
  try { 
    await stat(p); 
  } catch { 
    return new Response('not found', { status: 404 }); 
  }

  const ext = name.toLowerCase().split('.').pop();
  let contentType = 'application/octet-stream';
  if (ext === 'html' || ext === 'htm') contentType = 'text/html; charset=utf-8';
  else if (ext === 'css') contentType = 'text/css';
  else if (ext === 'js') contentType = 'application/javascript';
  else if (['jpg','jpeg','png','gif','webp','svg'].includes(ext || '')) contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const stream = createReadStream(p);
  return new Response(stream as unknown as ReadableStream, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
  });
}
