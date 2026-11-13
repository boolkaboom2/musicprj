import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enrichMetadata } from '@/lib/downloader';
import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const apiSecret = req.headers.get('x-api-secret');
    if (apiSecret !== process.env.SERVER_API_SECRET) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { query, fileId } = await req.json();

    if (!query || !fileId) {
      return NextResponse.json({ error: 'Не хватает данных' }, { status: 400 });
    }

    let baseArtist = 'Unknown';
    let baseTitle = query;
    if (query.includes('-')) {
      const parts = query.split('-');
      baseArtist = parts[0].trim();
      baseTitle = parts[1].trim();
    } else {
      baseArtist = query; 
    }

    let meta: any = {
      title: baseTitle,
      artist: baseArtist,
      coverUrl: null,
      duration: 0,
      genre: 'Other',
      releaseYear: null
    };

    // БЕЗОПАСНЫЙ ПОИСК МЕТАДАННЫХ
    try {
      console.log(`[Save Track] Обогащаем метаданные для: ${query}`);
      const enriched = await enrichMetadata(baseTitle, baseArtist, null);
      if (enriched) meta = enriched;
    } catch (e) {
      console.log(`[Save Track] Ошибка обогащения (iTunes/Deezer упали). Сохраняем сырые данные.`);
    }

    const normalized = `${meta.title.toLowerCase().trim()}${meta.artist.toLowerCase().trim()}`.replace(/[^a-z0-9а-я]/g, '');
    const trackHash = createHash('md5').update(normalized).digest('hex');

    const existing = await prisma.track.findFirst({ 
      where: { 
        OR: [
          { hash: trackHash },
          { title: query }
        ]
      } 
    });

    if (existing) {
      const updated = await prisma.track.update({
        where: { id: existing.id },
        data: {
          title: meta.title,
          artist: meta.artist,
          coverUrl: meta.coverUrl,
          duration: meta.duration,
          genre: meta.genre,
          releaseYear: meta.releaseYear,
          audioUrl: fileId,
          hash: trackHash,
        }
      });
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, track: updated, updated: true });
    }

    const newTrack = await prisma.track.create({
      data: {
        title: meta.title,
        artist: meta.artist,
        audioUrl: fileId,
        coverUrl: meta.coverUrl,
        duration: meta.duration,
        genre: meta.genre,
        releaseYear: meta.releaseYear,
        hash: trackHash,
      },
    });

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, track: newTrack });
  } catch (error) {
    console.error('[Save Track API]', error);
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 });
  }
}