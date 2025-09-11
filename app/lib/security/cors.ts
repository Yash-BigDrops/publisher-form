import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [
  'https://cms.bigdropsmarketing.com',
  'https://bigdropsmarketing.com'
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Vary': 'Origin'
  };
}

export function corsPreflightResponse(origin: string | null): NextResponse {
  const headers = getCorsHeaders(origin);
  
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers }
    );
  }
  
  return new NextResponse(null, { status: 204, headers });
}

export function corsErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'CORS policy violation' },
    { status: 403 }
  );
}

export function handleCors(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (request.method === 'OPTIONS') {
    return corsPreflightResponse(origin);
  }
  
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return corsErrorResponse();
  }
  
  return null;
}
