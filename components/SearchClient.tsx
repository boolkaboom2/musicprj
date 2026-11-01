"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, DownloadCloud, AlertCircle } from "lucide-react";
import TrackList from "./TrackList";
import { usePlayerStore } from "@/store/playerStore";

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const userLikes = usePlayerStore((state) => state.likedTrackIds);

  useEffect(() => {
    if (!query.trim()) { setTracks([]); return; }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setTracks(await res.json());
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
          if (searchRes.ok) setTracks(await searchRes.json());
          setErrorMsg("Трек уже есть в базе");
          return;
        }
        setErrorMsg(data.error || "Ошибка импорта");
        return;
      }

      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(data.track.title)}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        setTracks(searchData);
        if (searchData.length > 0) setQuery(data.track.title);
      }
    } catch (error) {
      setErrorMsg("Ошибка сети при импорте");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-8 mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)]" size={20} />
          <input
            type="text"
            placeholder="Что хотите послушать?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white pl-12 pr-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-white/20 border border-transparent transition-all text-sm font-medium"
          />
          {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 animate-spin" size={18} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.length > 0 ? (
          <TrackList initialTracks={tracks} userLikes={userLikes} />
        ) : query.length > 0 && !isLoading ? (
          <div className="p-8 flex flex-col items-start gap-4">

            {!isImporting && (
              <p className="text-[var(--text-subdued)]">Трека нет в базе. Хотите скачать его из сети?</p>
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
            <p className="text-xs text-[var(--text-subdued)]">
              {isImporting 
                ? "Ищем MP3, обложку и данные о треке..." 
                : "Скрипт сам найдет трек в интернете и добавит в базу."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}