import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID, createHash } from 'crypto';

function generateHash(title: string, artist: string): string {
  const normalized = `${title.toLowerCase().trim()}${artist.toLowerCase().trim()}`.replace(/[^a-z0-9а-я]/g, '');
  return createHash('md5').update(normalized).digest('hex');
}

export async function POST(req: Request) {
  try {
    const apiSecret = req.headers.get('x-api-secret');
    if (apiSecret !== process.env.SERVER_API_SECRET) {
       return NextResponse.json({ error: 'Доступ запрещён' }, { status: 401 });
    }

    // --- ЛОГИКА ВОЗОБНОВЛЕНИЯ (RESUME) ---
    const resumeBatchId = req.headers.get('x-resume-batch-id');
    if (resumeBatchId) {
      await prisma.importTask.updateMany({
        where: { batchId: resumeBatchId, status: { in: ['CANCELLED', 'FAILED'] } },
        data: { status: 'PENDING' }
      });
      return NextResponse.json({ success: true, batchId: resumeBatchId, resumed: true });
    }

    // --- СОЗДАНИЕ НОВОГО ИМПОРТА ---
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) return NextResponse.json({ error: 'Админ не найден' }, { status: 500 });

    const { tracks } = await req.json();
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: 'Нет треков' }, { status: 400 });
    }

    // ДЕДУПЛИКАЦИЯ: Проверяем, какие треки уже есть в базе
    const hashes = tracks.map((t: any) => generateHash(t.title, t.artist));
    const existingTracks = await prisma.track.findMany({
      where: { hash: { in: hashes } },
      select: { hash: true }
    });
    
    const existingHashes = new Set(existingTracks.map(t => t.hash));
    const newTracksToImport = tracks.filter((t: any) => !existingHashes.has(generateHash(t.title, t.artist)));
    const skippedCount = tracks.length - newTracksToImport.length;

    // Если все треки уже есть, не создаем задачи
    if (newTracksToImport.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Все ${skippedCount} треков уже есть в базе!`, 
        skipped: skippedCount,
        batchId: null 
      });
    }

    const batchId = randomUUID();
    await prisma.importTask.createMany({
      data: newTracksToImport.map((t: any) => ({
        batchId,
        userId: admin.id,
        title: t.title,
        artist: t.artist,
      }))
    });

    return NextResponse.json({ success: true, batchId, skipped: skippedCount });
  } catch (error) {
    console.error('[Import Queue Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}