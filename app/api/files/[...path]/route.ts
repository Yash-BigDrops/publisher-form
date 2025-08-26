import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = path.join(process.cwd(), 'tmp', 'creatives', ...resolvedParams.path);
    
    const normalizedPath = path.normalize(filePath);
    const allowedDir = path.join(process.cwd(), 'tmp', 'creatives');
    
    if (!normalizedPath.startsWith(allowedDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const fileBuffer = await fs.readFile(filePath);
    
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      contentType = `image/${ext.slice(1)}`;
    } else if (['.html', '.htm'].includes(ext)) {
      contentType = 'text/html';
    } else if (['.css'].includes(ext)) {
      contentType = 'text/css';
    } else if (['.js'].includes(ext)) {
      contentType = 'application/javascript';
    }

    return new NextResponse(fileBuffer as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', 
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
