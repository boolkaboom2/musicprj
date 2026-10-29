import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalTracks = await prisma.track.count();
    const totalPlays = await prisma.listenHistory.count();
    const activeSubscriptions = await prisma.user.count({
      where: { subscriptionEnd: { gt: new Date() } }
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const visits = await prisma.visitLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    const visitsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      visitsByDay[dateStr] = 0;
    }

    visits.forEach(v => {
      const dateStr = v.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      if (visitsByDay[dateStr] !== undefined) {
        visitsByDay[dateStr]++;
      }
    });

    const chartData = Object.keys(visitsByDay).map(date => ({
      date,
      visits: visitsByDay[date]
    }));

    return NextResponse.json({ 
      totalUsers, 
      totalTracks, 
      totalPlays, 
      activeSubscriptions, 
      chartData 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
