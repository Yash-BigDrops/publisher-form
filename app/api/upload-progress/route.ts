import { NextResponse } from 'next/server';
import { progressGet } from '@/lib/progressStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const state = progressGet(id);
  if (!state) return NextResponse.json({ status: 'unknown', pct: 0, message: 'Upload not found' }, { status: 200 });

  const response = {
    status: state.status === 'done' ? 'completed' : 
            state.status === 'error' ? 'failed' : 
            state.status === 'running' ? 'processing' : 'uploading',
    pct: state.pct,
    message: state.status === 'done' ? 'Upload completed' :
             state.status === 'error' ? (state as { error?: string }).error || 'Upload failed' :
             state.status === 'running' ? (state as { note?: string }).note || 'Processing...' :
             'Uploading...'
  };

  return NextResponse.json(response);
}
