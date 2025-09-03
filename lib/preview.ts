export async function makeImagePreview(buf: Buffer, width = 400) {
  try {
    const sharp = await import('sharp');
    const img = sharp.default(buf).resize({ width }).jpeg({ quality: 70 });
    return await img.toBuffer();
  } catch {
    return null; 
  }
}

export async function makeHtmlPreview(htmlContent: string, width = 400, height = 300) {
  try {
    const sharp = await import('sharp');
    
    // Create a simple HTML preview by rendering the HTML to a canvas-like image
    // For now, we'll create a simple preview with HTML content
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <rect x="10" y="10" width="${width-20}" height="${height-20}" fill="white" stroke="#e2e8f0" stroke-width="1"/>
        <text x="${width/2}" y="${height/2 - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#374151">HTML Document</text>
        <text x="${width/2}" y="${height/2 + 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${htmlContent.length} characters</text>
        <text x="${width/2}" y="${height/2 + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">Click to view</text>
      </svg>
    `;
    
    const svgBuffer = Buffer.from(svg);
    const img = sharp.default(svgBuffer).jpeg({ quality: 80 });
    return await img.toBuffer();
  } catch {
    return null;
  }
}

export async function makeBasicTextPreview(buf: Buffer, max = 2048) {
  const s = buf.toString('utf8');
  return s.slice(0, max);
}
