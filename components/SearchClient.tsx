"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, DownloadCloud, AlertCircle, ListMusic, X, History } from "lucide-react";
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
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  
  const userLikes = usePlayerStore((state) => state.likedTrackIds);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загрузка истории при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("sadovod_search_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveToHistory = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) return;
    
    const newHistory = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("sadovod_search_history", JSON.stringify(newHistory));
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    localStorage.removeItem("sadovod_search_history");
    showToast("История очищена", "info");
  };

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
          // Сохраняем в историю только если что-то нашли
          if (data.tracks.length > 0 || data.playlists.length > 0) {
            saveToHistory(query);
          }
        }
      } catch (error) { console.error(error); }
      finally { setIsLoading(false); }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleImport = async () => {
    // ... (код импорта без изменений)
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
      saveToHistory(query);

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
  const showHistory = isFocused && query.length === 0 && history.length > 0;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-8 mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)]" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Что хотите послушать? Автор - название"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Задержка, чтобы клик по истории сработал
            className="w-full bg-[#1a1a1a] text-white pl-14 pr-4 py-3 rounded-full outline-none focus:ring-2 focus:ring-white/20 border border-transparent transition-all text-sm font-medium"
          />
          {isLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 animate-spin" size={18} />}
        </div>

        {/* Выпадашка с историей */}
        {showHistory && (
          <div className="absolute z-20 w-full max-w-xl mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <span className="text-xs text-white/50 font-bold uppercase tracking-wider flex items-center gap-1"><History size={12}/> История поиска</span>
              <button onClick={clearHistory} className="text-white/40 hover:text-red-400 transition p-1">
                <X size={14} />
              </button>
            </div>
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => setQuery(h)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-sm text-white transition flex items-center gap-3"
              >
                <Search size={14} className="text-white/30" /> {h}
              </button>
            ))}
          </div>
        )}
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