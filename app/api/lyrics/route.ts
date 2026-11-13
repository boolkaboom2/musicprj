import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchLyrics } from '@/lib/lyrics';

export async function POST(req: Request) {
  try {
    const { trackId } = await req.json();
    
    if (!trackId) {
      return NextResponse.json({ error: 'Нет ID трека' }, { status: 400 });
    }

    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return NextResponse.json({ error: 'Трек не найден' }, { status: 404 });
    }

    // Если текст уже есть в базе — отдаем его
    if (track.lyrics || track.syncedLyrics) {
      return NextResponse.json({ 
        plainLyrics: track.lyrics, 
        syncedLyrics: track.syncedLyrics 
      });
    }

    // Если нет — ищем в интернете
    const result = await fetchLyrics(track.artist, track.title);

    // Если нашли — сохраняем в БД, чтобы не искать каждый раз
    if (result.plainLyrics || result.syncedLyrics) {
      await prisma.track.update({
        where: { id: trackId },
        data: {
          lyrics: result.plainLyrics,
          syncedLyrics: result.syncedLyrics,
        },
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Текст не найден' }, { status: 404 });
  } catch (error) {
    console.error('[Lyrics API Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}