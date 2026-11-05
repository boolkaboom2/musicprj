"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListMusic, Play } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { PlaylistGridSkeleton } from "@/components/Skeletons";

type PlaylistItem = {
  id: string;
  title: string;
  isPublic: boolean;
  coverUrl: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  _count: { items: number };
};

export default function PlaylistsClient() {
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
    <PageTransition>
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text-base)] tracking-tight mb-6 md:mb-8">
          Публичные плейлисты
        </h1>

        {isLoading ? (
          <PlaylistGridSkeleton count={10} />
        ) : playlists.length === 0 ? (
          <p className="text-[var(--text-subdued)]">
            Пока никто не сделал плейлисты публичными.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
                    className="group flex flex-col gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] rounded-xl transition-colors"
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
                      <p className="text-[var(--text-subdued)] text-sm mt-1 truncate">
                        {ownerName} · {pl._count.items} треков
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}