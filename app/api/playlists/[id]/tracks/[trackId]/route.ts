import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, trackId: string }> }
) {
  try {
    const { id, trackId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return NextResponse.json({ error: 'Плейлист не найден' }, { status: 404 });
    }
    if (playlist.userId !== payload.userId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    await prisma.playlistItem.deleteMany({
      where: { playlistId: id, trackId }
    });

    revalidatePath('/', 'layout');
    revalidatePath(`/playlist/${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Playlist Delete Track Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}