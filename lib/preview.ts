export async function makeImagePreview(buf: Buffer, width = 400) {
  try {
    const sharp = await import('sharp');
    const img = sharp.default(buf).resize({ width }).jpeg({ quality: 70 });
    return await img.toBuffer();
  } catch {
    return null; 
  }
}

export async function makeBasicTextPreview(buf: Buffer, max = 2048) {
  const s = buf.toString('utf8');
  return s.slice(0, max);
}
