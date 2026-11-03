import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // Публичные страницы и статические файлы
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/privacy' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // картинки, шрифты и т.д.
  ) {
    // Если авторизован и зашел на /login или /register — кидаем на главную
    if ((pathname === '/login' || pathname === '/register') && token) {
      const payload = await verifyToken(token);
      if (payload) return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Всё остальное требует авторизации (Главная, Поиск, Медиатека, Админка и т.д.)
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Защита роутов /admin
  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Применяем ко всем путям, кроме API и статики
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};