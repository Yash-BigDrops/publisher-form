export async function maybeConvert(buffer: Buffer, mime: string): Promise<{ buffer: Buffer; mime: string; ext: string | null }> {
  if (process.env.ENABLE_IMAGE_CONVERSION === '1' && mime === 'image/webp') {
    try {
      const sharp = await import('sharp');
      const out = await sharp.default(buffer).jpeg({ quality: 80 }).toBuffer();
      return { buffer: out, mime: 'image/jpeg', ext: 'jpg' };
    } catch {
      
    }
  }
  return { buffer, mime, ext: null };
}
