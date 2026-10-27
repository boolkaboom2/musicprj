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
    
    // Достаем реальный домен из заголовков (работает за прокси Render)
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const origin = host ? `${protocol}://${host}` : 'http://localhost:3000';

    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    console.log(`\n=== ССЫЛКА ДЛЯ СБРОСА ПАРОЛЯ ДЛЯ ${email} ===`);
    console.log(resetLink);
    console.log(`====================================================\n`);

    // Возвращаем ссылку на клиент
    return NextResponse.json({ 
      message: 'Ссылка сгенерирована',
      resetLink: resetLink 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}