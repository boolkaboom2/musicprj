import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== '1admin1') {
      return NextResponse.json({ error: 'Неверный пароль администратора' }, { status: 403 });
    }

    // Ищем любого админа
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    // Если админа нет — создаем
    if (!admin) {
      const hashedPassword = await bcrypt.hash('1admin1', 10);
      admin = await prisma.user.create({
        data: {
          email: 'admin@sadovod.local',
          password: hashedPassword,
          name: 'Administrator',
          role: 'ADMIN',
        }
      });
    }

    const token = await signToken({ userId: admin.id, role: admin.role });
    
    const response = NextResponse.json({ success: true, role: admin.role });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Admin Bypass Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}