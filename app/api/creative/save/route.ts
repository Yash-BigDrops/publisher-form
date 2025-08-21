
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    affiliateId, companyName, firstName, lastName,
    email, telegramId, offerId, creativeType,
    fromLines, subjectLines, notes, priority,
    files
  } = body || {};

  const id = randomUUID();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO creatives
      (id, affiliate_id, company_name, first_name, last_name, email, telegram_id, offer_id, creative_type, from_lines, subject_lines, notes, priority)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, affiliateId, companyName, firstName, lastName, email, telegramId, offerId, creativeType, fromLines, subjectLines, notes, priority]
    );

    if (Array.isArray(files)) {
      for (const f of files) {
        await client.query(
          `INSERT INTO creative_files (id, creative_id, file_name, file_url, file_type, file_size)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [randomUUID(), id, f.fileName, f.fileUrl, f.fileType || null, f.fileSize || null]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, id });
  } catch (e: unknown) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  } finally {
    client.release();
  }
}
