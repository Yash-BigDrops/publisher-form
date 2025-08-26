import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { createSubmissionEmail, sendEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      offer_id,
      priority,
      contact_method,
      contact_info,
      from_lines,
      subject_lines,
      other_request,
      creatives = [],
      contact_name = 'there',
    } = body || {};

    if (!offer_id || !contact_info || !Array.isArray(creatives) || creatives.length === 0) {
      return NextResponse.json({ 
        error: 'Offer ID, contact info, and at least one creative are required.' 
      }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();
    let submissionId: number | null = null;

    try {
      await client.query('BEGIN');

      const subRes = await client.query(
        `INSERT INTO submissions (
          offer_id, priority, contact_method, contact_info, 
          from_lines, subject_lines, other_request
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [offer_id, priority, contact_method, contact_info, from_lines, subject_lines, other_request]
      );

      submissionId = subRes.rows[0].id;

      for (const creative of creatives) {
        await client.query(
          `INSERT INTO creative_files (
            submission_id, file_url, file_key, original_filename, 
            creative_from_lines, creative_subject_lines, creative_notes, creative_html_code
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            submissionId,
            creative.file_url ?? null,
            creative.file_key ?? null,
            creative.original_filename ?? null,
            creative.creative_from_lines ?? null,
            creative.creative_subject_lines ?? null,
            creative.creative_notes ?? null,
            creative.creative_html_code ?? null,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const trackingLink = `https://www.bigdropsmarketing.com/tracking_link/BDMG${submissionId}`;

    if (contact_info) {
      const emailHtml = createSubmissionEmail({
        contactName: contact_name || 'there',
        priority: priority || 'Moderate',
        trackingLink,
      });
      await sendEmail({
        to: contact_info,
        subject: 'Your Submission Has Been Received!',
        html: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      submissionId,
      trackingLink,
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Server error during submission.' }, { status: 500 });
  }
}
