import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      const username = update.message.chat.username;
      const firstName = update.message.chat.first_name;
      
      if (username) {
        await sql`
          INSERT INTO telegram_users (username, chat_id, first_name, created_at)
          VALUES (${username}, ${chatId}, ${firstName}, NOW())
          ON CONFLICT (username) 
          DO UPDATE SET 
            chat_id = EXCLUDED.chat_id,
            first_name = EXCLUDED.first_name,
            updated_at = NOW()
        `;
        
        console.log(`Stored Telegram user: @${username} -> ${chatId}`);
      }
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Welcome! You're now connected to Big Drops Marketing notifications. You'll receive updates about your creative submissions here.",
            parse_mode: "HTML"
          })
        });
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
} 