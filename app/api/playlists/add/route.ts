import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { playlistId, trackId } = await req.json();

    // Проверяем, есть ли уже этот трек в плейлисте
    const existingItem = await prisma.playlistItem.findFirst({
      where: { playlistId, trackId },
    });

    if (existingItem) {
      return NextResponse.json({ message: 'Трек уже в плейлисте' }, { status: 200 });
    }

    // Узнаем последний order, чтобы добавить в конец
    const lastItem = await prisma.playlistItem.findFirst({
      where: { playlistId },
      orderBy: { order: 'desc' },
    });

    const newOrder = lastItem ? lastItem.order + 1 : 0;

    await prisma.playlistItem.create({
      data: { playlistId, trackId, order: newOrder },
    });

    return NextResponse.json({ message: 'Трек добавлен' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}