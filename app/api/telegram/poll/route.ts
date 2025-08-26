import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function getOffset() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT value FROM telegram_state WHERE key = 'last_update_id' LIMIT 1`
  );
  return rows[0]?.value ? parseInt(rows[0].value, 10) : undefined;
}

async function setOffset(id: number) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO telegram_state(key, value, updated_at)
     VALUES('last_update_id', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
    [String(id)]
  );
}

async function sendTelegramMessage(chat_id: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    cache: 'no-store',
  }).catch(() => {});
}

export async function POST() {
  try {
    if (!TOKEN) return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN missing' }, { status: 500 });

    const offset = await getOffset();
    const url = new URL(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
    if (offset) url.searchParams.set('offset', String(offset + 1));
    url.searchParams.set('timeout', '0');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: 'getUpdates failed', data }, { status: 500 });
    }

    let highestId = offset ?? 0;
    for (const upd of data.result as Array<{ update_id: number; message?: { text?: string; chat?: { id: number; username?: string; first_name?: string } } }>) {
      if (upd.update_id > highestId) highestId = upd.update_id;

      const msg = upd.message;
      if (!msg) continue;

      const text = (msg.text || '').trim().toLowerCase();
      if (!text.startsWith('/start')) continue;

      const chatId = msg.chat?.id;
      const username: string | null = msg.chat?.username || null;
      const firstName: string | null = msg.chat?.first_name || null;
      
      if (!chatId) continue;

      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (username) {
          await client.query(
            `INSERT INTO telegram_users (username, chat_id, first_name, created_at, updated_at)
             VALUES ($1,$2,$3,NOW(),NOW())
             ON CONFLICT (username)
             DO UPDATE SET chat_id=EXCLUDED.chat_id, first_name=EXCLUDED.first_name, updated_at=NOW()`,
            [username, chatId, firstName]
          );
        } else {
          await client.query(
            `INSERT INTO telegram_users (username, chat_id, first_name, created_at, updated_at)
             VALUES ($1,$2,$3,NOW(),NOW())
             ON CONFLICT (username) DO NOTHING`,
            [`chat_${chatId}`, chatId, firstName]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      await sendTelegramMessage(chatId,
        `✅ Thanks${firstName ? `, <b>${firstName}</b>` : ''}! Your Telegram is now linked.\n\nReturn to the form and click <b>Verify</b>.`
      );
    }

    if (highestId) await setOffset(highestId);
    return NextResponse.json({ ok: true, processed: data.result?.length || 0, last_update_id: highestId });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'poll error' }, { status: 500 });
  }
}
