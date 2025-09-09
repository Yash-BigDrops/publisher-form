import { NextResponse } from "next/server";
import { getFilePath } from "@/lib/fileStorage";
import { readFile } from "fs/promises";
import { JSDOM } from "jsdom";

export const dynamic = "force-dynamic";

interface CreativeFile {
  id: string;
  name: string;
  url: string;
  type: string;
  html?: boolean;
  embeddedHtml?: string;
  uploadId?: string;
}

interface AnalyzeCreativesRequest {
  files: CreativeFile[];
  creativeType: string;
  offerId?: string;
}

interface AnalyzeCreativesResponse {
  success: boolean;
  analysis?: {
    extractedText: string;
    imageDescriptions: string[];
    htmlContent: string;
    fileCount: number;
    creativeTypes: string[];
    contentType: string;
  };
  error?: string;
}

// Extract text content from HTML
function extractTextFromHtml(html: string): string {
  try {
    const dom = new JSDOM(html);
    const { document } = dom.window;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    
    // Remove common footer/legal elements that don't contain meaningful content
    const footerElements = document.querySelectorAll('footer, .footer, .legal, .unsubscribe, .privacy, .terms');
    footerElements.forEach(el => el.remove());
    
    // Get text content and clean it up
    let text = document.body?.textContent || document.documentElement.textContent || '';
    
    // Clean up whitespace and normalize
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Filter out common footer/legal text patterns
    const footerPatterns = [
      /unsubscribe/gi,
      /privacy policy/gi,
      /terms of service/gi,
      /all rights reserved/gi,
      /copyright/gi,
      /view in browser/gi,
      /manage preferences/gi,
      /update subscription/gi
    ];
    
    // Split text into lines and filter out lines that are only footer text
    const lines = text.split('\n').filter(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return false;
      
      // Keep lines that are not just footer text
      return !footerPatterns.some(pattern => {
        const match = trimmedLine.match(pattern);
        return match && match[0].length === trimmedLine.length;
      });
    });
    
    return lines.join('\n').trim();
  } catch (error) {
    console.error('Error extracting text from HTML:', error);
    return '';
  }
}

// Extract key information from HTML content
function extractKeyInfoFromHtml(html: string): {
  headings: string[];
  links: string[];
  buttons: string[];
  images: string[];
} {
  try {
    const dom = new JSDOM(html);
    const { document } = dom.window;
    
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(el => el.textContent?.trim())
      .filter(Boolean) as string[];
    
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map(el => el.textContent?.trim())
      .filter(Boolean)
      .filter(linkText => {
        // Filter out common footer/legal links
        const footerPatterns = [
          /unsubscribe/gi,
          /privacy policy/gi,
          /terms of service/gi,
          /all rights reserved/gi,
          /copyright/gi,
          /view in browser/gi,
          /manage preferences/gi,
          /update subscription/gi
        ];
        return !footerPatterns.some(pattern => pattern.test(linkText));
      }) as string[];
    
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
      .map(el => el.textContent?.trim() || el.getAttribute('value')?.trim())
      .filter(Boolean) as string[];
    
    const images = Array.from(document.querySelectorAll('img[alt]'))
      .map(el => el.getAttribute('alt')?.trim())
      .filter(Boolean) as string[];
    
    return { headings, links, buttons, images };
  } catch (error) {
    console.error('Error extracting key info from HTML:', error);
    return { headings: [], links: [], buttons: [], images: [] };
  }
}

// Analyze a single creative file
async function analyzeCreativeFile(file: CreativeFile): Promise<{
  text: string;
  keyInfo: { headings: string[]; links: string[]; buttons: string[]; images: string[] };
  type: string;
}> {
  let text = '';
  let keyInfo: { headings: string[]; links: string[]; buttons: string[]; images: string[] } = { 
    headings: [], 
    links: [], 
    buttons: [], 
    images: [] 
  };
  
  try {
    if (file.embeddedHtml) {
      // Use embedded HTML if available
      text = extractTextFromHtml(file.embeddedHtml);
      keyInfo = extractKeyInfoFromHtml(file.embeddedHtml);
    } else if (file.html && file.type === 'html') {
      // Read HTML file from storage
      const filePath = await getFilePath(file.id, file.name);
      const htmlContent = await readFile(filePath, 'utf8');
      text = extractTextFromHtml(htmlContent);
      keyInfo = extractKeyInfoFromHtml(htmlContent);
    } else if (file.type === 'image') {
      // For images, we'll use the filename and any alt text
      text = `Image: ${file.name}`;
      keyInfo = { headings: [], links: [], buttons: [], images: [file.name] };
    } else {
      // For other file types, use filename
      text = `File: ${file.name}`;
    }
  } catch (error) {
    console.error(`Error analyzing file ${file.name}:`, error);
    text = `File: ${file.name}`;
  }
  
  return { text, keyInfo, type: file.type };
}

