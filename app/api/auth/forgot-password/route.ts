import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: 'Если такой email существует, ссылка отправлена' }, { status: 200 });
    }

    const resetToken = await signToken({ userId: user.id, role: 'RESET' });
    
    // Берем реальный домен (на Render это будет твой адрес, локально - localhost)
    const origin = new URL(req.url).origin;

    console.log(`\n=== ССЫЛКА ДЛЯ СБРОСА ПАРОЛЯ ДЛЯ ${email} ===`);
    console.log(`${origin}/reset-password?token=${resetToken}`);
    console.log(`====================================================\n`);

    return NextResponse.json({ message: 'Ссылка отправлена в консоль' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}