import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadAndSaveTrack } from '@/lib/downloader';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

type ImportResult = 
  | { success: true; title: string; skipped: boolean }
  | { success: false; title: string; error: string };

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Войдите, чтобы импортировать плейлисты' }, { status: 401 });
    }

    const { tracks, createPlaylist, playlistTitle } = await req.json();
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ error: 'Нет треков для импорта' }, { status: 400 });
    }

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
  } catch (error: any) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}