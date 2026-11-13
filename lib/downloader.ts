import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { searchHitmoz } from './hitmoz';
import { createHash } from 'crypto';

type MetaData = {
  title: string;
  artist: string;
  coverUrl: string | null;
  genre: string | null;
  releaseYear: number | null;
  duration: number;
};

function generateHash(title: string, artist: string): string {
  const normalized = `${title.toLowerCase().trim()}${artist.toLowerCase().trim()}`.replace(/[^a-z0-9а-я]/g, '');
  return createHash('md5').update(normalized).digest('hex');
}

// ДОБАВЛЕН EXPORT
export async function enrichMetadata(baseTitle: string, baseArtist: string, fallbackCover: string | null): Promise<MetaData> {
  let result: MetaData = {
    title: baseTitle,
    artist: baseArtist,
    coverUrl: fallbackCover,
    genre: null,
    releaseYear: null,
    duration: 0,
  };

  const cleanTitleForSearch = baseTitle.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const searchQuery = `${baseArtist} ${cleanTitleForSearch}`;

  try {
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=3`);
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
        result.coverUrl = match.artworkUrl100.replace('100x100', '1000x1000');
        result.genre = match.primaryGenreName;
        result.duration = Math.round(match.trackTimeMillis / 1000);
        if (match.releaseDate) result.releaseYear = parseInt(match.releaseDate.split('-')[0]);
        return result;
      }
    }
  } catch (e) {}

  try {
    const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchQuery)}`);
    const deezerData = await deezerRes.json();
    if (deezerData.data && deezerData.data.length > 0) {
      const match = deezerData.data[0];
      if (match.title.toLowerCase().includes(cleanTitleForSearch.toLowerCase()) || cleanTitleForSearch.toLowerCase().includes(match.title.toLowerCase())) {
        result.title = match.title;
        result.artist = match.artist.name;
        result.coverUrl = match.album.cover_xl || match.album.cover_big || fallbackCover;
        result.duration = match.duration;
        return result;
      }
    }
  } catch (e) {}

  const lastfmKey = process.env.LASTFM_API_KEY;
  if (lastfmKey) {
    try {
      const lastfmRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getinfo&api_key=${lastfmKey}&artist=${encodeURIComponent(baseArtist)}&track=${encodeURIComponent(cleanTitleForSearch)}&format=json`);
      const lastfmData = await lastfmRes.json();
      
      if (lastfmData.track) {
        result.title = lastfmData.track.name || baseTitle;
        result.artist = lastfmData.track.artist.name || baseArtist;
        if (lastfmData.track.album?.image) {
          result.coverUrl = lastfmData.track.album.image[3]['#text'] || fallbackCover;
        }
        const tags = lastfmData.track.toptags?.tag;
        if (tags && tags.length > 0) {
          result.genre = tags[0].name;
        }
      }
    } catch (e) {}
  }

  return result;
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