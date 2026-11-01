import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { searchHitmoz } from './hitmoz';

type MetaData = {
  title: string;
  artist: string;
  coverUrl: string | null;
  genre: string | null;
  releaseYear: number | null;
  duration: number;
};

async function enrichMetadata(baseTitle: string, baseArtist: string, fallbackCover: string | null): Promise<MetaData> {
  let result: MetaData = {
    title: baseTitle,
    artist: baseArtist,
    coverUrl: fallbackCover,
    genre: null,
    releaseYear: null,
    duration: 0,
  };

  const searchQuery = `${baseArtist} ${baseTitle}`;

  // 1. iTunes
  try {
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=1`);
    const itunesData = await itunesRes.json();
    if (itunesData.results && itunesData.results.length > 0) {
      const match = itunesData.results[0];
      const matchTitle = (match.trackName || '').toLowerCase();
      const matchArtist = (match.artistName || '').toLowerCase();
      const baseTitleLower = baseTitle.toLowerCase();
      const baseArtistLower = baseArtist.toLowerCase();
      
      if ((matchTitle.includes(baseTitleLower) || baseTitleLower.includes(matchTitle)) && 
          (matchArtist.includes(baseArtistLower) || baseArtistLower.includes(matchArtist))) {
        result.title = match.trackName;
        result.artist = match.artistName;
        result.coverUrl = match.artworkUrl100.replace('100x100', '1000x1000'); // Максимальное качество
        result.genre = match.primaryGenreName;
        result.duration = Math.round(match.trackTimeMillis / 1000);
        if (match.releaseDate) result.releaseYear = parseInt(match.releaseDate.split('-')[0]);
        console.log(`[Metadata] Источник: iTunes`);
        return result;
      }
    }
  } catch (e) {}

  // 2. Deezer
  try {
    const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchQuery)}`);
    const deezerData = await deezerRes.json();
    if (deezerData.data && deezerData.data.length > 0) {
      const match = deezerData.data[0];
      if (match.title.toLowerCase().includes(baseTitle.toLowerCase()) || baseTitle.toLowerCase().includes(match.title.toLowerCase())) {
        result.title = match.title;
        result.artist = match.artist.name;
        result.coverUrl = match.album.cover_xl || match.album.cover_big || fallbackCover;
        result.duration = match.duration;
        console.log(`[Metadata] Источник: Deezer`);
        return result;
      }
    }
  } catch (e) {}

  // 3. Яндекс.Музыка (ОТЛИЧНО ДЛЯ РУССКИХ И НИШЕВЫХ ТРЕКОВ)
  try {
    const yandexRes = await fetch(`https://api.music.yandex.net/search?text=${encodeURIComponent(searchQuery)}&type=all&page=0`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (yandexRes.ok) {
      const yandexData = await yandexRes.json();
      const track = yandexData.result?.tracks?.results?.[0];
      
      if (track) {
        const matchTitle = (track.title || '').toLowerCase();
        const baseTitleLower = baseTitle.toLowerCase();
        
        if (matchTitle.includes(baseTitleLower) || baseTitleLower.includes(matchTitle)) {
          result.title = track.title;
          result.artist = track.artists?.map((a: any) => a.name).join(', ') || baseArtist;
          result.duration = Math.round(track.durationMs / 1000);
          
          if (track.coverUri) {
            // Яндекс отдает путь, заменяем %% на размер
            result.coverUrl = `https://${track.coverUri.replace('%%', '1000x1000')}`;
          }
          
          console.log(`[Metadata] Источник: Яндекс.Музыка`);
          return result;
        }
      }
    }
  } catch (e) {}

  // 4. Fallback (Hitmoz)
  console.log(`[Metadata] Источник: Hitmoz (fallback)`);
  return result;
}

export async function downloadAndSaveTrack(query: string) {
  // 1. Поиск на Hitmoz
  const hitmozTrack = await searchHitmoz(query);
  if (!hitmozTrack) throw new Error('Трек не найден на Hitmoz');

  // 2. Обогащение метаданными
  const meta = await enrichMetadata(hitmozTrack.title, hitmozTrack.artist, hitmozTrack.coverUrl);

  // 3. Проверка дубликата
  const existing = await prisma.track.findFirst({
    where: {
      title: { equals: meta.title, mode: 'insensitive' },
      artist: { equals: meta.artist, mode: 'insensitive' },
    },
  });
  if (existing) return { success: true, track: existing, skipped: true };

  // 4. Скачивание MP3
  const audioRes = await fetch(hitmozTrack.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!audioRes.ok) throw new Error('Не удалось скачать MP3 с hitmoz');

  const buffer = await audioRes.arrayBuffer();
  const sizeMB = buffer.byteLength / 1024 / 1024;
  if (sizeMB > 20) throw new Error(`Файл слишком большой (${sizeMB.toFixed(1)} МБ)`);

  // 5. Загрузка в Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!botToken || !chatId) throw new Error('Telegram не настроен');

  const fileName = `${randomUUID()}.mp3`;
  const blob = new Blob([buffer], { type: 'audio/mpeg' });

  const tgFormData = new FormData();
  tgFormData.append('chat_id', chatId);
  tgFormData.append('audio', blob, fileName);

  const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
    method: 'POST',
    body: tgFormData,
  });
  const tgData = await tgRes.json();
  if (!tgData.ok) throw new Error('Ошибка загрузки в Telegram');

  const fileId = tgData.result.audio.file_id;

  // 6. Сохранение в БД
  const newTrack = await prisma.track.create({
    data: {
      title: meta.title,
      artist: meta.artist,
      genre: meta.genre || 'Other',
      coverUrl: meta.coverUrl,
      duration: meta.duration,
      releaseYear: meta.releaseYear,
      audioUrl: fileId,
    },
  });

  return { success: true, track: newTrack, skipped: false };
}