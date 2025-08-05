import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Check if telegram_users table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_users'
      );
    `;
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      return NextResponse.json({ 
        error: 'telegram_users table does not exist',
        tableExists: false 
      });
    }
    
    // Get table structure
    const structure = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'telegram_users'
      ORDER BY ordinal_position;
    `;
    
    // Get all users
    const users = await sql`
      SELECT username, chat_id, first_name, created_at, updated_at
      FROM telegram_users
      ORDER BY created_at DESC;
    `;
    
    return NextResponse.json({
      tableExists: true,
      structure: structure.rows,
      users: users.rows,
      userCount: users.rows.length
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      tableExists: false 
    }, { status: 500 });
  }
} 