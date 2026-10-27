import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Из соображений безопасности не говорим, что юзера нет
      return NextResponse.json({ message: 'Если такой email существует, ссылка отправлена' }, { status: 200 });
    }

    // Генерируем временный токен на 15 минут для сброса
    const resetToken = await signToken({ userId: user.id, role: 'RESET' });
    
    // В реальном проекте здесь отправляется email.
    // Так как у нас бюджет 0, выводим ссылку в консоль сервера.
    console.log(`\n=== ССЫЛКА ДЛЯ СБРОСА ПАРОЛЯ ДЛЯ ${email} ===`);
    console.log(`http://localhost:3000/reset-password?token=${resetToken}`);
    console.log(`====================================================\n`);

    return NextResponse.json({ message: 'Ссылка отправлена в консоль' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}