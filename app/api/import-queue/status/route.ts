import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return NextResponse.json({ error: 'Нет batchId' }, { status: 400 });
  }

  try {
    const tasks = await prisma.importTask.findMany({
      where: { batchId }
    });

    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    const failed = tasks.filter(t => t.status === 'FAILED').length;
    const pending = tasks.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length;

    return NextResponse.json({ total, done, failed, pending, isFinished: pending === 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}