"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, DownloadCloud, AlertCircle, ListMusic } from "lucide-react";
import Link from "next/link";
import TrackList from "./TrackList";
import { usePlayerStore } from "@/store/playerStore";
import { useToast } from "./Toast";

export default function SearchClient() {
  const router = useRouter();
  const showToast = useToast((s) => s.show);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const userLikes = usePlayerStore((state) => state.likedTrackIds);

  useEffect(() => {
    if (!query.trim()) { setTracks([]); setPlaylists([]); return; }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setTracks(data.tracks || []);
          setPlaylists(data.playlists || []);
        }
      } catch (error) { console.error(error); }
      finally { setIsLoading(false); }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleImport = async () => {
    setIsImporting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/search-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.track) {
          const searchRes = await fetch(`/api/search?q=${encodeURIComponent(data.track.title)}`);
          if (searchRes.ok) {
            const sd = await searchRes.json();
            setTracks(sd.tracks || []);
          }
          setErrorMsg("Трек уже есть в базе");
          return;
        }
        setErrorMsg(data.error || "Трек не найден в сети");
        return;
      }

      showToast(`Трек "${data.track.title}" добавлен`, "success");

      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(data.track.title)}`);
      if (searchRes.ok) {
        const sd = await searchRes.json();
        setTracks(sd.tracks || []);
        if (sd.tracks && sd.tracks.length > 0) setQuery(data.track.title);
      }
      
      router.refresh();
    } catch (error) {
      setErrorMsg("Ошибка сети при импорте");
    } finally {
      setIsImporting(false);
    }
  };

  const hasResults = tracks.length > 0 || playlists.length > 0;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-8 mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)]" size={20} />
          <input
            type="text"
            placeholder="Что хотите послушать? (трек или плейлист)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white pl-14 pr-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-white/20 border border-transparent transition-all text-sm font-medium"
          />
          {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 animate-spin" size={18} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasResults ? (
          <div>
            {playlists.length > 0 && (
              <div className="px-8 pt-4 pb-2">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListMusic size={20} /> Плейлисты
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {playlists.map((pl) => {
                    const cover = pl.items[0]?.track?.coverUrl;
                    const ownerName = pl.user.name || pl.user.email.split('@')[0];
                    return (
                      <Link
                        key={pl.id}
                        href={`/playlist/${pl.id}`}
                        className="group flex flex-col gap-2 p-3 bg-[#121212] hover:bg-[#1a1a1a] rounded-xl transition-colors"
                      >
                        <div className="w-full aspect-square bg-[#282828] rounded-lg flex items-center justify-center relative overflow-hidden">
                          {cover ? (
                            <img src={cover} alt={pl.title} className="w-full h-full object-cover" />
                          ) : (
                            <ListMusic size={40} className="text-white/20" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-sm truncate">{pl.title}</h3>
                          <p className="text-[var(--text-subdued)] text-xs mt-0.5 truncate">
                            {ownerName} • {pl._count.items}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {tracks.length > 0 && (
              <div>
                {playlists.length > 0 && (
                  <h2 className="px-8 pt-6 pb-2 text-xl font-bold text-white">Треки</h2>
                )}
                <TrackList initialTracks={tracks} userLikes={userLikes} />
              </div>
            )}
          </div>
        ) : query.length > 0 && !isLoading ? (
          <div className="p-8 flex flex-col items-start gap-4">
            {!isImporting && (
              <p className="text-[var(--text-subdued)]">Ничего не найдено в базе. Хотите скачать трек из сети?</p>
            )}

            {errorMsg && (
              <div className="flex items-center gap-3 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20 text-sm font-medium animate-in slide-in-from-top-2 fade-in">
                <AlertCircle size={18} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-white text-black font-bold py-2.5 px-6 rounded-full hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="animate-spin" size={18} /> : <DownloadCloud size={18} />}
              {isImporting ? "Скачиваем трек..." : "Не нашлось? Скачаем!"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}