import { NextResponse } from 'next/server';
import { previewZipCentralDirectory } from '@/lib/zipPreview';
import { detectFileType } from '@/lib/security/fileType';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);

  const head = await detectFileType(buf, file.name);
  if (head.mime !== 'application/zip') {
    return NextResponse.json({ error: 'Not a ZIP archive' }, { status: 415 });
  }

  const preview = previewZipCentralDirectory(buf, { maxEntries: 2000 });
  if (!preview) return NextResponse.json({ error: 'Failed to parse ZIP (EOCD not found)' }, { status: 422 });

  return NextResponse.json({ preview });
}
