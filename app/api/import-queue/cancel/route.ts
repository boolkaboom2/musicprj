import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { batchId } = await req.json();
    if (!batchId) return NextResponse.json({ error: 'Нет batchId' }, { status: 400 });

    // Отменяем все задачи в этой пачке, которые еще не скачались
    await prisma.importTask.updateMany({
      where: { 
        batchId, 
        userId: payload.userId,
        status: { in: ['PENDING', 'PROCESSING'] } 
      },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}