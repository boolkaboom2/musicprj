import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Введите код' }, { status: 400 });

    const validInvite = await prisma.inviteCode.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!validInvite || validInvite.usedBy) {
      return NextResponse.json({ error: 'Неверный или уже использованный код' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}