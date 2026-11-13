import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const apiSecret = req.headers.get('x-api-secret');
    
    // Проверка секретного ключа
    if (apiSecret !== process.env.SERVER_API_SECRET) {
       return NextResponse.json({ error: 'Доступ запрещён (неверный ключ)' }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) return NextResponse.json({ error: 'Админ не найден в базе' }, { status: 500 });

    const { tracks } = await req.json();
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: 'Нет треков для импорта' }, { status: 400 });
    }

    const batchId = randomUUID();

    await prisma.importTask.createMany({
      data: tracks.map((t: any) => ({
        batchId,
        userId: admin.id,
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