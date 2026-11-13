import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const excludeIdsParam = searchParams.get('excludeIds');
  const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    // 1. Если пользователь не авторизован — даем случайные треки
    if (!payload?.userId) {
      const randomTracks = await prisma.track.findMany({
        take: 10,
        where: { id: { notIn: excludeIds } },
      });
      return NextResponse.json(randomTracks);
    }

    const userId = payload.userId;

    // 2. Получаем лайки текущего пользователя
    const userLikes = await prisma.like.findMany({
      where: { userId },
      select: { trackId: true }
    });
    const likedTrackIds = userLikes.map(l => l.trackId);

    // Если лайков нет — даем случайные
    if (likedTrackIds.length === 0) {
      const randomTracks = await prisma.track.findMany({
        take: 10,
        where: { id: { notIn: excludeIds } },
      });
      return NextResponse.json(randomTracks);
    }

    // 3. Ищем "похожих" пользователей (тех, кто лайкнул те же треки)
    const similarUsers = await prisma.like.groupBy({
      by: ['userId'],
      where: {
        trackId: { in: likedTrackIds },
        userId: { not: userId } // Исключаем самого себя
      },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10 // Берем топ-10 пользователей с похожими вкусами
    });

    const similarUserIds = similarUsers.map(u => u.userId);

    // 4. Если не нашли похожих — даем треки того же жанра/артиста
    if (similarUserIds.length === 0) {
      const favArtist = await prisma.track.findFirst({ where: { id: likedTrackIds[0] } });
      if (favArtist) {
        const similarTracks = await prisma.track.findMany({
          take: 10,
          where: {
            id: { notIn: [...likedTrackIds, ...excludeIds] },
            OR: [
              { artist: { contains: favArtist.artist, mode: 'insensitive' } },
              { genre: { equals: favArtist.genre || 'Other', mode: 'insensitive' } }
            ]
          }
        });
        if (similarTracks.length > 0) return NextResponse.json(similarTracks);
      }
    }

    // 5. Берем лайки от "похожих" пользователей, которых нет у текущего
    const recommendations = await prisma.like.findMany({
      where: {
        userId: { in: similarUserIds },
        trackId: { notIn: [...likedTrackIds, ...excludeIds] }
      },
      select: { trackId: true }
    });

    // Считаем частоту рекомендаций (чем больше людей лайкнули, тем выше)
    const trackFrequency: Record<string, number> = {};
    recommendations.forEach(r => {
      trackFrequency[r.trackId] = (trackFrequency[r.trackId] || 0) + 1;
    });

    // Сортируем по популярности и берем топ-10
    const sortedTrackIds = Object.keys(trackFrequency).sort((a, b) => trackFrequency[b] - trackFrequency[a]).slice(0, 10);

    // 6. Достаем сами треки из базы
    const recommendedTracks = await prisma.track.findMany({
      where: { id: { in: sortedTrackIds } }
    });

    // Если алгоритм не сработал (мало данных), добиваем случайными
    if (recommendedTracks.length < 5) {
      const randomTracks = await prisma.track.findMany({
        take: 10 - recommendedTracks.length,
        where: { id: { notIn: [...likedTrackIds, ...excludeIds, ...recommendedTracks.map(t => t.id)] } },
      });
      return NextResponse.json([...recommendedTracks, ...randomTracks]);
    }

    return NextResponse.json(recommendedTracks);
  } catch (error) {
    console.error('[Smart Recommendations Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}