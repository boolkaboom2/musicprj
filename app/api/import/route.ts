import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { mkdir, unlink, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import os from 'os';

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

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;
    
    // ВСТАВЬ СЮДА СВОЮ ССЫЛКУ ИЗ CLOUDFLARE
    const PROXY_URL = 'https://sadovod-proxy.vladgoncharov27x27x27.workers.dev/';

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

        // 1. Метаданные
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

        if (!genre) genre = "Other";

        const existingTrack = await prisma.track.findFirst({
          where: { title: { equals: title, mode: 'insensitive' } }
        });
        if (existingTrack) throw new Error('Трек уже есть в базе');

        const fileName = `${randomUUID()}.mp3`;
        const filePath = join(tempDir, fileName);
        
        // 2. Скачиваем через Cloudflare Worker
        const proxyRes = await fetch(`${PROXY_URL}?q=${encodeURIComponent(searchQuery)}`);
        
        if (!proxyRes.ok) {
          throw new Error('Прокси не смог скачать трек');
        }

        const buffer = await proxyRes.arrayBuffer();
        await writeFile(filePath, Buffer.from(buffer));

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
        if (!tgData.ok) throw new Error('Ошибка загрузки в Telegram');
        
        const fileId = tgData.result.audio.file_id;
        await unlink(filePath);

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