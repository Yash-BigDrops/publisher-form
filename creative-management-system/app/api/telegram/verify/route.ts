
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { telegramId } = await req.json();

    if (!telegramId) {
      return NextResponse.json({ error: "Missing telegramId" }, { status: 400 });
    }

    const cleanUsername = telegramId.replace(/^@/, "").toLowerCase();

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM telegram_users WHERE LOWER(username) = $1 AND chat_id IS NOT NULL LIMIT 1`,
      [cleanUsername]
    );

    if (rows.length > 0) {
      return NextResponse.json({ verified: true, user: rows[0] });
    } else {
      return NextResponse.json({ verified: false });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'verification error' }, { status: 500 });
  }
}
