import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Берем реальный домен из заголовков (как мы делали для сброса пароля)
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const origin = host ? `${protocol}://${host}` : 'http://localhost:3000';

  const response = NextResponse.redirect(new URL('/', origin));
  response.cookies.delete('auth_token');
  return response;
}