import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim() === '') {
    return NextResponse.json([]);
  }

  try {
    let whereClause: any = {};

    if (query.includes(' - ')) {
      // Разбиваем на исполнителей и название
      const [artistsStr, title] = query.split(' - ').map(s => s.trim());
      
      // Разбиваем исполнителей по запятой (если их несколько)
      const artists = artistsStr.split(',').map(a => a.trim());

      whereClause = {
        AND: [
          // Ищем совпадение хотя бы по одному из артистов
          {
            OR: artists.map(artist => ({
              artist: { contains: artist, mode: 'insensitive' }
            }))
          },
          // И по названию
          { title: { contains: title, mode: 'insensitive' } }
        ]
      };
    } else {
      // Если дефиса нет, ищем по совпадению в названии или исполнителе
      whereClause = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    const tracks = await prisma.track.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(tracks);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка поиска' }, { status: 500 });
  }
}