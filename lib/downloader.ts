import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { searchHitmoz } from './hitmoz';
import { searchZaycev } from './zaycev'; // <--- ИМПОРТ ZAYCEV
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

async function enrichMetadata(baseTitle: string, baseArtist: string, fallbackCover: string | null): Promise<MetaData> {
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

  try {
    const yandexRes = await fetch(`https://api.music.yandex.net/search?text=${encodeURIComponent(searchQuery)}&type=all&page=0`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    if (yandexRes.ok) {
      const yandexData = await yandexRes.json();
      const track = yandexData.result?.tracks?.results?.[0];
      if (track) {
        result.title = track.title || result.title;
        result.artist = track.artists?.map((a: any) => a.name).join(', ') || result.artist;
        result.duration = Math.round(track.durationMs / 1000) || result.duration;
        if (track.coverUri) result.coverUrl = `https://${track.coverUri.replace('%%', '1000x1000')}`;
        if (track.albums?.[0]?.year) result.releaseYear = track.albums[0].year;
      }
    }
  } catch (e) {}

  return result;
}

export async function downloadAndSaveTrack(query: string) {
  let trackUrl: string | null = null;
  let foundTitle = query;
  let foundArtist = 'Unknown';
  let fallbackCover: string | null = null;

  // 1. ПРОБУЕМ HITMOZ
  try {
    console.log(`[Downloader] Пробуем Hitmoz: ${query}`);
    const hitmozTrack = await searchHitmoz(query);
    if (hitmozTrack) {
      trackUrl = hitmozTrack.url;
      foundTitle = hitmozTrack.title;
      foundArtist = hitmozTrack.artist;
      fallbackCover = hitmozTrack.coverUrl;
      console.log(`[Downloader] Hitmoz успех: ${foundArtist} - ${foundTitle}`);
    }
  } catch (e) {
    console.log(`[Downloader] Hitmoz не отвечает, переключаемся на Zaycev...`);
  }

  // 2. ЕСЛИ HITMOZ УПАЛ ИЛИ НЕ НАШЕЛ — ПРОБУЕМ ZAYCEV
  if (!trackUrl) {
    console.log(`[Downloader] Пробуем Zaycev: ${query}`);
    const zaycevTrack = await searchZaycev(query);
    if (zaycevTrack) {
      trackUrl = zaycevTrack.url;
      foundTitle = zaycevTrack.title;
      foundArtist = zaycevTrack.artist;
      console.log(`[Downloader] Zaycev успех: ${foundArtist} - ${foundTitle}`);
    }
  }

  // 3. ЕСЛИ НИЧЕГО НЕ НАШЛИ
  if (!trackUrl) {
    throw new Error('Трек не найден в сети');
  }

  // --- ПРОВЕРКА РЕЛЕВАНТНОСТИ ---
  const queryWords = query.toLowerCase().replace(/[^a-zа-я0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const foundText = `${foundTitle} ${foundArtist}`.toLowerCase().replace(/[^a-zа-я0-9\s]/g, '');
  
  let matchCount = 0;
  for (const word of queryWords) {
    if (foundText.includes(word)) matchCount++;
  }

  if (queryWords.length > 0 && matchCount < queryWords.length * 0.5) {
    throw new Error(`Найден неподходящий трек: "${foundTitle}". Попробуйте изменить запрос.`);
  }
  // -------------------------------------

  const meta = await enrichMetadata(foundTitle, foundArtist, fallbackCover);
  const trackHash = generateHash(meta.title, meta.artist);

  const existing = await prisma.track.findFirst({
    where: {
      OR: [
        { hash: trackHash },
        {
          title: { equals: meta.title, mode: 'insensitive' },
          artist: { equals: meta.artist, mode: 'insensitive' },
        }
      ]
    },
  });
  
  if (existing) {
    if (!existing.hash) {
      await prisma.track.update({ where: { id: existing.id }, data: { hash: trackHash } });
    }
    return { success: true, track: existing, skipped: true };
  }

  // 4. СКАЧИВАНИЕ
  console.log(`[Downloader] Скачиваем файл: ${trackUrl}`);
  const audioRes = await fetch(trackUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!audioRes.ok) throw new Error('Не удалось скачать файл');

  const buffer = await audioRes.arrayBuffer();
  if (buffer.byteLength / 1024 / 1024 > 20) throw new Error(`Файл слишком большой`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID;
  if (!botToken || !chatId) throw new Error('Telegram не настроен');

  const fileName = `${randomUUID()}.mp3`;
  const blob = new Blob([buffer], { type: 'audio/mpeg' });

  const tgFormData = new FormData();
  tgFormData.append('chat_id', chatId);
  tgFormData.append('audio', blob, fileName);

  const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, { method: 'POST', body: tgFormData });
  const tgData = await tgRes.json();
  if (!tgData.ok) throw new Error('Ошибка загрузки в Telegram');

  const newTrack = await prisma.track.create({
    data: {
      title: meta.title,
      artist: meta.artist,
      genre: meta.genre || 'Other',
      coverUrl: meta.coverUrl,
      duration: meta.duration,
      releaseYear: meta.releaseYear,
      audioUrl: tgData.result.audio.file_id,
      hash: trackHash,
    },
  });

  return { success: true, track: newTrack, skipped: false };
}