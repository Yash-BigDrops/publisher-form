import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    console.log('Telegram webhook received:', JSON.stringify(update, null, 2));
    
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      const username = update.message.chat.username;
      const firstName = update.message.chat.first_name;
      
      console.log(`Processing /start command for chat_id: ${chatId}, username: ${username}, firstName: ${firstName}`);
      
      if (username) {
        try {
          const result = await sql`
            INSERT INTO telegram_users (username, chat_id, first_name, created_at)
            VALUES (${username}, ${chatId}, ${firstName}, NOW())
            ON CONFLICT (username) 
            DO UPDATE SET 
              chat_id = EXCLUDED.chat_id,
              first_name = EXCLUDED.first_name,
              updated_at = NOW()
            RETURNING username, chat_id
          `;
          
          console.log(`Successfully stored/updated Telegram user: @${username} -> ${chatId}`);
          console.log('Database result:', result);
        } catch (dbError) {
          console.error('Database error storing user:', dbError);
          throw dbError;
        }
      } else {
        console.log('No username found for chat_id:', chatId);
        // Send a message asking user to set a username
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "⚠️ Please set a username in your Telegram profile first, then send /start again. This is required to connect your account.",
              parse_mode: "HTML"
            })
          });
        }
        return NextResponse.json({ ok: true });
      }
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Welcome! You're now connected to Big Drops Marketing notifications. You'll receive updates about your creative submissions here.",
            parse_mode: "HTML"
          })
        });
        
        const responseData = await response.json();
        console.log('Bot message response:', responseData);
      }
    } else {
      console.log('Received non-/start message:', update.message?.text);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
} 