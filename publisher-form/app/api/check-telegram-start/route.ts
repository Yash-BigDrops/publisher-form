import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ started: false });
    }

    const cleanUsername = username.trim().replace(/^@/, '');

    const result = await sql`
      SELECT chat_id, first_name 
      FROM telegram_users 
      WHERE username = ${cleanUsername}
    `;

    if (result.rows.length === 0) {
      console.log(`User @${cleanUsername} not found in database - needs to start bot`);
      return NextResponse.json({ 
        started: false, 
        message: `User @${cleanUsername} not found. Please start the bot first by sending /start to @BigDropsMarketingBot` 
      });
    }

    const user = result.rows[0];
    console.log(`Found user @${cleanUsername} with chat_id: ${user.chat_id}`);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ started: false });
    }

    const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.chat_id,
        text: "✅ Telegram connection verified!",
        disable_notification: true
      })
    });

    const msgData = await msgRes.json();
    console.log("Telegram sendMessage response:", msgData);

    if (msgData.ok) {
      return NextResponse.json({ started: true, message: "Telegram connection verified successfully!" });
    } else {
      console.log("sendMessage failed:", msgData.description);
      return NextResponse.json({ 
        started: false, 
        message: `Failed to send test message: ${msgData.description}` 
      });
    }

  } catch (err) {
    console.error("Telegram check error:", err);
    return NextResponse.json({ started: false });
  }
} 