import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creativeId = searchParams.get("creativeId");

    if (!creativeId) {
      return NextResponse.json(
        { error: "creativeId is required" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Get existing metadata for the creative
      const result = await client.query(
        `SELECT from_lines, subject_lines, proofreading_data, html_content, additional_notes, metadata 
         FROM creative_metadata 
         WHERE creative_id = $1`,
        [creativeId]
      );

      if (result.rows.length > 0) {
        const metadata = result.rows[0];
        return NextResponse.json({
          success: true,
          metadata: {
            fromLines: metadata.from_lines,
            subjectLines: metadata.subject_lines,
            proofreadingData: metadata.proofreading_data,
            htmlContent: metadata.html_content,
            additionalNotes: metadata.additional_notes,
            additionalMetadata: metadata.metadata,
          }
        });
      } else {
        // No existing metadata found
        return NextResponse.json({
          success: true,
          metadata: null,
          message: "No existing metadata found for this creative"
        });
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("get creative metadata error:", e);
    return NextResponse.json(
      { error: "Failed to retrieve creative metadata", detail: e instanceof Error ? e.message : String(e) }, 
      { status: 500 }
    );
  }
}
