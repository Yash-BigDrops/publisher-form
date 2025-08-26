import { NextRequest, NextResponse } from "next/server";
import { deleteFileTreeById } from "@/lib/fileStorage";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await deleteFileTreeById(decodeURIComponent(id));
    return NextResponse.json({ success: true, ...res });
  } catch {
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
