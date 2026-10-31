import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { mkdir, unlink, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import os from 'os';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function POST(request: Request) {
  try {
    const { textList, directUrl } = await request.json();
    
    // Режим 1: Прямая ссылка
    if (directUrl) {
      return await handleDirectUrl(directUrl);
    }
    
    // Режим 2: Поиск через yt-dlp
    if (!textList) return NextResponse.json({ error: 'Пустой список' }, { status: 400 });
    const lines = textList.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 10) return NextResponse.json({ error: 'Максимум 10 треков за раз' }, { status: 400 });

    return NextResponse.json({ error: 'Используйте прямую ссылку' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// --- ФУНКЦИЯ ДЛЯ ПРЯМОЙ ЗАГРУЗКИ ---
async function handleDirectUrl(url: string) {
  try {
    console.log(`[Direct Import] Скачиваем: ${url}`);
    
    // 1. Скачиваем файл
    const res = await fetch(url);
    if (!res.ok) throw new Error('Не удалось скачать файл по ссылке');
    
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    
    // 2. Пытаемся вытащить название из URL
    let rawName = url.split('/').pop()?.split('?')[0] || 'Unknown Track';
    rawName = decodeURIComponent(rawName).replace('.mp3', '').replace(/_/g, ' ');
    
    let title = rawName;
    let artist = 'Unknown';
    
    if (rawName.includes(' - ')) {
      const parts = rawName.split(' - ');
      artist = parts[0].trim();
      title = parts[1].trim();
    }

    // 3. Ищем метаданные в iTunes (с явными типами)
    let coverUrl: string | null = null;
    let genre: string | null = null;
    let releaseYear: number | null = null; // <--- ИСПРАВЛЕНИЕ
    let duration: number = 0;

    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&entity=song&limit=1`);
      const itunesData = await itunesRes.json();
      
      if (itunesData.results && itunesData.results.length > 0) {
        const match = itunesData.results[0];
        if (match.trackName.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(match.trackName.toLowerCase())) {
          title = match.trackName;
          artist = match.artistName;
          coverUrl = match.artworkUrl100.replace('100x100', '600x600');
          genre = match.primaryGenreName;
          duration = Math.round(match.trackTimeMillis / 1000);
          if (match.releaseDate) {
             releaseYear = parseInt(match.releaseDate.split('-')[0]); // Теперь присваивание числа разрешено
          }
        }
      }
    } catch (e) {
      console.log('Ошибка iTunes:', e);
    }

    // 4. Загрузка в Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;
    
    const fileName = `${randomUUID()}.mp3`;
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

    // 5. Сохраняем в базу
    const track = await prisma.track.create({
      data: {
        title,
        artist,
        genre: genre || 'Other',
        coverUrl,
        duration,
        releaseYear,
        audioUrl: fileId
      }
    });

    return NextResponse.json({ success: true, track });
  } catch (error: any) {
    console.error('[Direct Import Error]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}