export async function POST(req: Request) {
  try {
    const { files, creativeType, offerId }: AnalyzeCreativesRequest = await req.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No files provided for analysis"
      }, { status: 400 });
    }
    
    console.log(`Analyzing ${files.length} creative files for ${creativeType} campaign`);
    
    // Analyze all files
    const analysisResults = await Promise.all(
      files.map(file => analyzeCreativeFile(file))
    );
    
    // Combine all extracted text
    const allText = analysisResults
      .map(result => result.text)
      .filter(Boolean)
      .join('\n\n');
    
    // Combine all key information
    const allHeadings = analysisResults
      .flatMap(result => result.keyInfo.headings)
      .filter(Boolean);
    
    const allLinks = analysisResults
      .flatMap(result => result.keyInfo.links)
      .filter(Boolean);
    
    const allButtons = analysisResults
      .flatMap(result => result.keyInfo.buttons)
      .filter(Boolean);
    
    const allImages = analysisResults
      .flatMap(result => result.keyInfo.images)
      .filter(Boolean);
    
    // Get unique creative types
    const creativeTypes = [...new Set(analysisResults.map(result => result.type))];
    
    // Determine overall content type
    const hasText = allText.trim().length > 0;
    const hasImages = allImages.length > 0;
    const hasHtmlElements = allHeadings.length > 0 || allLinks.length > 0 || allButtons.length > 0;
    
    let overallContentType = "Unknown";
    if (hasText && hasImages) {
      overallContentType = "HTML with BOTH TEXT and IMAGE";
    } else if (hasText && !hasImages) {
      overallContentType = "HTML with TEXT ONLY";
    } else if (!hasText && hasImages) {
      overallContentType = "HTML with IMAGE ONLY";
    } else if (creativeTypes.includes("image") && !hasText) {
      overallContentType = "IMAGES";
    }
    
    // If extracted text is too short or only contains footer text, try to get more content
    let finalText = allText;
    if (allText.length < 50 || allText.toLowerCase().includes('unsubscribe')) {
      // Try to extract more meaningful content from the HTML files
      const meaningfulContent = [];
      for (const file of files) {
        if (file.embeddedHtml) {
          const dom = new JSDOM(file.embeddedHtml);
          const { document } = dom.window;
          
          // Look for main content areas
          const mainContent = document.querySelector('main, .main, .content, .body, .email-body, .message');
          if (mainContent) {
            const contentText = mainContent.textContent?.trim();
            if (contentText && contentText.length > 20) {
              meaningfulContent.push(contentText);
            }
          }
          
          // If no main content found, try to get all text but filter better
          if (meaningfulContent.length === 0) {
            const allTextContent = document.body?.textContent || '';
            const lines = allTextContent.split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 10 && !line.toLowerCase().includes('unsubscribe'))
              .slice(0, 10); // Take first 10 meaningful lines
            if (lines.length > 0) {
              meaningfulContent.push(lines.join(' '));
            }
          }
        }
      }
      
      if (meaningfulContent.length > 0) {
        finalText = meaningfulContent.join('\n\n');
      }
    }

    // Build comprehensive analysis
    const analysis = {
      extractedText: finalText,
      imageDescriptions: allImages,
      htmlContent: [
        ...allHeadings.map(h => `Heading: ${h}`),
        ...allLinks.map(l => `Link: ${l}`),
        ...allButtons.map(b => `Button: ${b}`)
      ].join('\n'),
      fileCount: files.length,
      creativeTypes,
      contentType: overallContentType
    };
    
    console.log(`Analysis complete: ${analysis.extractedText.length} chars of text, ${analysis.imageDescriptions.length} images, ${analysis.fileCount} files`);
    console.log("Creative Analysis Result:", JSON.stringify(analysis, null, 2));
    
    return NextResponse.json({
      success: true,
      analysis
    });
    
  } catch (error) {
    console.error('Error analyzing creatives:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}
