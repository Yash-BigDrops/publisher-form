import { del } from "@vercel/blob";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    const oldSubmissions = await sql`
      SELECT id, file_key FROM submissions
      WHERE created_at < ${fourteenDaysAgo};
    `;

    if (oldSubmissions.rows.length === 0) {
      return NextResponse.json({ message: "No old files to delete." });
    }

    const keysToDelete = oldSubmissions.rows
      .map((row) => row.file_key as string)
      .filter(Boolean);
    const idsToDelete = oldSubmissions.rows.map((row) => row.id as number);

    if (keysToDelete.length > 0) {
      await del(keysToDelete);
    }

    // Delete submissions one by one since sql.array() is not available
    for (const id of idsToDelete) {
      await sql`DELETE FROM submissions WHERE id = ${id}`;
    }
    return NextResponse.json({
      message: `Deleted ${idsToDelete.length} old submissions.`,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Cron job failed." }, { status: 500 });
  }
}
