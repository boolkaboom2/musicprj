import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import rateLimit from '@/lib/rate-limit';

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

    const { email, password, name, inviteCode } = result.data;

    // Проверка инвайт-кода
    if (!inviteCode) {
      return NextResponse.json({ error: 'Требуется инвайт-код' }, { status: 403 });
    }

    const validInvite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode }
    });

    if (!validInvite || validInvite.usedBy) {
      return NextResponse.json({ error: 'Неверный или уже использованный код' }, { status: 403 });
    }

    if (validInvite.expiresAt && validInvite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Срок действия кода истек' }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Этот email уже занят' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    // Транзакция: создаем юзера и помечаем инвайт использованным
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, password: hashedPassword, name, role }
      });

      await tx.inviteCode.update({
        where: { id: validInvite.id },
        data: { usedBy: newUser.id, usedAt: new Date() }
      });

      return newUser;
    });

    const token = await signToken({ userId: user.id, role: user.role });
    
    const response = NextResponse.json({ message: 'Аккаунт создан' }, { status: 201 });
    response.cookies.set('auth_token', token, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}