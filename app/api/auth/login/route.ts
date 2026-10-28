import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import rateLimit from '@/lib/rate-limit';

// Лимит: 5 запросов в минуту
const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
  try {
    // Получаем IP (за Nginx он в x-forwarded-for)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    try {
      await limiter.check(5, ip); // Проверка лимита
    } catch {
      return NextResponse.json({ error: 'Слишком много попыток входа. Подождите минуту.' }, { status: 429 });
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, role: user.role });
    
    const response = NextResponse.json({ message: 'Успех', role: user.role });
    response.cookies.set('auth_token', token, {
      httpOnly: true, secure: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
