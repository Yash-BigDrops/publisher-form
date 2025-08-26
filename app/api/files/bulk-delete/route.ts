import { NextRequest, NextResponse } from 'next/server';
import { deleteFileTreeById, getFileDir } from '@/lib/fileStorage';
import { stat } from 'fs/promises';

export const dynamic = 'force-dynamic';

type Req = { ids: string[] };

export async function POST(req: NextRequest) {
  try {
    const { ids } = (await req.json()) as Req;
    if (!Array.isArray(ids) || !ids.length) {
      return NextResponse.json({ error: 'ids[] required' }, { status: 400 });
    }

    const results = [];
    let reclaimed = 0;

    for (const id of ids) {
      try {
        await stat(getFileDir(id)); // exists?
        const r = await deleteFileTreeById(id);
        reclaimed += r.bytesReclaimed;
        results.push({ id, ok: true, deleted: r.filesDeleted.length, bytes: r.bytesReclaimed });
      } catch {
        results.push({ id, ok: false, reason: 'not-found' });
      }
    }

    return NextResponse.json({ success: true, results, totalReclaimed: reclaimed });
  } catch (e) {
    console.error('Bulk delete error:', e);
    return NextResponse.json({ error: 'Failed bulk-delete' }, { status: 500 });
  }
}
