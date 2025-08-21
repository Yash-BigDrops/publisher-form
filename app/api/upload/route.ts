import { NextRequest, NextResponse } from 'next/server';
import { saveBuffer } from '@/lib/fileStorage';
import { randomUUID } from 'crypto';
import JSZip from 'jszip';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const smartDetection = form.get('smartDetection') === 'true';
  
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  if ((file.type || '').includes('zip') || /\.zip$/i.test(file.name)) {
    // TODO: BACKEND INTEGRATION - Smart ZIP Detection for Single vs Multiple Creatives
    // 
    // CRITICAL IMPLEMENTATION GUIDE:
    // 
    // SMART DETECTION LOGIC:
    // The system needs to intelligently determine if a ZIP file contains:
    // 1. Single Creative + Assets (treat as single creative)
    // 2. Multiple Creatives (redirect to multiple upload flow)
    // 
    // DETECTION CRITERIA FOR SINGLE CREATIVE:
    // 
    // 1. MAIN HTML FILE DETECTION:
    //    - Look for primary HTML files in root or main directory
    //    - Priority order: index.html, main.html, [filename].html, any .html
    //    - Exclude: preview.html, test.html, temp.html, backup.html
    //    - Check if HTML file contains actual content (not just template)
    // 
    // 2. ASSET STRUCTURE ANALYSIS:
    //    - Count HTML/HTM files (main creative files)
    //    - Count asset files (images, CSS, JS, fonts)
    //    - Analyze directory structure depth
    //    - Check for common asset folders: images/, css/, js/, assets/, media/
    // 
    // 3. SINGLE CREATIVE CRITERIA:
    //    - Exactly 1 main HTML file OR
    //    - 1 main HTML + supporting assets OR
    //    - Assets without HTML (image-only creative with resources)
    //    - Total HTML files <= 1 (excluding fragments/includes)
    // 
    // 4. MULTIPLE CREATIVE CRITERIA:
    //    - Multiple independent HTML files (2+)
    //    - Separate directories with individual creatives
    //    - Multiple complete creative sets
    //    - No clear main file structure
    // 
    // IMPLEMENTATION EXAMPLE:
    // 
    // async function analyzeZipStructure(zip: JSZip): Promise<ZipAnalysis> {
    //   const entries = Object.values(zip.files).filter(f => !f.dir)
    //   const htmlFiles = entries.filter(f => /\.html?$/i.test(f.name))
    //   const assetFiles = entries.filter(f => !f.dir && !/\.html?$/i.test(f.name))
    //   
    //   // Categorize HTML files
    //   const mainHtmlFiles = htmlFiles.filter(f => {
    //     const name = f.name.toLowerCase()
    //     const fileName = name.split('/').pop() || ''
    //     
    //     // Exclude utility/template files
    //     if (['preview', 'test', 'temp', 'backup', 'template'].some(ex => fileName.includes(ex))) {
    //       return false
    //     }
    //     
    //     // Priority for main files
    //     if (['index.html', 'main.html'].includes(fileName)) return true
    //     
    //     // Check if it's in root or main directory
    //     const pathDepth = f.name.split('/').length
    //     return pathDepth <= 2 // Root or one level deep
    //   })
    //   
    //   // Analyze asset structure
    //   const assetTypes = [...new Set(assetFiles.map(f => {
    //     const ext = f.name.split('.').pop()?.toLowerCase()
    //     if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image'
    //     if (['css'].includes(ext || '')) return 'stylesheet'
    //     if (['js'].includes(ext || '')) return 'script'
    //     if (['woff', 'woff2', 'ttf', 'otf'].includes(ext || '')) return 'font'
    //     return 'other'
    //   }))]
    //   
    //   // Decision logic
    //   const isSingleCreative = (
    //     mainHtmlFiles.length === 1 || // Exactly one main HTML
    //     (mainHtmlFiles.length === 0 && assetFiles.length > 0) || // Assets only
    //     (htmlFiles.length === 1 && assetFiles.length >= 0) // One HTML total
    //   )
    //   
    //   return {
    //     isSingleCreative,
    //     mainCreative: mainHtmlFiles[0] || htmlFiles[0] || null,
    //     htmlFileCount: htmlFiles.length,
    //     assetCount: assetFiles.length,
    //     assetTypes,
    //     totalFiles: entries.length,
    //     structure: analyzeDirectoryStructure(entries)
    //   }
    // }
    // 
    // DIRECTORY STRUCTURE PATTERNS:
    // 
    // SINGLE CREATIVE EXAMPLES:
    // ├── index.html (main file)
    // ├── images/
    // │   ├── logo.png
    // │   └── banner.jpg
    // ├── css/
    // │   └── styles.css
    // └── js/
    //     └── script.js
    // 
    // OR:
    // ├── creative.html
    // ├── background.jpg
    // ├── logo.png
    // └── styles.css
    // 
    // MULTIPLE CREATIVE EXAMPLES:
    // ├── creative1/
    // │   ├── index.html
    // │   └── images/
    // ├── creative2/
    // │   ├── main.html
    // │   └── assets/
    // └── creative3/
    //     └── landing.html
    // 
    // OR:
    // ├── banner-300x250.html
    // ├── banner-728x90.html
    // ├── banner-160x600.html
    // └── shared-assets/
    // 
    // RESPONSE FORMAT:
    // 
    // For Single Creative:
    // {
    //   "success": true,
    //   "zipAnalysis": {
    //     "isSingleCreative": true,
    //     "mainCreative": {
    //       "fileId": "abc123",
    //       "fileName": "index.html",
    //       "fileUrl": "/api/uploads?id=abc123&name=index.html",
    //       "fileSize": 2048,
    //       "fileType": "text/html",
    //       "previewUrl": "/api/uploads?id=preview123&name=preview.jpg"
    //     },
    //     "assetCount": 5,
    //     "assetTypes": ["image", "stylesheet", "script"],
    //     "totalSize": 50000,
    //     "structure": "single-with-assets"
    //   }
    // }
    // 
    // For Multiple Creatives:
    // {
    //   "success": true,
    //   "zipAnalysis": {
    //     "isSingleCreative": false,
    //     "creativeCount": 3,
    //     "structure": "multiple-separate",
    //     "recommendation": "use-multiple-upload-flow"
    //   }
    // }
    // 
    // EDGE CASES TO HANDLE:
    // 1. ZIP with only images (no HTML) - treat as single creative assets
    // 2. ZIP with HTML fragments/includes - analyze for main file
    // 3. ZIP with mixed content - prioritize clear creative structure
    // 4. ZIP with nested directories - analyze depth and structure
    // 5. ZIP with external dependencies - maintain asset references
    // 
    // PERFORMANCE CONSIDERATIONS:
    // 1. Stream ZIP analysis without full extraction
    // 2. Cache analysis results for duplicate uploads
    // 3. Limit analysis to first 100 files for large ZIPs
    // 4. Timeout protection for complex analysis
    // 
    // IMPLEMENTATION PRIORITY:
    // 1. Implement basic HTML file counting
    // 2. Add directory structure analysis
    // 3. Implement asset categorization
    // 4. Add smart detection logic
    // 5. Handle edge cases and optimization
    
    if (smartDetection) {
      // TODO: Implement smart ZIP analysis here
      // For now, return existing ZIP extraction logic
      console.log('Smart ZIP detection requested - implement analysis logic')
    }
    
    const zip = await JSZip.loadAsync(buf);
    const zipId = randomUUID();
    // TODO: BACKEND INTEGRATION - Image Preview Generation for ZIP Uploads
    // 
    // CRITICAL IMPLEMENTATION REQUIRED:
    // The frontend expects image files to have proper preview URLs for display in cards.
    // Currently, image previews are showing placeholders because no preview generation
    // is implemented for ZIP extracted files.
    // 
    // IMPLEMENTATION REQUIREMENTS:
    // 
    // 1. IMAGE DETECTION:
    //    - Detect image files during ZIP extraction
    //    - Support formats: .jpg, .jpeg, .png, .gif, .webp, .svg
    //    - Use file extension and/or MIME type detection
    // 
    // 2. THUMBNAIL GENERATION:
    //    - Generate thumbnails for image files (recommended: 300x200px)
    //    - Use sharp, jimp, or similar image processing library
    //    - Save thumbnails with consistent naming: `thumb_${originalFileName}.jpg`
    //    - Optimize for web display (JPEG quality: 80-85%)
    // 
    // 3. PREVIEW URL GENERATION:
    //    - For image files: set previewUrl to thumbnail URL
    //    - For non-images: leave previewUrl as undefined/null
    //    - Ensure thumbnail URLs are accessible via /api/uploads endpoint
    // 
    // EXAMPLE IMPLEMENTATION:
    // 
    // import sharp from 'sharp';
    // 
    // async function generateImagePreview(buffer: Buffer, fileName: string): Promise<string | null> {
    //   try {
    //     const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    //     if (!isImage) return null;
    // 
    //     // Generate thumbnail
    //     const thumbnail = await sharp(buffer)
    //       .resize(300, 200, { fit: 'cover' })
    //       .jpeg({ quality: 85 })
    //       .toBuffer();
    // 
    //     // Save thumbnail
    //     const thumbFileName = `thumb_${fileName.replace(/\.[^.]+$/, '.jpg')}`;
    //     const saved = await saveBuffer(thumbnail, thumbFileName);
    //     return `/api/uploads?id=${saved.id}&name=${encodeURIComponent(saved.fileName)}`;
    //   } catch (error) {
    //     console.error('Thumbnail generation failed:', error);
    //     return null;
    //   }
    // }
    // 
    // UPDATED RESPONSE FORMAT:
    // Each extracted file should include previewUrl field:
    // {
    //   fileId: string,
    //   fileName: string,
    //   fileUrl: string,
    //   fileSize: number,
    //   fileType: string,
    //   originalPath: string,
    //   previewUrl?: string  // <- ADD THIS FIELD FOR IMAGES
    // }
    // 
    // ERROR HANDLING:
    // - If thumbnail generation fails, log error but continue processing
    // - Set previewUrl to null for failed thumbnail generation
    // - Ensure original file is still accessible even if preview fails
    // 
    // PERFORMANCE CONSIDERATIONS:
    // - Process thumbnails in parallel where possible
    // - Add timeout protection for large images
    // - Consider async thumbnail generation for very large ZIP files
    // - Cache thumbnails to avoid regeneration on duplicate uploads
    // 
    // SECURITY CONSIDERATIONS:
    // - Validate image files before processing
    // - Sanitize file names for thumbnail storage
    // - Limit thumbnail generation to reasonable file sizes (e.g., < 50MB)
    // - Use secure image processing library to prevent exploits

    const extractedFiles: Array<{
      fileId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      originalPath: string;
      previewUrl?: string; // TODO: Implement image preview generation
    }> = [];
    const entries = Object.values(zip.files);
    for (const entry of entries) {
      if (entry.dir) continue;
      const content = await entry.async('nodebuffer');
      const saved = await saveBuffer(content, entry.name);
      
      // TODO: Generate preview URL for image files
      const fileType = guessType(entry.name);
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name);
      const previewUrl: string | undefined = undefined;
      
      if (isImage) {
        // TODO: Implement thumbnail generation here
        // previewUrl = await generateImagePreview(content, entry.name);
        console.log(`TODO: Generate thumbnail for image file: ${entry.name}`);
      }
      
      extractedFiles.push({
        fileId: saved.id,
        fileName: entry.name.split('/').pop() || entry.name,
        fileUrl: `/api/uploads?id=${saved.id}&name=${encodeURIComponent(saved.fileName)}`,
        fileSize: content.length,
        fileType: fileType,
        originalPath: entry.name,
        previewUrl: previewUrl
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
  return NextResponse.json({
    success: true,
    file: {
      fileId: saved.id,
      fileName: file.name,
      fileUrl: `/api/uploads?id=${saved.id}&name=${encodeURIComponent(file.name)}`,
      fileSize: buf.length,
      fileType: file.type || guessType(file.name),
      uploadDate: new Date().toISOString()
    }
  });
}

function guessType(name: string) {
  const n = name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(n)) return 'image/' + n.split('.').pop();
  if (/\.html?$/.test(n)) return 'text/html';
  return 'application/octet-stream';
}
