import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadAndSaveTrack } from '@/lib/downloader';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

type ImportResult = 
  | { success: true; title: string; skipped: boolean }
  | { success: false; title: string; line?: string; error: string };

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Войдите, чтобы импортировать треки' }, { status: 401 });
    }

    const body = await req.json();
    const { textList, tracks, createPlaylist, playlistTitle, directUrl } = body;

    // СЦЕНАРИЙ 1: Прямая ссылка (из админки)
    if (directUrl) {
      // Здесь должна быть логика handleDirectUrl, если она есть. 
      // Если нет — возвращаем заглушку.
      return NextResponse.json({ error: 'Прямая загрузка временно недоступна' }, { status: 501 });
    }

    // СЦЕНАРИЙ 2: Массовый импорт (Текстовый список)
    if (textList && typeof textList === 'string') {
      const lines = textList.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) {
        return NextResponse.json({ error: 'Список треков пуст' }, { status: 400 });
      }

      const results: ImportResult[] = [];

      for (const line of lines) {
        try {
          console.log(`[Bulk Import] Скачиваем: ${line}`);
          // Передаем строку "Исполнитель - Название" в downloader
          const res = await downloadAndSaveTrack(line);
          
          results.push({ success: true, title: res.track.title, skipped: res.skipped });
          
          // Пауза, чтобы не забанили
          await new Promise(r => setTimeout(r, 1500)); 
        } catch (e: any) {
          console.error(`[Bulk Import Error] ${line}:`, e.message);
          results.push({ success: false, title: line, line, error: e.message });
        }
      }

      return NextResponse.json({ success: true, results });
    }

    // СЦЕНАРИЙ 3: Импорт плейлиста (Массив треков)
    if (tracks && Array.isArray(tracks) && tracks.length > 0) {
      let playlistId: string | null = null;

      if (createPlaylist) {
        const title = playlistTitle?.trim() || `Импорт ${new Date().toLocaleDateString('ru-RU')}`;
        const playlist = await prisma.playlist.create({
          data: { title, userId: payload.userId, isPublic: false },
        });
        playlistId = playlist.id;
      }

      const results: ImportResult[] = [];
      let order = 0;

      for (const t of tracks) {
        try {
          const query = `${t.artist} ${t.title}`;
          const res = await downloadAndSaveTrack(query);

          if (playlistId && res.track) {
            const existingItem = await prisma.playlistItem.findFirst({
              where: { playlistId, trackId: res.track.id },
            });
            if (!existingItem) {
              await prisma.playlistItem.create({
                data: { playlistId, trackId: res.track.id, order: order++ },
              });
            }
          }
          
          results.push({ success: true, title: t.title, skipped: res.skipped });
          await new Promise(r => setTimeout(r, 1000)); 
        } catch (e: any) {
          results.push({ success: false, title: t.title, error: e.message });
        }
      }

      return NextResponse.json({ success: true, results, playlistId });
    }

    return NextResponse.json({ error: 'Некорректный запрос. Нет данных для импорта' }, { status: 400 });

  } catch (error: any) {
    console.error('[Import Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}