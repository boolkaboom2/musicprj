import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim() === '') {
    return NextResponse.json({ tracks: [], playlists: [] });
  }

  try {
    let tracks: any[] = [];

    if (query.includes(' - ')) {
      const [artistsStr, title] = query.split(' - ').map(s => s.trim());
      const artists = artistsStr.split(',').map(a => a.trim());

      tracks = await prisma.track.findMany({
        where: {
          AND: [
            { OR: artists.map(a => ({ artist: { contains: a, mode: 'insensitive' as const } })) },
            { title: { contains: title, mode: 'insensitive' as const } },
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      if (tracks.length === 0) {
        tracks = await prisma.track.findMany({
          where: { title: { contains: title, mode: 'insensitive' } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
      }
    } else {
      tracks = await prisma.track.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { artist: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
    }

    // Публичные плейлисты по названию
    const playlists = await prisma.playlist.findMany({
      where: {
        isPublic: true,
        title: { contains: query, mode: 'insensitive' }
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          take: 1,
          include: { track: { select: { coverUrl: true } } }
        },
        _count: { select: { items: true } }
      }
    });

    return NextResponse.json({ tracks, playlists });
  } catch (error) {
    console.error('[Search Error]', error);
    return NextResponse.json({ error: 'Ошибка поиска' }, { status: 500 });
  }
}