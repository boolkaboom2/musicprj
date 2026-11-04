import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // Публичные страницы
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/welcome' ||
    pathname === '/forgot-password' || // <-- ДОБАВИЛИ
    pathname === '/reset-password' ||  // <-- ДОБАВИЛИ
    pathname === '/privacy' ||
    pathname === '/faq' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    // Если авторизован и зашел на auth/welcome — кидаем на главную
    if ((pathname === '/login' || pathname === '/register' || pathname === '/welcome' || pathname === '/forgot-password' || pathname === '/reset-password') && token) {
      const payload = await verifyToken(token);
      if (payload) return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Всё остальное требует авторизации
  if (!token) {
    return NextResponse.redirect(new URL('/welcome', req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/welcome', req.url));
  }

  // Защита роутов /admin
  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};