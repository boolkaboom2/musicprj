import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q')?.trim();

  if (!rawQuery) return NextResponse.json({ tracks: [], playlists: [] });

  // Отбрасываем скобки: "Tuesday (SPEED UP)" -> "tuesday"
  const queryLower = rawQuery.replace(/\(.*?\)|\[.*?\]/g, '').trim().toLowerCase() || rawQuery.toLowerCase();

  try {
    const rawTracks = await prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: queryLower, mode: 'insensitive' } },
          { artist: { contains: queryLower, mode: 'insensitive' } },
        ],
      },
      take: 100,
    });

    const scoredTracks = rawTracks.map(track => {
      let score = 0;
      const tTitle = track.title.toLowerCase();
      const tArtist = track.artist.toLowerCase();

      if (tTitle === queryLower) score += 100;
      else if (tTitle.startsWith(queryLower)) score += 50;
      else if (tTitle.includes(queryLower)) score += 20;

      if (tArtist === queryLower) score += 80;
      else if (tArtist.startsWith(queryLower)) score += 40;
      else if (tArtist.includes(queryLower)) score += 10;

      return { ...track, _score: score };
    });

    scoredTracks.sort((a, b) => b._score - a._score);
    const tracks = scoredTracks.slice(0, 30).map(({ _score, ...track }) => track);

    const playlists = await prisma.playlist.findMany({
      where: { isPublic: true, title: { contains: queryLower, mode: 'insensitive' } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { take: 1, include: { track: { select: { coverUrl: true } } } },
        _count: { select: { items: true } }
      }
    });

    return NextResponse.json({ tracks, playlists });
  } catch (error) {
    console.error('[Search Error]', error);
    return NextResponse.json({ error: 'Ошибка поиска' }, { status: 500 });
  }
}