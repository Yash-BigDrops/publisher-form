import { NextRequest, NextResponse } from 'next/server';
import { saveBuffer } from '@/lib/fileStorage';
import { randomUUID } from 'crypto';
import JSZip from 'jszip';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  if ((file.type || '').includes('zip') || /\.zip$/i.test(file.name)) {
    const zip = await JSZip.loadAsync(buf);
    const zipId = randomUUID();
    const extractedFiles: Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      originalPath: string;
    }> = [];
    const entries = Object.values(zip.files);
    for (const entry of entries) {
      if (entry.dir) continue;
      const content = await entry.async('nodebuffer');
      const saved = await saveBuffer(content, entry.name);
      extractedFiles.push({
        fileId: saved.id,
        fileName: entry.name.split('/').pop() || entry.name,
        fileUrl: `/api/uploads?id=${saved.id}&name=${encodeURIComponent(saved.fileName)}`,
        fileSize: content.length,
        fileType: guessType(entry.name),
        originalPath: entry.name
      });
    }
    return NextResponse.json({
      success: true,
      zipFileId: zipId,
      extractedFiles,
      totalFiles: extractedFiles.length,
      extractionDate: new Date().toISOString()
    });
  }

  const saved = await saveBuffer(buf, file.name);
  return NextResponse.json({
    success: true,
    file: {
      fileId: saved.id,
      fileName: file.name,
      fileUrl: `/api/uploads?id=${saved.id}&name=${encodeURIComponent(file.name)}`,
      fileSize: buf.length,
      fileType: file.type || guessType(file.name),
      uploadDate: new Date().toISOString()
    }
  });
}

function guessType(name: string) {
  const n = name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(n)) return 'image/' + n.split('.').pop();
  if (/\.html?$/.test(n)) return 'text/html';
  return 'application/octet-stream';
}
