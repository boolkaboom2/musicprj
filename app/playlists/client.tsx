"use client";

import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { PlaylistGridSkeleton } from "@/components/Skeletons";
import CubeSlider from "@/components/CubeSlider";

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
      <div className="p-4 md:p-8 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text-base)] tracking-tight mb-6 md:mb-8 self-start">
          Публичные плейлисты
        </h1>

        {isLoading ? (
          <PlaylistGridSkeleton count={6} />
        ) : playlists.length === 0 ? (
          <p className="text-[var(--text-subdued)]">
            Пока никто не сделал плейлисты публичными.
          </p>
        ) : (
          <div className="w-full mt-10">
            <CubeSlider playlists={playlists} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}