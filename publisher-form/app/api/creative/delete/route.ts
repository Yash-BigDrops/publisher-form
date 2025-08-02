import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const permanentDir = path.join(process.cwd(), "public", "creatives");

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fileName } = data;

    if (!fileName) {
      return NextResponse.json({ error: "No file name provided" }, { status: 400 });
    }

    const filePath = path.join(permanentDir, fileName);
    const previewPath = path.join(permanentDir, `preview-${fileName}.jpg`);

    await Promise.all([
      fs.unlink(filePath).catch(() => {}),
      fs.unlink(previewPath).catch(() => {})
    ]);

    console.log("Deleted creative:", fileName);

    return NextResponse.json({ 
      success: true,
      message: "Creative deleted successfully"
    });
  } catch (error) {
    console.error("Delete creative error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
} 