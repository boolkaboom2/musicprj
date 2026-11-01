import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { isPublic: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } }
      }
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('[Public Playlists Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}