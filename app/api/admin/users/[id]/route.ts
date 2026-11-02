import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
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

    // Получаем текущего юзера (для защиты от самоблокировки)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;
    const currentUserId = payload?.userId;

    const { id } = await params;
    const body = await request.json();
    const { action, months, role } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
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
      await prisma.user.update({
        where: { id },
        data: { subscriptionEnd: null, role: 'USER' }
      });
      return NextResponse.json({ success: true });
    }

    // 4. СМЕНА РОЛИ (выдача / снятие админки)
    if (action === 'change_role') {
      if (!['USER', 'ADMIN', 'PREMIUM'].includes(role)) {
        return NextResponse.json({ error: 'Некорректная роль' }, { status: 400 });
      }
      
      // Защита: нельзя снять админку с себя
      if (id === currentUserId && role !== 'ADMIN') {
        return NextResponse.json({ error: 'Нельзя снять админку с себя' }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role }
      });
      return NextResponse.json({ success: true, role: updated.role });
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