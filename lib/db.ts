// lib/db.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL env var is required');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}


async function init() {
  const dbPool = getPool();
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      chat_id BIGINT NOT NULL,
      first_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS creatives (
      id UUID PRIMARY KEY,
      affiliate_id TEXT,
      company_name TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      telegram_id TEXT,
      offer_id TEXT,
      creative_type TEXT,
      from_lines TEXT,
      subject_lines TEXT,
      notes TEXT,
      priority TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS creative_files (
      id UUID PRIMARY KEY,
      creative_id UUID REFERENCES creatives(id) ON DELETE CASCADE,
      file_name TEXT,
      file_url TEXT,
      file_type TEXT,
      file_size BIGINT
    );
  `);
  
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS telegram_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

