import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== payload.userId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { trackIds } = await request.json(); // Массив ID треков в новом порядке

    if (!Array.isArray(trackIds)) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    // Обновляем order для каждого трека
    await prisma.$transaction(
      trackIds.map((trackId: string, index: number) => 
        prisma.playlistItem.updateMany({
          where: { playlistId: id, trackId },
          data: { order: index }
        })
      )
    );

    revalidatePath(`/playlist/${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Playlist Reorder Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}