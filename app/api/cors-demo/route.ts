import { NextRequest, NextResponse } from 'next/server';
import { handleCors, getCorsHeaders } from '@/app/lib/security/cors';

export async function GET(request: NextRequest) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);
  
  return NextResponse.json(
    { 
      message: 'CORS demo endpoint',
      origin: origin || 'none',
      timestamp: new Date().toISOString()
    },
    { headers }
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCors(request) || new NextResponse(null, { 
    status: 204, 
    headers: getCorsHeaders(origin) 
  });
}
