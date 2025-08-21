
import { NextRequest } from 'next/server';
import { getFilePath } from '@/lib/fileStorage';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const name = req.nextUrl.searchParams.get('name');
  if (!id || !name) return new Response('missing id/name', { status: 400 });

  const p = await getFilePath(id, name);
  try {
    await stat(p);
  } catch {
    return new Response('not found', { status: 404 });
  }

  const stream = createReadStream(p);
  return new Response(stream as unknown as ReadableStream);
}
