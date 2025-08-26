import { NextResponse } from "next/server";
import JSZip from "jszip";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { getFilePath } from "@/lib/fileStorage";

type AnalyzedItem = {
  id: string;
  name: string;           
  type: "image" | "html" | "other";
  size: number;
  url: string;            
  previewUrl?: string;    
  html?: boolean;
};

type UploadAnalysis = {
  uploadId: string;
  isSingleCreative: boolean;
  items: AnalyzedItem[];
  counts: { images: number; htmls: number; others: number; total: number };
};

export const dynamic = "force-dynamic";

const MAX_DEPTH = Number(process.env.ZIP_MAX_DEPTH ?? "2");

const normalize = (p: string) =>
  p.replace(/\\/g, "/").replace(/\.\.(\/|\\)/g, "").replace(/^\/+/, "");

const isImg = (n: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(n);
const isHtml = (n: string) => /\.html?$/i.test(n);
const isZip  = (n: string) => /\.zip$/i.test(n);

async function writeFile(uploadId: string, relPath: string, data: Buffer) {
  const abs = await getFilePath(uploadId, relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return abs;
}

async function makeThumbIfImage(uploadId: string, rel: string, data: Buffer) {
  if (!isImg(rel)) return undefined;
  const thumbRel = `thumbs/${rel.replace(/\//g, "__")}.jpg`;
  try {
    const thumb = await sharp(data)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    await writeFile(uploadId, thumbRel, thumb);
    return thumbRel;
  } catch {
    return undefined;
  }
}

async function traverseZip(
  zip: JSZip,
  uploadId: string,
  prefix = "",
  depth = 0,
  out: AnalyzedItem[] = []
) {
  if (depth > MAX_DEPTH) return out;

  const baseUrl = `/api/files/${encodeURIComponent(uploadId)}/`;
  const entries = Object.values(zip.files);

  for (const entry of entries) {
    if (entry.dir) continue;

    const rel0 = normalize(entry.name);
    const rel = normalize(prefix + rel0);
    const lower = rel.toLowerCase();

    if (isZip(lower)) {
      try {
        const innerBuf = Buffer.from(await entry.async("nodebuffer"));
        const inner = await JSZip.loadAsync(innerBuf);
        const subPrefix = rel.replace(/\.zip$/i, "") + "/";
        await traverseZip(inner, uploadId, subPrefix, depth + 1, out);
      } catch {
        // ignore broken inner zips
      }
      continue;
    }

    const data = Buffer.from(await entry.async("nodebuffer"));
    await writeFile(uploadId, rel, data);

    const item: AnalyzedItem = {
      id: uploadId,
      name: rel,
      type: isImg(lower) ? "image" : isHtml(lower) ? "html" : "other",
      size: data.length,
      url: baseUrl + rel,
      html: isHtml(lower) || undefined,
    };

    if (item.type === "image") {
      const thumbRel = await makeThumbIfImage(uploadId, rel, data);
      item.previewUrl = thumbRel ? baseUrl + thumbRel : item.url;
    }

    out.push(item);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "ZIP file is required" }, { status: 400 });
    }

    const uploadId = crypto.randomUUID();
    const zip = await JSZip.loadAsync(Buffer.from(await file.arrayBuffer()));

    const allItems: AnalyzedItem[] = await traverseZip(zip, uploadId);

    const hasHtml = allItems.some(i => i.type === "html");
    const items = hasHtml ? allItems.filter(i => i.type !== "image") : allItems;

    const images = items.filter(i => i.type === "image").length;
    const htmls  = items.filter(i => i.type === "html").length;
    const others = items.filter(i => i.type === "other").length;

    const isSingleCreative = (images + htmls) === 1;

    const analysis: UploadAnalysis = {
      uploadId,
      isSingleCreative,
      items,
      counts: { images, htmls, others, total: items.length },
    };

    return NextResponse.json(analysis, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "ZIP analysis failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
