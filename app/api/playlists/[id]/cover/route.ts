import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
    if (!playlist) {
      return NextResponse.json({ error: 'Плейлист не найден' }, { status: 404 });
    }
    if (playlist.userId !== payload.userId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Нужен файл изображения' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Файл слишком большой (макс 10 МБ)' }, { status: 413 });
    }

    // Загружаем в Telegram как photo
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;

    const tgFormData = new FormData();
    tgFormData.append('chat_id', chatId!);

    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type || 'image/jpeg' });
    tgFormData.append('photo', blob, file.name || 'cover.jpg');

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: tgFormData,
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('[Telegram Cover Error]', tgData);
      return NextResponse.json({ error: 'Ошибка загрузки в Telegram' }, { status: 500 });
    }

    const fileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;

    // Сохраняем file_id в Playlist
    const updated = await prisma.playlist.update({
      where: { id },
      data: { coverUrl: fileId },
    });

    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true, coverUrl: updated.coverUrl });
  } catch (error) {
    console.error('[Cover Upload Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Удаление обложки
export async function DELETE(
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
    if (!playlist) {
      return NextResponse.json({ error: 'Плейлист не найден' }, { status: 404 });
    }
    if (playlist.userId !== payload.userId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    await prisma.playlist.update({
      where: { id },
      data: { coverUrl: null },
    });

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cover Delete Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}