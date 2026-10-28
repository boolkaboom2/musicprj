import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }

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
      httpOnly: true,
      secure: false, // <--- И ЗДЕСЬ ТОЖЕ
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
