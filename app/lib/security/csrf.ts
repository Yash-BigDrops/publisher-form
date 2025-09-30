import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf';
const CSRF_TOKEN_LENGTH = 32;

export async function createCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  });
  
  return token;
}

export async function verifyCsrfToken(formToken: string | null): Promise<boolean> {
  if (!formToken) {
    return false;
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(formToken, 'hex'),
    Buffer.from(cookieToken, 'hex')
  );
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Invalid CSRF token' },
    { status: 403 }
  );
}
