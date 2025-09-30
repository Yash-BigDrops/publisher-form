import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const uploadRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().min(1, 'MIME type is required'),
  size: z.number().min(1, 'File size must be greater than 0')
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = process.env.ALLOWED_MIME?.split(',') || [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, mimetype, size } = uploadRequestSchema.parse(body);
    
    // Validate file size
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }
    
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
      return NextResponse.json(
        { error: `File type ${mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate a unique key for the file
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const key = `uploads/${timestamp}-${randomId}-${filename}`;
    
    // In a real implementation, you would generate a presigned URL here
    // For now, we'll return a mock response
    const presignedUrl = `https://storage.example.com/${key}`;
    
    return NextResponse.json({
      url: presignedUrl,
      key: key,
      expiresIn: 3600 // 1 hour
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    console.error('Upload presign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
