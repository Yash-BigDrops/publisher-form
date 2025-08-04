import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    // Extract the blob path from the URL
    const url = new URL(fileUrl);
    const blobPath = url.pathname.substring(1); // Remove leading slash

    // Delete from Vercel Blob
    await del(blobPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
} 