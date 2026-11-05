import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import TrackList from "@/components/TrackList";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";
import { ListMusic, Play } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import RecentlyPlayed from "@/components/RecentlyPlayed";

export default function Home() {
  return (
    <PageTransition>
      <div className="flex flex-col h-full w-full">
        <div className="p-8 pb-0 flex justify-between items-end">
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-base)] tracking-tight">
            Рекомендации
          </h1>
        </div>
        
        <Suspense fallback={<Loader />}>
          <RecentlyPlayedData />
        </Suspense>

        <Suspense fallback={<Loader />}>
          <TrackListData />
        </Suspense>

        <Suspense fallback={<Loader />}>
          <PublicPlaylistsSection />
        </Suspense>

        <div className="px-4">
          <Footer />
        </div>
      </div>
    </PageTransition>
  );
}

async function RecentlyPlayedData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) return null;

    const history = await prisma.listenHistory.findMany({
      where: { userId: payload.userId },
      take: 20, 
      orderBy: { playedAt: 'desc' },
      include: { track: true }
    });

    // ЯВНО УКАЗЫВАЕМ ТИП any[]
    const uniqueTracks: any[] = [];
    const seenIds = new Set();
    for (const h of history) {
      if (!seenIds.has(h.track.id)) {
        seenIds.add(h.track.id);
        uniqueTracks.push(h.track);
      }
      if (uniqueTracks.length >= 6) break;
    }

    if (uniqueTracks.length === 0) return null;

    return <RecentlyPlayed tracks={uniqueTracks} />;
  } catch (error) {
    console.error("RecentlyPlayedData error:", error);
    return null;
  }
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

  const sortedTracks = [...tracks].sort((a, b) => {
    const aPinned = userPins.includes(a.id);
    const bPinned = userPins.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return <TrackList initialTracks={sortedTracks} userLikes={userLikes} userPins={userPins} />;
}

async function PublicPlaylistsSection() {
  await cookies();

  const playlists = await prisma.playlist.findMany({
    where: { isPublic: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } }
    }
  });

  if (playlists.length === 0) return null;

  return (
    <div className="p-8 pt-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-[var(--text-base)] flex items-center gap-3">
          <ListMusic size={26} /> Публичные плейлисты
        </h2>
        <Link href="/playlists" className="text-sm text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
          Все →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {playlists.map((pl, index) => {
          const cover = pl.coverUrl
            ? (pl.coverUrl.startsWith('http') || pl.coverUrl.startsWith('/') 
                ? pl.coverUrl 
                : `/api/stream/${pl.coverUrl}`)
            : null;
          const ownerName = pl.user.name || pl.user.email.split('@')[0];
          return (
            <div
              key={pl.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s`, animationFillMode: 'both' }}
            >
              <Link
                href={`/playlist/${pl.id}`}
                className="group flex flex-col gap-3 p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] rounded-xl transition-colors"
              >
                <div className="w-full aspect-square bg-[var(--border-color)] rounded-lg flex items-center justify-center relative overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={pl.title} className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic size={40} className="text-[var(--text-subdued)]" />
                  )}
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                    <Play size={18} fill="black" className="text-black translate-x-[1px]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[var(--text-base)] font-bold text-sm truncate">{pl.title}</h3>
                  <p className="text-[var(--text-subdued)] text-xs mt-0.5 truncate">
                    {ownerName} • {pl._count.items}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
