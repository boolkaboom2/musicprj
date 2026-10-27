import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(playlists);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        title,
        userId: payload.userId,
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при создании' }, { status: 500 });
  }
}