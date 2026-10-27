import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  
  // Защита роутов /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Если авторизован и зашел на /login или /register — кидаем на главную
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register'],
};