import { Pool } from "pg";

declare global {
  // allow global var in dev hot-reload
  var __pgPool__: Pool | undefined;
}

export function getPool(): Pool {
  const exists = globalThis.__pgPool__;
  if (exists) return exists;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL env var is required");

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  globalThis.__pgPool__ = pool;
  return pool;
}

async function init() {
  const pool = getPool();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      chat_id BIGINT NOT NULL,
      first_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await pool.query(`
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
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS creative_files (
      id UUID PRIMARY KEY,
      creative_id UUID REFERENCES creatives(id) ON DELETE CASCADE,
      file_name TEXT,
      file_url TEXT,
      file_type TEXT,
      file_size BIGINT
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      offer_id TEXT NOT NULL,
      priority TEXT,
      contact_method TEXT,
      contact_info TEXT NOT NULL,
      from_lines TEXT,
      subject_lines TEXT,
      other_request TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submission_files (
      id SERIAL PRIMARY KEY,
      submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
      file_url TEXT,
      file_key TEXT,
      original_filename TEXT,
      creative_from_lines TEXT,
      creative_subject_lines TEXT,
      creative_notes TEXT,
      creative_html_code TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creative_metadata (
      id SERIAL PRIMARY KEY,
      creative_id TEXT NOT NULL,
      from_lines TEXT,
      subject_lines TEXT,
      proofreading_data JSONB,
      html_content TEXT,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

init().catch((error) => {
  console.error("Failed to initialize database tables:", error);
});

