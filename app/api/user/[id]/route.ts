import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true, // Можно скрыть, если не хотим светить
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        telegram: true,
        createdAt: true,
        playlists: {
          where: { isPublic: true },
          include: { _count: { select: { items: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}