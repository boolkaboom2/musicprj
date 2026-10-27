import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Проверяем существование юзера и совпадение паролей
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    // Создаем токен
    const token = await signToken({ userId: user.id, role: user.role });
    
    // Отправляем токен в защищенной куке (HttpOnly)
    const response = NextResponse.json({ message: 'Успех', role: user.role });
    response.cookies.set('auth_token', token, {
      httpOnly: true, // JS на клиенте не может прочитать (защита от XSS)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}