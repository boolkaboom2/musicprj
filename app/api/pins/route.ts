import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

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

    // Проверяем, закреплен ли уже
    const existingPin = await prisma.pinnedTrack.findUnique({
      where: { userId_trackId: { userId, trackId } }
    });

    if (existingPin) {
      // Если закреплен — открепляем
      await prisma.pinnedTrack.delete({ where: { id: existingPin.id } });
      return NextResponse.json({ pinned: false });
    } else {
      // Если нет — закрепляем
      await prisma.pinnedTrack.create({ data: { userId, trackId } });
      return NextResponse.json({ pinned: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}