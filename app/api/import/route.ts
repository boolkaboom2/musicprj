import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { mkdir, stat, unlink, readFile, writeFile, chmod } from 'fs/promises';
import { randomUUID } from 'crypto';
import os from 'os';

const execAsync = promisify(exec);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(request: Request) {
  try {
    const { textList } = await request.json();
    if (!textList) return NextResponse.json({ error: 'Пустой список' }, { status: 400 });

    const lines = textList.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 10) return NextResponse.json({ error: 'Максимум 10 треков за раз' }, { status: 400 });

    const results: any[] = [];
    const tempDir = join(os.tmpdir(), 'sadovod_import'); 
    await mkdir(tempDir, { recursive: true });

    const ytdlpPath = join(process.cwd(), 'yt-dlp');
    const ffmpegPath = join(process.cwd(), 'ffmpeg');
    
    // Даем права на запуск бинарников (на всякий случай)
    try {
      await chmod(ytdlpPath, 0o755);
      await chmod(ffmpegPath, 0o755);
    } catch (e) {}

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;

    for (const line of lines) {
      try {
        let title = line;
        let artist = "Unknown";
        let genre: string | null = null;
        let coverUrl: string | null = null; 
        let duration = 0;
        let releaseYear: number | null = null;

        let searchQuery = line;
        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          artist = parts[0].trim();
          title = parts[1].trim();
          searchQuery = `${artist} ${title}`; 
        }

        // 1. Метаданные (iTunes -> Deezer)
        try {
          const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=1`);
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
              if (bestMatch.releaseDate) releaseYear = parseInt(bestMatch.releaseDate.split('-')[0]);
            }
          }
        } catch (e) {}

        if (!coverUrl || duration === 0) {
          try {
            const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(searchQuery)}`);
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

        if (!genre) genre = "Other";

        const existingTrack = await prisma.track.findFirst({
          where: { title: { equals: title, mode: 'insensitive' } }
        });
        if (existingTrack) throw new Error('Трек уже есть в базе');

        const fileName = `${randomUUID()}.mp3`;
        const filePath = join(tempDir, fileName);
        
        let isDownloaded = false;
        let lastError = '';

        // 2. Скачивание через локальный yt-dlp
        const sources = [`scsearch1:${searchQuery}`, `ytsearch1:${searchQuery}`];
        for (const source of sources) {
          try {
            console.log(`[yt-dlp] Попытка скачать: ${source}`);
            const command = `"${ytdlpPath}" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --add-header "Accept-Language:en-US,en;q=0.9" --extractor-args "youtube:player_client=android" -x --audio-format mp3 --ffmpeg-location "${ffmpegPath}" --no-playlist --no-warnings --geo-bypass -o "${filePath}" "${source}"`;
            await execAsync(command, { maxBuffer: 1024 * 1024 * 10, timeout: 40000 });
            
            const fileStats = await stat(filePath);
            if (fileStats.size > 100 * 1024) {
              isDownloaded = true;
              console.log(`[yt-dlp] Успешно скачан: ${title}`);
              break;
            } else {
              await unlink(filePath);
            }
          } catch (err: any) {
            console.error(`[yt-dlp ERROR] ${err.message}`);
            lastError = 'Сервер источника отклонил запрос';
            try { await unlink(filePath); } catch (e) {}
          }
        }

        if (!isDownloaded) throw new Error(lastError || 'Не удалось скачать трек');

        // 3. Загрузка в Telegram
        const fileBuffer = await readFile(filePath);
        const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });
        
        const tgFormData = new FormData();
        tgFormData.append('chat_id', chatId!);
        tgFormData.append('audio', blob, fileName);

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
          method: 'POST',
          body: tgFormData,
        });

        const tgData = await tgRes.json();
        if (!tgData.ok) {
          console.error('Ошибка Telegram:', tgData);
          throw new Error('Ошибка загрузки в Telegram');
        }
        
        const fileId = tgData.result.audio.file_id;
        await unlink(filePath);

        // 4. Сохранение в базу
        await prisma.track.create({
          data: { title, artist, genre, coverUrl, duration, releaseYear, audioUrl: fileId },
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
