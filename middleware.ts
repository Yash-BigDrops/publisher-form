import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `rate_limit:${ip}`;
}

function isRateLimited(key: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rateLimitConfig.windowMs
    });
    return { limited: false };
  }
  
  if (record.count >= rateLimitConfig.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { limited: true, retryAfter };
  }
  
  record.count++;
  return { limited: false };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to sensitive routes
  if (pathname.startsWith('/form/submit') || pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    const { limited, retryAfter } = isRateLimited(key);
    
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60'
          }
        }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/form/submit/:path*',
    '/api/:path*'
  ]
};
