import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'RESET') {
      return NextResponse.json({ error: 'Ссылка недействительна или устарела' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: 'Пароль обновлен' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}