import { NextRequest, NextResponse } from 'next/server';
import { saveBuffer, getFilePath } from '@/lib/fileStorage';
import { randomUUID } from 'crypto';
import JSZip from 'jszip';
import { makeImagePreview } from '@/lib/preview';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const smartDetection = form.get('smartDetection') === 'true';
  
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  if ((file.type || '').includes('zip') || /\.zip$/i.test(file.name)) {
    const zipId = randomUUID();

    
    if (smartDetection) {
      const zipId = randomUUID();
      const zip = await JSZip.loadAsync(buf);

      const normalize = (p: string) => p.replace(/\\/g, "/").replace(/\.\.(\/|\\)/g, "").replace(/^\/+/, "");
      const isImg = (n: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(n);
      const isHtml = (n: string) => /\.html?$/i.test(n);
      const isZip  = (n: string) => /\.zip$/i.test(n);

      const writeFile = async (relPath: string, data: Buffer) => {
        const abs = await getFilePath(zipId, relPath);
        await (await import("fs/promises")).mkdir((await import("path")).dirname(abs), { recursive: true });
        await (await import("fs/promises")).writeFile(abs, data);
        return abs;
      };

      async function makeThumbIfImage(rel: string, data: Buffer) {
        if (!isImg(rel)) return undefined;
        const thumbRel = `thumbs/${rel.replace(/\//g, "__")}.jpg`;
        try {
          const sharp = (await import("sharp")).default;
          const thumb = await sharp(data).resize(480, 480, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
          await writeFile(thumbRel, thumb);
          return thumbRel;
        } catch { return undefined; }
      }

      async function traverseZip(zipObj: JSZip, prefix = "", depth = 0, out: Array<{
        id: string; name: string; type: "image"|"html"|"other"; size: number; url: string; previewUrl?: string; html?: boolean;
      }> = []) {
        if (depth > Number(process.env.ZIP_MAX_DEPTH ?? "2")) return out;
        const baseUrl = `/api/files/${encodeURIComponent(zipId)}/`;
        for (const entry of Object.values(zipObj.files)) {
          if (entry.dir) continue;
          const rel0 = normalize(entry.name);
          const rel = normalize(prefix + rel0);
          const lower = rel.toLowerCase();

          if (isZip(lower)) {
            try {
              const innerBuf = Buffer.from(await entry.async("nodebuffer"));
              const inner = await JSZip.loadAsync(innerBuf);
              const subPrefix = rel.replace(/\.zip$/i, "") + "/";
              await traverseZip(inner, subPrefix, depth + 1, out);
            } catch {}
            continue;
          }

          const data = Buffer.from(await entry.async("nodebuffer"));
          await writeFile(rel, data);

          const item = {
            id: zipId,
            name: rel,
            type: isImg(lower) ? "image" : isHtml(lower) ? "html" : "other",
            size: data.length,
            url: baseUrl + rel,
            html: isHtml(lower) || undefined,
          } as {
            id: string; name: string; type: "image"|"html"|"other"; size: number; url: string; previewUrl?: string; html?: boolean;
          };

          if (item.type === "image") {
            const thumbRel = await makeThumbIfImage(rel, data);
            item.previewUrl = thumbRel ? baseUrl + thumbRel : item.url;
          }

          out.push(item);
        }
        return out;
      }

      const allItems = await traverseZip(zip);
      const hasHtml = allItems.some(i => i.type === "html");
      const items = hasHtml ? allItems.filter(i => i.type !== "image") : allItems;

      const images = items.filter(i => i.type === "image").length;
      const htmls  = items.filter(i => i.type === "html").length;
      const others = items.filter(i => i.type === "other").length;
      const isSingleCreative = (images + htmls) === 1;

      return NextResponse.json({
        uploadId: zipId,
        isSingleCreative,
        items,
        counts: { images, htmls, others, total: items.length },
      });
    }
    
    const zip = await JSZip.loadAsync(buf);


    const extractedFiles: Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      originalPath: string;
      previewUrl?: string; 
    }> = [];
    const entries = Object.values(zip.files);
    for (const entry of entries) {
      if (entry.dir) continue;
      const content = await entry.async('nodebuffer');
      const saved = await saveBuffer(content, entry.name);
      
      const fileType = guessType(entry.name);
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name);
      
      let previewUrl: string | undefined;
      if (isImage) {
        try {
          const thumb = await makeImagePreview(content, 400);
          if (thumb) {
            const prev = await saveBuffer(thumb, `preview_${saved.fileName}.jpg`);
            previewUrl = `/api/files/${prev.id}/${encodeURIComponent(prev.fileName)}`;
          }
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
        }
      }

      extractedFiles.push({
        fileId: saved.id,
        fileName: entry.name.split('/').pop() || entry.name,
        fileUrl: `/api/files/${saved.id}/${encodeURIComponent(saved.fileName)}`,
        fileSize: content.length,
        fileType: fileType,
        originalPath: entry.name,
        previewUrl
      });
    }
    return NextResponse.json({
      success: true,
      zipFileId: zipId,
      extractedFiles,
      totalFiles: extractedFiles.length,
      extractionDate: new Date().toISOString()
    });
  }

  const saved = await saveBuffer(buf, file.name);
  const fileUrl = `/api/files/${saved.id}/${encodeURIComponent(saved.fileName)}`;

  let previewUrl: string | undefined;
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
    const thumb = await makeImagePreview(buf, 400);
    if (thumb) {
      const prev = await saveBuffer(thumb, `preview_${saved.fileName}.jpg`);
      previewUrl = `/api/files/${prev.id}/${encodeURIComponent(prev.fileName)}`;
    }
  }

  return NextResponse.json({
    success: true,
    file: {
      fileId: saved.id,
      fileName: saved.fileName,
      fileUrl,
      fileSize: buf.length,
      fileType: file.type || guessType(file.name),
      uploadDate: new Date().toISOString(),
      previewUrl
    }
  });
}

function guessType(name: string) {
  const n = name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(n)) return 'image/' + n.split('.').pop();
  if (/\.html?$/.test(n)) return 'text/html';
  return 'application/octet-stream';
}
