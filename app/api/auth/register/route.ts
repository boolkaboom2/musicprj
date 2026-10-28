import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import rateLimit from '@/lib/rate-limit';

// Лимит: 3 попытки регистрации в минуту
const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    try {
      await limiter.check(3, ip);
    } catch {
      return NextResponse.json({ error: 'Слишком много попыток регистрации. Подождите.' }, { status: 429 });
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password, name } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Этот email уже занят' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role }
    });

    const token = await signToken({ userId: user.id, role: user.role });
    
    const response = NextResponse.json({ message: 'Аккаунт создан' }, { status: 201 });
    response.cookies.set('auth_token', token, {
      httpOnly: true, secure: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
