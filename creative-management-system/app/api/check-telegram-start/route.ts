import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ started: false, message: 'username required' }, { status: 400 });
    }

    const clean = String(username).replace(/^@/, '').trim();

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT username, chat_id, first_name
       FROM telegram_users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [clean]
    );

    if (rows.length) {
      return NextResponse.json({ started: true, user: rows[0] });
    }

    return NextResponse.json({ started: false, message: 'not_found' });
  } catch (e: unknown) {
    return NextResponse.json({ started: false, message: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
