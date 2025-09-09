import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

async function sendTelegramMessage(chat_id: number, text: string) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    cache: 'no-store',
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    console.log('Webhook received:', new Date().toISOString());
    
    if (!TOKEN) {
      console.error('BOT token not set');
      return NextResponse.json({ ok: false, error: 'BOT token not set' }, { status: 500 });
    }

    if (SECRET) {
      const got = req.headers.get('x-telegram-bot-api-secret-token');
      if (got !== SECRET) {
        return NextResponse.json({ ok: false, error: 'bad secret' }, { status: 401 });
      }
    }

    const update = await req.json();
    console.log('Update received:', JSON.stringify(update, null, 2));

    const msg = update?.message;
    if (!msg) {
      console.log('No message in update');
      return NextResponse.json({ ok: true });
    }

    const chatId = msg.chat?.id;
    const username: string | null = msg.chat?.username || null;
    const firstName: string | null = msg.chat?.first_name || null;
    const text: string = msg.text || '';

    if (typeof text === 'string' && text.trim().toLowerCase().startsWith('/start')) {
      console.log('Processing /start command for user:', { chatId, username, firstName });
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (username) {
          await client.query(
            `
            INSERT INTO telegram_users (username, chat_id, first_name, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (username)
            DO UPDATE SET chat_id = EXCLUDED.chat_id, first_name = EXCLUDED.first_name, updated_at = NOW()
          `,
            [username, chatId, firstName]
          );
        } else {
          await client.query(
            `
            INSERT INTO telegram_users (username, chat_id, first_name, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (username) DO NOTHING
          `,
            [`chat_${chatId}`, chatId, firstName]
          );
        }

        await client.query('COMMIT');
        console.log('User successfully added to database:', { username, chatId, firstName });
      } catch (e) {
        console.error('Database error:', e);
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      await sendTelegramMessage(
        chatId,
        `✅ Thanks${
          firstName ? `, <b>${firstName}</b>` : ''
        }! Your Telegram is now linked.\n\nYou can return to the form and click <b>Verify</b>.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('Webhook error:', e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'webhook error' }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'telegram-webhook' });
}
