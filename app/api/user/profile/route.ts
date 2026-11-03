import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, telegram, phone, bannerUrl, avatarUrl, avatarEffect } = body;

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        telegram: telegram !== undefined ? telegram : undefined,
        phone: phone !== undefined ? phone : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        avatarEffect: avatarEffect !== undefined ? avatarEffect : undefined,
      },
      select: { id: true, name: true, bio: true, telegram: true, phone: true, avatarUrl: true, bannerUrl: true, avatarEffect: true }
    });

    revalidatePath('/', 'layout');
    revalidatePath('/user', 'layout');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[Profile Update Error]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}