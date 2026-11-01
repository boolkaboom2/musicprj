"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListMusic, Play, Loader2 } from "lucide-react";

type PlaylistItem = {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  items: { track: { coverUrl: string | null } }[];
  _count: { items: number };
};

export default function PublicPlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/playlists/public")
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlaylists(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-8">
        Публичные плейлисты
      </h1>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[var(--text-subdued)]">
          <Loader2 className="animate-spin" size={20} />
          Загрузка...
        </div>
      ) : playlists.length === 0 ? (
        <p className="text-[var(--text-subdued)]">
          Пока никто не сделал плейлисты публичными. Зайди в свой плейлист и переключи на "Публичный".
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map(pl => {
            const cover = pl.items[0]?.track?.coverUrl;
            const ownerName = pl.user.name || pl.user.email.split('@')[0];
            return (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className="group flex flex-col gap-3 p-4 bg-[#121212] hover:bg-[#1a1a1a] rounded-xl transition-colors"
              >
                <div className="w-full aspect-square bg-[#282828] rounded-lg flex items-center justify-center relative overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={pl.title} className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic size={48} className="text-white/20" />
                  )}
                  <div className="absolute bottom-3 right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                    <Play size={20} fill="black" className="text-black translate-x-[1px]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg truncate">{pl.title}</h3>
                  <p className="text-[var(--text-subdued)] text-sm mt-1 truncate">
                    {ownerName} • {pl._count.items} треков
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}