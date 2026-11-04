import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { tracks } = await req.json();
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: 'Нет треков для импорта' }, { status: 400 });
    }

    const batchId = randomUUID();

    // Создаем задачи в БД
    await prisma.importTask.createMany({
      data: tracks.map((t: any) => ({
        batchId,
        userId: payload.userId,
        title: t.title,
        artist: t.artist,
      }))
    });

    return NextResponse.json({ success: true, batchId });
  } catch (error) {
    console.error('[Import Queue Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}