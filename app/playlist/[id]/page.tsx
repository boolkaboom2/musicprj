import { Suspense } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TrackList from "@/components/TrackList";
import { notFound } from "next/navigation";
import { ListMusic } from "lucide-react";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-col h-full w-full">
      <Suspense fallback={<div className="p-8 text-[var(--text-subdued)]">Загрузка плейлиста...</div>}>
        {/* Передаем Promise с params в дочерний компонент */}
        <PlaylistContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}

async function PlaylistContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  // Разворачиваем Promise здесь, внутри Suspense
  const { id } = await paramsPromise;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.userId) {
    notFound();
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      items: {
        include: { track: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!playlist || playlist.userId !== payload.userId) {
    notFound();
  }

  const likes = await prisma.like.findMany({
    where: { userId: payload.userId },
    select: { trackId: true },
  });
  const userLikes = likes.map((like) => like.trackId);
  const tracks = playlist.items.map((item) => item.track);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-end gap-6 p-8 bg-gradient-to-b from-[#2a2a2a] to-[#121212]">
        <div className="w-48 h-48 bg-[#282828] rounded-lg flex items-center justify-center shadow-2xl shrink-0">
          <ListMusic size={64} className="text-white/20" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--text-subdued)]">Плейлист</span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            {playlist.title}
          </h1>
          <p className="text-[var(--text-subdued)] text-sm mt-2">
            {tracks.length} треков
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <p className="p-8 text-[var(--text-subdued)]">В этом плейлисте пока нет треков.</p>
        ) : (
          <TrackList initialTracks={tracks} userLikes={userLikes} />
        )}
      </div>
    </div>
  );
}