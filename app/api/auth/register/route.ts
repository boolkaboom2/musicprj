import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

    // Хэшируем пароль (10 - сложность соли)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Делаем первого зарегистрированного пользователя АДМИНОМ, остальных - ЮЗЕРАМИ
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    await prisma.user.create({
      data: { email, password: hashedPassword, name, role }
    });

    return NextResponse.json({ message: 'Аккаунт создан' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}