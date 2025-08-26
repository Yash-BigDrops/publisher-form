import { NextRequest } from "next/server";
import { getFilePath } from "@/lib/fileStorage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

function contentType(name: string) {
  const ext = name.toLowerCase().split(".").pop() || "";
  if (ext === "html" || ext === "htm") return "text/html; charset=utf-8";
  if (ext === "css") return "text/css";
  if (ext === "js") return "application/javascript";
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) {
    return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  }
  if (ext === "json") return "application/json";
  if (ext === "txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await params;
  const relPath = path.join("/");
  const p = await getFilePath(id, relPath);
  try { await stat(p); } catch { return new Response("not found", { status: 404 }); }
  const stream = createReadStream(p);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": contentType(relPath),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
