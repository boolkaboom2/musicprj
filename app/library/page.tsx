import { Suspense } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TrackList from "@/components/TrackList";
import Link from "next/link";
import { Heart, Music, Play } from "lucide-react";

export default function LibraryPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-8 pb-0">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          Моя медиатека
        </h1>
      </div>
      <Suspense fallback={<div className="p-8 text-[var(--text-subdued)]">Загрузка...</div>}>
        <LibraryData />
      </Suspense>
    </div>
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
        <Link href="/login" className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">
          Войти
        </Link>
      </div>
    );
  }

  // 1. Достаем лайки
  const likes = await prisma.like.findMany({
    where: { userId: payload.userId },
    include: { track: true },
    orderBy: { id: 'desc' }
  });
  const likedTracks = likes.map(like => like.track);
  const userLikes = likedTracks.map(t => t.id);

  // 2. Достаем плейлисты
  const playlists = await prisma.playlist.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 flex flex-col gap-12">
      
      {/* Секция Плейлистов */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Music size={24} /> Мои плейлисты
        </h2>
        {playlists.length === 0 ? (
          <p className="text-[var(--text-subdued)]">У вас пока нет плейлистов. Создайте их через меню трека.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((pl) => (
              <Link 
                key={pl.id} 
                href={`/playlist/${pl.id}`}
                className="group flex flex-col gap-4 p-4 bg-[#121212] hover:bg-[#1a1a1a] rounded-xl transition-all duration-300"
              >
                {/* Заглушка обложки (позже добавим загрузку своих) */}
                <div className="w-full aspect-square bg-[#282828] rounded-lg flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-all">
                  <Music size={48} className="text-white/20" />
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                    <Play size={20} fill="black" className="text-black translate-x-[1px]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg truncate">{pl.title}</h3>
                  <p className="text-[var(--text-subdued)] text-sm mt-1">Плейлист</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Секция Лайков */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
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