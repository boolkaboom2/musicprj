import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { trackIdSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = trackIdSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Некорректный ID трека' }, { status: 400 });
    }

    const { trackId } = result.data;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const userId = payload.userId;

    const existingLike = await prisma.like.findUnique({
      where: { userId_trackId: { userId, trackId } }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({ data: { userId, trackId } });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
