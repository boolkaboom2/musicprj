import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import TrackList from "@/components/TrackList";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export default function Home() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-8 pb-0">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text-base)] tracking-tight">
          Рекомендации
        </h1>
      </div>
      
      <Suspense fallback={<div className="p-8 text-[var(--text-subdued)]">Загрузка треков...</div>}>
        <TrackListData />
      </Suspense>
    </div>
  );
}

async function TrackListData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  const tracks = await prisma.track.findMany({
    orderBy: { createdAt: "desc" },
  });

  let userLikes: string[] = [];
  let userPins: string[] = [];

  if (payload?.userId) {
    const likes = await prisma.like.findMany({
      where: { userId: payload.userId },
      select: { trackId: true }
    });
    userLikes = likes.map(l => l.trackId);

    const pins = await prisma.pinnedTrack.findMany({
      where: { userId: payload.userId },
      select: { trackId: true }
    });
    userPins = pins.map(p => p.trackId);
  }

  // Сортируем: закрепленные треки идут первыми, остальные — по дате
  const sortedTracks = [...tracks].sort((a, b) => {
    const aPinned = userPins.includes(a.id);
    const bPinned = userPins.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return <TrackList initialTracks={sortedTracks} userLikes={userLikes} userPins={userPins} />;
}