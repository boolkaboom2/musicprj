import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'ID не найден' }, { status: 400 });
    }

    await prisma.track.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления:', error);
    return NextResponse.json({ error: 'Ошибка при удалении' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'ID не найден' }, { status: 400 });
    }

    const body = await request.json();
    const { title, artist, genre, coverUrl } = body;

    const updatedTrack = await prisma.track.update({
      where: { id },
      data: { title, artist, genre, coverUrl },
    });

    return NextResponse.json(updatedTrack);
  } catch (error) {
    console.error('Ошибка обновления:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении' }, { status: 500 });
  }
}