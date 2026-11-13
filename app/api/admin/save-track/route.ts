import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  try {
    const { title, artist, fileId } = await req.json();

    if (!title || !artist || !fileId) {
      return NextResponse.json({ error: 'Не хватает данных' }, { status: 400 });
    }

    const normalized = `${title.toLowerCase().trim()}${artist.toLowerCase().trim()}`.replace(/[^a-z0-9а-я]/g, '');
    const trackHash = createHash('md5').update(normalized).digest('hex');

    const newTrack = await prisma.track.create({
      data: {
        title,
        artist,
        audioUrl: fileId,
        duration: 0,
        genre: 'Other',
        hash: trackHash,
      },
    });

    return NextResponse.json({ success: true, track: newTrack });
  } catch (error) {
    console.error('[Save Track API]', error);
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 });
  }
}