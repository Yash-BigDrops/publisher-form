import { NextResponse } from 'next/server';
import { progressGet } from '@/lib/progressStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const state = progressGet(id);
  if (!state) return NextResponse.json({ status: 'unknown', pct: 0 }, { status: 200 });

  return NextResponse.json(state);
}
