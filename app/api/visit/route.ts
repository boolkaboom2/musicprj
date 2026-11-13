import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { path } = await req.json();
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // ЯВНО УКАЗЫВАЕМ ТИП, ЧТОБЫ TS НЕ РУГАЛСЯ
    let userId: string | null = null; 
    
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) {
        const payload = await verifyToken(token);
        userId = payload?.userId || null;
      }
    } catch (e) {
      // Игнорируем ошибку куки
    }

    // Не ждем завершения записи в БД, чтобы не тормозить клиент
    prisma.visitLog.create({
      data: { path, ipAddress, userAgent, userId }
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}