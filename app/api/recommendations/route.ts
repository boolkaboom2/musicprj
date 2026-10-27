import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');
  const excludeIdsParam = searchParams.get('excludeIds');
  const excludeIds = excludeIdsParam ? excludeIdsParam.split(',') : [];

  if (!trackId) {
    return NextResponse.json({ error: 'Не передан trackId' }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;
    const userId = payload?.userId;

    const currentTrack = await prisma.track.findUnique({ where: { id: trackId } });
    if (!currentTrack) return NextResponse.json({ error: 'Трек не найден' }, { status: 404 });

    // Получаем историю пользователя за 24 часа
    let recentlyPlayedIds: string[] = [];
    if (userId) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const history = await prisma.listenHistory.findMany({
        where: { userId, playedAt: { gte: oneDayAgo } },
        select: { trackId: true },
      });
      recentlyPlayedIds = history.map(h => h.trackId);
    }

    // Объединяем исключения (текущий трек + история + то, что уже в очереди)
    const allExcludeIds = Array.from(new Set([trackId, ...recentlyPlayedIds, ...excludeIds]));

    // Ищем по жанру или исполнителю (берем 10 штук)
    const recommendations = await prisma.track.findMany({
      where: {
        id: { notIn: allExcludeIds },
        OR: [
          { genre: currentTrack.genre ? currentTrack.genre : undefined },
          { artist: currentTrack.artist },
        ],
      },
      take: 10,
    });

    // Если нашли 10 треков — отдаем
    if (recommendations.length >= 5) {
      return NextResponse.json(recommendations);
    }

    // Если мало (или пусто) — добиваем случайными треками
    const randomTracks = await prisma.track.findMany({
      where: { id: { notIn: allExcludeIds } },
      take: 10 - recommendations.length,
    });

    // Склеиваем и отдаем
    return NextResponse.json([...recommendations, ...randomTracks]);
  } catch (error) {
    console.error('Ошибка рекомендаций:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}