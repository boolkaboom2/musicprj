import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/isAdmin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, months } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // НЕЛЬЗЯ БАНИТЬ ИЛИ УДАЛЯТЬ САМОГО СЕБЯ
    if (user.role === 'ADMIN') {
      // Можно, но лучше предупредить (админ = сам себе хозяин)
      // Пока оставим возможность, но в UI скроем кнопки для админа
    }

    // 1. БАН / РАЗБАН
    if (action === 'ban') {
      const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
      const updated = await prisma.user.update({
        where: { id },
        data: { status: newStatus }
      });
      return NextResponse.json({ success: true, status: updated.status });
    }

    // 2. ВЫДАТЬ ПОДПИСКУ
    if (action === 'grant_subscription') {
      const m = Number(months) || 1;
      const now = new Date();
      const currentEnd = user.subscriptionEnd && user.subscriptionEnd > now 
        ? user.subscriptionEnd 
        : now;
      
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + m);

      const updated = await prisma.user.update({
        where: { id },
        data: { subscriptionEnd: newEnd, role: 'PREMIUM' }
      });

      // Логируем подписку
      await prisma.subscriptionLog.create({
        data: {
          userId: id,
          plan: `PREMIUM_${m}_MONTH${m > 1 ? 'S' : ''}`,
          startDate: now,
          endDate: newEnd,
        }
      });

      return NextResponse.json({ success: true, subscriptionEnd: updated.subscriptionEnd });
    }

    // 3. ОТОЗВАТЬ ПОДПИСКУ
    if (action === 'revoke_subscription') {
      const updated = await prisma.user.update({
        where: { id },
        data: { subscriptionEnd: null, role: 'USER' }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Защита: не удаляем главного админа
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Нельзя удалить администратора' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}