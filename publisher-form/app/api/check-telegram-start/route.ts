import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ started: false, message: "No username provided" });
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    console.log(`Checking Telegram user: @${cleanUsername}`);

    // First, let's check if the table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      );
    `;
    
    const tableExists = tableCheck.rows[0]?.exists;
    console.log(`telegram_users table exists: ${tableExists}`);
    
    if (!tableExists) {
      console.log('telegram_users table does not exist');
      return NextResponse.json({ 
        started: false, 
        message: "Database table not found. Please contact support." 
      });
    }

    const result = await sql`
      SELECT chat_id, first_name 
      FROM telegram_users 
      WHERE username = ${cleanUsername}
    `;

    console.log(`Database query result for @${cleanUsername}:`, result.rows);

    if (result.rows.length === 0) {
      console.log(`User @${cleanUsername} not found in database - needs to start bot`);
      
      // Let's also check what users are in the database
      const allUsers = await sql`
        SELECT username, chat_id, first_name, created_at
        FROM telegram_users
        ORDER BY created_at DESC
        LIMIT 5
      `;
      console.log('Recent users in database:', allUsers.rows);
      
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