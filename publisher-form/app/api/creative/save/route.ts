import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { offerId, creativeType, fromLine, subjectLines, notes, fileUrl, multiCreatives } = data;

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
    }

    console.log("Saving creative:", {
      offerId,
      creativeType,
      fromLine,
      subjectLines,
      notes,
      fileUrl,
      multiCreativesCount: multiCreatives?.length || 0
    });

    return NextResponse.json({ 
      success: true,
      message: "Creative saved successfully",
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error("Save creative error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
} 