import { Suspense } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TrackList from "@/components/TrackList";
import Link from "next/link";
import { Heart, Music, Play, ListMusic } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import Loader from "@/components/Loader";
import CreatePlaylistButton from "@/components/CreatePlaylistButton";

export default function LibraryPage() {
  return (
    <PageTransition>
      <div className="flex flex-col h-full w-full">
        <div className="p-8 pb-0 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text-base)] tracking-tight flex items-center gap-3">
            Моя медиатека
          </h1>
          <CreatePlaylistButton />
        </div>
        <Suspense fallback={<Loader />}>
          <LibraryData />
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function LibraryData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload?.userId) {
    return (
      <div className="p-8 flex flex-col gap-4 items-start">
        <p className="text-[var(--text-subdued)]">Войдите, чтобы увидеть свою медиатеку.</p>
        <Link href="/login" className="bg-[var(--text-base)] text-[var(--bg-main)] px-6 py-2 rounded-full font-bold hover:opacity-80 transition">
          Войти
        </Link>
      </div>
    );
  }

  const likes = await prisma.like.findMany({
    where: { userId: payload.userId },
    include: { track: true },
    orderBy: { id: 'desc' }
  });
  const likedTracks = likes.map(like => like.track);
  const userLikes = likedTracks.map(t => t.id);

  const playlists = await prisma.playlist.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } }
  });

  return (
    <div className="p-4 md:p-8 flex flex-col gap-12">
      
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-base)] mb-6 flex items-center gap-2">
          <Music size={24} /> Мои плейлисты
        </h2>
        {playlists.length === 0 ? (
          <p className="text-[var(--text-subdued)]">У вас пока нет плейлистов. Создайте их через меню трека или кнопку выше.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {playlists.map((pl, index) => {
              const cover = pl.coverUrl
                ? (pl.coverUrl.startsWith('http') || pl.coverUrl.startsWith('/') 
                    ? pl.coverUrl 
                    : `/api/stream/${pl.coverUrl}`)
                : null;
              return (
                <div
                  key={pl.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s`, animationFillMode: 'both' }}
                >
                  <Link 
                    href={`/playlist/${pl.id}`}
                    className="group flex flex-col gap-4 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] rounded-xl transition-all duration-300 border border-[var(--border-color)]"
                  >
                    <div className="w-full aspect-square bg-[var(--border-color)] rounded-lg flex items-center justify-center relative overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={pl.title} className="w-full h-full object-cover" />
                      ) : (
                        <ListMusic size={48} className="text-[var(--text-subdued)]" />
                      )}
                      <div className="absolute bottom-3 right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                        <Play size={20} fill="black" className="text-black translate-x-[1px]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[var(--text-base)] font-bold text-lg truncate">{pl.title}</h3>
                      <p className="text-[var(--text-subdued)] text-sm mt-1">
                        {pl.isPublic ? "Публичный" : "Приватный"} • {pl._count.items} треков
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-base)] mb-4 flex items-center gap-2">
          <Heart size={24} /> Мне нравится
        </h2>
        {likedTracks.length === 0 ? (
          <p className="text-[var(--text-subdued)] p-4">Вы еще не лайкнули ни одного трека.</p>
        ) : (
          <TrackList initialTracks={likedTracks} userLikes={userLikes} />
        )}
      </div>
      
    </div>
  );
}