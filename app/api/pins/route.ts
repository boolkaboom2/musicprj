import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get('trackId');
    if (!trackId) return NextResponse.json({ error: 'Нет trackId' }, { status: 400 });

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) return NextResponse.json({ pinned: false });

    const existingPin = await prisma.pinnedTrack.findUnique({
      where: { userId_trackId: { userId: payload.userId, trackId } }
    });

    return NextResponse.json({ pinned: !!existingPin });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { trackId } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const userId = payload.userId;

    const existingPin = await prisma.pinnedTrack.findUnique({
      where: { userId_trackId: { userId, trackId } }
    });

    if (existingPin) {
      await prisma.pinnedTrack.delete({ where: { id: existingPin.id } });
      return NextResponse.json({ pinned: false });
    } else {
      await prisma.pinnedTrack.create({ data: { userId, trackId } });
      return NextResponse.json({ pinned: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}