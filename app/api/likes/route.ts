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

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const userId = payload.userId;

    // Проверяем, есть ли уже лайк
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_trackId: { userId, trackId } // Составной ключ из схемы Prisma
      }
    });

    if (existingLike) {
      // Если лайк есть — удаляем (дизлайк)
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      return NextResponse.json({ liked: false });
    } else {
      // Если нет — создаем
      await prisma.like.create({
        data: { userId, trackId }
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Ошибка лайка:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}