import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const VALID_TYPES = ['BUG', 'FEATURE', 'QUESTION', 'OTHER'];

export async function POST(req: Request) {
  try {
    const { type, message } = await req.json();

    if (!message || message.trim().length < 10) {
      return NextResponse.json({ error: 'Сообщение слишком короткое (мин 10 символов)' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Некорректный тип' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    const feedback = await prisma.feedback.create({
      data: {
        userId: payload?.userId || null,
        type,
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, name: true } } },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}