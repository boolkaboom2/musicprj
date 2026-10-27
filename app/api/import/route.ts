import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir, stat, unlink } from 'fs/promises';

const execAsync = promisify(exec);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(request: Request) {
  try {
    const { textList } = await request.json();
    if (!textList) return NextResponse.json({ error: 'Пустой список' }, { status: 400 });

    const lines = textList.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 10) return NextResponse.json({ error: 'Максимум 10 треков за раз' }, { status: 400 });

    const results: any[] = [];
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'audio');
    await mkdir(uploadDir, { recursive: true });

    const ytdlpPath = join(process.cwd(), 'yt-dlp.exe');
    const ffmpegPath = join(process.cwd(), 'ffmpeg.exe');

    for (const line of lines) {
      try {
        let title = line;
        let artist = "Unknown";
        let genre: string | null = null;
        let coverUrl: string | null = null; 
        let duration = 0;

        // 1. ПРЕДВАРИТЕЛЬНЫЙ ПАРСИНГ
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          artist = parts[0].trim();
          title = parts[1].trim();
        }

        // 2. iTunes API
        try {
          const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(line)}&entity=song&limit=1`);
          const text = await itunesRes.text();
          if (text.startsWith('{')) {
            const itunesData = JSON.parse(text);
            if (itunesData.results && itunesData.results.length > 0) {
              const bestMatch = itunesData.results[0];
              title = bestMatch.trackName;
              artist = bestMatch.artistName;
              genre = bestMatch.primaryGenreName;
              coverUrl = bestMatch.artworkUrl100.replace('100x100', '600x600');
              duration = Math.round(bestMatch.trackTimeMillis / 1000);
            }
          }
        } catch (e) {}

        // 3. Deezer API (если нет обложки)
        if (!coverUrl) {
          try {
            const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(line)}`);
            const deezerData = await deezerRes.json();
            if (deezerData.data && deezerData.data.length > 0) {
              const dTrack = deezerData.data[0];
              title = dTrack.title;
              artist = dTrack.artist.name;
              coverUrl = dTrack.album.cover_xl;
              duration = dTrack.duration;
            }
          } catch (e) {}
        }

        // 4. Last.fm API
        if (!genre && process.env.LASTFM_API_KEY) {
          try {
            const lastfmRes = await fetch(
              `http://ws.audioscrobbler.com/2.0/?method=track.gettoptags&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${process.env.LASTFM_API_KEY}&format=json`
            );
            const lastfmData = await lastfmRes.json();
            
            if (lastfmData.toptags && lastfmData.toptags.tag && lastfmData.toptags.tag.length > 0) {
              const topTag = lastfmData.toptags.tag[0].name;
              // Приводим к нормальному виду (например, "russian rap" -> "Russian Rap")
              genre = topTag.charAt(0).toUpperCase() + topTag.slice(1);
            }
          } catch (e) {}
        }

        // 5. УМНЫЙ ПОИСК В ИНТЕРНЕТЕ (DuckDuckGo)
        if (!genre) {
          try {
            const searchQuery = encodeURIComponent(`${artist} ${title} жанр музыки`);
            const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1`);
            const ddgData = await ddgRes.json();
            
            const textToAnalyze = (ddgData.AbstractText + " " + (ddgData.RelatedTopics?.[0]?.Text || "")).toLowerCase();
            
            // Расширенный список жанров (включая английские)
            const genres = [
              "рэп", "хип-хоп", "hip-hop", "hip hop", "rap", "trap", "трэп",
              "рок", "rock", "поп", "pop", "джаз", "jazz", "электроника", "electronic",
              "металл", "metal", "панк", "punk", "инди", "indie", "фолк", "folk",
              "реп", "попса", "шансон", "r&b", "rhythm and blues", "house", "techno",
              "альтернатива", "alternative", "хардкор", "hardcore"
            ];
            
            for (const g of genres) {
              if (textToAnalyze.includes(g)) {
                // Если нашли, делаем первую букву заглавной
                genre = g.charAt(0).toUpperCase() + g.slice(1);
                break;
              }
            }
          } catch (e) {}
        }

        // 6. Если ничего не помогло, ставим Other
        if (!genre) {
          genre = "Other";
        }

        // 7. ПРОВЕРКА НА ДУБЛИКАТ
        const existingTrack = await prisma.track.findFirst({
          where: { title: { equals: title, mode: 'insensitive' } }
        });

        if (existingTrack) {
          throw new Error('Трек с таким названием уже есть в базе');
        }

        const fileName = `${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        const filePath = join(uploadDir, fileName);
        
        let isDownloaded = false;
        let lastError = '';

        // 8. Скачивание (SoundCloud -> YouTube)
        const sources = [`scsearch1:${line}`, `ytsearch1:${line}`];
        
        for (const source of sources) {
          try {
            const command = `"${ytdlpPath}" -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" --no-playlist --no-warnings --geo-bypass -o "${filePath}" "${source}"`;
            
            await execAsync(command, { maxBuffer: 1024 * 1024 * 10, timeout: 30000 });

            const fileStats = await stat(filePath);
            if (fileStats.size > 100 * 1024) {
              isDownloaded = true;
              break;
            } else {
              await unlink(filePath);
              lastError = 'Трек не найден на наших источниках';
            }
          } catch (err: any) {
            lastError = 'Трек не найден на наших источниках';
            try { await unlink(filePath); } catch (e) {}
          }
        }

        if (!isDownloaded) {
          throw new Error(lastError);
        }

        // 9. ПРОВЕРКА НА АДЕКВАТНОСТЬ
        const queryWords = line.toLowerCase().split(/[\s-]+/);
        const foundString = `${title} ${artist}`.toLowerCase();
        const hasMatch = queryWords.some(word => word.length > 2 && foundString.includes(word));
        
        if (!hasMatch && !coverUrl) {
           await unlink(filePath);
           throw new Error('Не удалось найти точное совпадение');
        }

        // 10. Сохранение
        await prisma.track.create({
          data: { title, artist, genre, coverUrl, duration, audioUrl: `/uploads/audio/${fileName}` },
        });
        
        results.push({ success: true, title });
        await sleep(1000);

      } catch (err: any) {
        console.error(`Ошибка при импорте "${line}":`, err.message);
        results.push({ success: false, line, error: err.message });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}