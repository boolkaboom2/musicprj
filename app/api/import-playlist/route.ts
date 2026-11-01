import { NextResponse } from 'next/server';
import { downloadAndSaveTrack } from '@/lib/downloader';

// Описываем типы для результата
type ImportResult = 
  | { success: true; title: string; skipped: boolean }
  | { success: false; title: string; error: string };

export async function POST(req: Request) {
  try {
    const { tracks } = await req.json();
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: 'Нет треков для импорта' }, { status: 400 });
    }

    // Явно указываем тип массива
    const results: ImportResult[] = [];

    // Проходим по каждому треку по очереди
    for (const t of tracks) {
      try {
        const query = `${t.artist} ${t.title}`;
        console.log(`[Playlist Import] Скачиваем: ${query}`);
        
        const res = await downloadAndSaveTrack(query);
        
        results.push({ 
          success: true, 
          title: t.title, 
          skipped: res.skipped 
        });
        
        // Небольшая пауза, чтобы не забанили
        await new Promise(r => setTimeout(r, 1000)); 
      } catch (e: any) {
        console.error(`[Playlist Import Error] ${t.title}:`, e.message);
        results.push({ 
          success: false, 
          title: t.title, 
          error: e.message 
        });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}