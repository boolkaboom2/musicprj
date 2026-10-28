import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, role: user.role });
    
    const response = NextResponse.json({ message: 'Успех', role: user.role });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false, // <--- ГЛАВНЫЙ ФИКС: отключаем Secure для HTTP
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
