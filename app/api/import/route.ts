import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir, stat, unlink, chmod } from 'fs/promises';

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

    // Для Linux (Render) используем бинарники без .exe
    const ytdlpPath = join(process.cwd(), 'yt-dlp');
    const ffmpegPath = join(process.cwd(), 'ffmpeg');

    // Даем права на выполнение (нужно для Linux)
    try {
      await chmod(ytdlpPath, 0o755);
      await chmod(ffmpegPath, 0o755);
    } catch (e) {}

    for (const line of lines) {
      try {
        let title = line;
        let artist = "Unknown";
        let genre: string | null = null;
        let coverUrl: string | null = null; 
        let duration = 0;
        let releaseYear: number | null = null;

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
              
              // Вытаскиваем год из даты релиза (формат: "2024-01-01T...")
              if (bestMatch.releaseDate) {
                releaseYear = parseInt(bestMatch.releaseDate.split('-')[0]);
              }
            }
          }
        } catch (e) {}

        // 3. Deezer API
        if (!coverUrl || !releaseYear) {
          try {
            const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(line)}`);
            const deezerData = await deezerRes.json();
            if (deezerData.data && deezerData.data.length > 0) {
              const dTrack = deezerData.data[0];
              title = dTrack.title;
              artist = dTrack.artist.name;
              coverUrl = dTrack.album.cover_xl;
              duration = dTrack.duration;
              if (dTrack.album.release_date) {
                releaseYear = parseInt(dTrack.album.release_date.split('-')[0]);
              }
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
              genre = topTag.charAt(0).toUpperCase() + topTag.slice(1);
            }
          } catch (e) {}
        }

        if (!genre) genre = "Other";

        // 5. ПРОВЕРКА НА ДУБЛИКАТ
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

        // 6. Скачивание (SoundCloud -> YouTube)
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

        if (!isDownloaded) throw new Error(lastError);

        // 7. Сохранение
        await prisma.track.create({
          data: { title, artist, genre, coverUrl, duration, releaseYear, audioUrl: `/uploads/audio/${fileName}` },
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