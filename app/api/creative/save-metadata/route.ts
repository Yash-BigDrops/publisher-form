import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      creativeId,
      fromLines,
      subjectLines,
      proofreadingData,
      htmlContent,
      metadata = {},
    } = body || {};

    if (!creativeId) {
      return NextResponse.json(
        { error: "creativeId is required" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check if creative metadata already exists
      const existingCheck = await client.query(
        `SELECT id FROM creative_metadata WHERE creative_id = $1`,
        [creativeId]
      );

      if (existingCheck.rows.length > 0) {
        // Update existing metadata
        await client.query(
          `UPDATE creative_metadata SET 
            from_lines = $2,
            subject_lines = $3,
            proofreading_data = $4,
            html_content = $5,
            metadata = $6,
            updated_at = NOW()
          WHERE creative_id = $1`,
          [
            creativeId,
            fromLines || null,
            subjectLines || null,
            proofreadingData ? JSON.stringify(proofreadingData) : null,
            htmlContent || null,
            JSON.stringify(metadata),
          ]
        );
      } else {
        // Insert new metadata
        await client.query(
          `INSERT INTO creative_metadata (
            creative_id, from_lines, subject_lines, proofreading_data, 
            html_content, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            creativeId,
            fromLines || null,
            subjectLines || null,
            proofreadingData ? JSON.stringify(proofreadingData) : null,
            htmlContent || null,
            JSON.stringify(metadata),
          ]
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({ 
        success: true, 
        message: "Creative metadata saved successfully" 
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("save creative metadata error:", e);
    return NextResponse.json(
      { error: "Failed to save creative metadata", detail: e instanceof Error ? e.message : String(e) }, 
      { status: 500 }
    );
  }
}
