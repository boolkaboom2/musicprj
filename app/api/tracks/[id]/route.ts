import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/isAdmin';

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'ID не найден' }, { status: 400 });

    await prisma.track.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return NextResponse.json({ error: 'ID не найден' }, { status: 400 });

    const body = await request.json();
    const { title, artist, genre, coverUrl, releaseYear, duration } = body;

    const updatedTrack = await prisma.track.update({
      where: { id },
      data: { 
        title, 
        artist, 
        genre, 
        coverUrl, 
        duration: duration !== undefined ? Number(duration) : undefined,
        releaseYear: releaseYear !== undefined ? (releaseYear ? Number(releaseYear) : null) : undefined 
      },
    });

    return NextResponse.json(updatedTrack);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 });
  }
}
