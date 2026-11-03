import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const { newEmail, newPassword, currentPassword } = body;

    if (!currentPassword) {
      return NextResponse.json({ error: 'Введите текущий пароль для подтверждения' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    // Проверка текущего пароля
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
    }

    // Подготовка обновлений
    const updateData: any = {};
    
    if (newEmail && newEmail !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing) return NextResponse.json({ error: 'Этот email уже занят' }, { status: 400 });
      updateData.email = newEmail;
    }

    if (newPassword && newPassword.length >= 6) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'Нет изменений' });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: updateData
    });

    return NextResponse.json({ success: true, message: 'Данные безопасности обновлены' });
  } catch (error) {
    console.error('[Security Update Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}