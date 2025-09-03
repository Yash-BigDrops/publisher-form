import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { createSubmissionEmail, sendEmail } from "@/lib/emailService";

function parseFileUrl(u: string) {
  try {
    const m = u.match(/\/api\/files\/([^/]+)\/([^?#]+)/);
    if (m) {
      return {
        id: decodeURIComponent(m[1]),
        name: decodeURIComponent(m[2]),
        file_url: u,
        file_key: `${decodeURIComponent(m[1])}/${decodeURIComponent(m[2])}`,
        original_filename: decodeURIComponent(m[2]),
      };
    }
  } catch {}
  return { file_url: u };
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      affiliateId,
      companyName,
      firstName,
      lastName,
      email: contactEmail,
      telegramId,
      offerId,
      creativeType,
      fromLines,
      subjectLines,
      notes,
      priority = "Moderate",
      files = [],
    } = body || {};

    if (!offerId || !contactEmail || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "offerId, email and at least one file are required" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();
    let submissionId: number | null = null;

    try {
      await client.query("BEGIN");

      const sub = await client.query(
        `INSERT INTO submissions (
          offer_id, priority, contact_method, contact_info, 
          from_lines, subject_lines, other_request,
          affiliate_id, company_name, telegram_id, creative_type
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [
          String(offerId),
          String(priority),
          "email",
          String(contactEmail),
          String(fromLines || ""),
          String(subjectLines || ""),
          String(notes || ""),
          String(affiliateId || ""),
          String(companyName || ""),
          String(telegramId || ""),
          String(creativeType || ""),
        ]
      );

      submissionId = sub.rows[0].id;

      for (const f of files as Array<{ 
        fileName: string; 
        fileUrl: string; 
        fileType?: string; 
        fileSize?: number; 
      }>) {
        const meta = parseFileUrl(f.fileUrl);
        await client.query(
          `INSERT INTO submission_files (
            submission_id, file_url, file_key, original_filename, 
            creative_from_lines, creative_subject_lines, creative_notes, creative_html_code
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            submissionId,
            meta.file_url ?? null,
            meta.file_key ?? null,
            f.fileName ?? meta.original_filename ?? null,
            fromLines ?? null,
            subjectLines ?? null,
            notes ?? null,
            null,
          ]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    const contactName = [firstName, lastName].filter(Boolean).join(" ") || "there";
    const trackingLink = `https://www.bigdropsmarketing.com/tracking_link/BDMG${submissionId}`;
    const html = createSubmissionEmail({
      contactName,
      priority: String(priority),
      trackingLink,
    });
    await sendEmail({
      to: contactEmail,
      subject: "Your Submission Has Been Received!",
      html,
    });

    return NextResponse.json({ ok: true, submissionId, trackingLink });
  } catch (e) {
    console.error("save creative error:", e);
    return NextResponse.json({ error: "Failed to save creative" }, { status: 500 });
  }
}
