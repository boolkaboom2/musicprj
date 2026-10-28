import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/isAdmin';

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(tracks)
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при получении треков' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // ПРОВЕРКА: Только админ может добавлять
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json()
    const { title, artist, audioUrl, coverUrl, duration, genre, releaseYear } = body

    if (!title || !artist || !audioUrl) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 })
    }

    const existingTrack = await prisma.track.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } }
    });

    if (existingTrack) {
      return NextResponse.json({ error: 'Трек с таким названием уже существует' }, { status: 409 });
    }

    const track = await prisma.track.create({
      data: {
        title,
        artist,
        audioUrl,
        coverUrl: coverUrl || null,
        duration: Number(duration) || 0,
        genre: genre || null,
        releaseYear: releaseYear ? Number(releaseYear) : null,
      },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания трека:', error)
    return NextResponse.json({ error: 'Ошибка при создании трека' }, { status: 500 })
  }
}
