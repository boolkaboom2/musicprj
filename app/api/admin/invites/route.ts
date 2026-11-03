import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const invites = await prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } }
    });

    return NextResponse.json(invites);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    // Генерируем уникальный код (8 символов)
    const code = randomBytes(4).toString('hex').toUpperCase();

    const invite = await prisma.inviteCode.create({
      data: {
        code,
        createdBy: payload.userId,
      }
    });

    return NextResponse.json(invite);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка генерации' }, { status: 500 });
  }
}