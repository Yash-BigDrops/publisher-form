import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fileUrl } = data;

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    // Extract the blob path from the URL
    const url = new URL(fileUrl);
    const blobPath = url.pathname.substring(1); // Remove leading slash

    // Delete from Vercel Blob
    await del(blobPath);

    console.log("Deleted creative from blob:", blobPath);

    return NextResponse.json({ 
      success: true,
      message: "Creative deleted successfully"
    });
  } catch (error) {
    console.error("Delete creative error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
} 