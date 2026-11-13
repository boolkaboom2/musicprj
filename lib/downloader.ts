import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { searchHitmoz } from './hitmoz';
import { createHash } from 'crypto';

function generateHash(title: string, artist: string): string {
  const normalized = `${title.toLowerCase().trim()}${artist.toLowerCase().trim()}`.replace(/[^a-z0-9а-я]/g, '');
  return createHash('md5').update(normalized).digest('hex');
}

export async function downloadAndSaveTrack(query: string) {
  console.log(`[Downloader] Пробуем Hitmoz...`);
  const track = await searchHitmoz(query);
  
  if (!track) {
    throw new Error('Трек не найден в сети (Hitmoz заблокирован)');
  }

  const trackHash = generateHash(track.title, track.artist);

  const existing = await prisma.track.findFirst({
    where: {
      OR: [
        { hash: trackHash },
        { title: { equals: track.title, mode: 'insensitive' }, artist: { equals: track.artist, mode: 'insensitive' } }
      ]
    },
  });
  
  if (existing) {
    if (!existing.hash) await prisma.track.update({ where: { id: existing.id }, data: { hash: trackHash } });
    return { success: true, track: existing, skipped: true };
  }

  console.log(`[Downloader] Скачиваем: ${track.url}`);
  const audioRes = await fetch(track.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!audioRes.ok) throw new Error('Не удалось скачать файл');

  const buffer = await audioRes.arrayBuffer();
  if (buffer.byteLength / 1024 / 1024 > 20) throw new Error(`Файл слишком большой`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  
  const fileName = `${randomUUID()}.mp3`;
  const blob = new Blob([buffer], { type: 'audio/mpeg' });
  const tgFormData = new FormData();
  tgFormData.append('chat_id', chatId!);
  tgFormData.append('audio', blob, fileName);

  const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, { method: 'POST', body: tgFormData });
  const tgData = await tgRes.json();
  if (!tgData.ok) throw new Error('Ошибка загрузки в Telegram');

  const newTrack = await prisma.track.create({
    data: {
      title: track.title,
      artist: track.artist,
      genre: 'Other',
      coverUrl: track.coverUrl,
      duration: 0,
      releaseYear: null,
      audioUrl: tgData.result.audio.file_id,
      hash: trackHash,
    },
  });

  return { success: true, track: newTrack, skipped: false };
}