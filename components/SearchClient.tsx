"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, DownloadCloud, AlertCircle, ListMusic, Clock } from "lucide-react";
import Link from "next/link";
import TrackList from "./TrackList";
import { usePlayerStore } from "@/store/playerStore";
import { useToast } from "./Toast";

const HISTORY_KEY = 'sadovod_search_history';

export default function SearchClient() {
  const router = useRouter();
  const showToast = useToast((s) => s.show);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  
  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<any[]>([]);
  const [externalTracks, setExternalTracks] = useState<any[]>([]);
  
  const [isSearchingLocal, setIsSearchingLocal] = useState(false);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  
  const [showExternal, setShowExternal] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);

  const userLikes = usePlayerStore((state) => state.likedTrackIds);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setLocalTracks([]);
      setLocalPlaylists([]);
      setExternalTracks([]);
      setShowExternal(false);
      return;
    }

    setShowExternal(false);
    setExternalTracks([]);

    const timer = setTimeout(async () => {
      setIsSearchingLocal(true);
      saveToHistory(query); 
      
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(async (res) => {
          if (!res.ok) return { tracks: [], playlists: [] };
          return res.json();
        })
        .then(data => {
          setLocalTracks(data.tracks || []);
          setLocalPlaylists(data.playlists || []);
        })
        .finally(() => setIsSearchingLocal(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchExternal = async () => {
    setShowExternal(true);
    setIsSearchingExternal(true);
    try {
      const res = await fetch(`/api/search-external?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setExternalTracks(data.results || []);
    } catch {
      showToast("Ошибка поиска", "error");
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const refreshLocalTracks = async (searchQuery: string) => {
    const searchRes = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
    if (searchRes.ok) {
      const sd = await searchRes.json();
      if (sd.tracks) setLocalTracks(sd.tracks);
    }
  };

  const handleDownload = async (track: any) => {
    const cleanTitle = track.title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const mainArtist = track.artist.split(',')[0].trim();
    const queryStr = `${mainArtist} ${cleanTitle}`;
    
    setDownloadingUrl(track.title);

    try {
      const res = await fetch("/api/search-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryStr }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Трек "${data.track.title}" добавлен`, "success");
        await refreshLocalTracks(query);
        setExternalTracks(prev => prev.filter(t => t.title !== track.title));
        router.refresh();
      } else if (res.status === 409) {
        showToast(`Трек уже есть в базе.`, "info");
        await refreshLocalTracks(query);
        setExternalTracks(prev => prev.filter(t => t.title !== track.title));
      } else if (res.status === 422) {
        showToast(data.error, "error");
        setExternalTracks(prev => prev.filter(t => t.title !== track.title));
      } else if (res.status === 404) {
        showToast("Трек не найден в открытых базах.", "error");
        setExternalTracks(prev => prev.filter(t => t.title !== track.title));
      } else {
        showToast(data.error || "Ошибка скачивания", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setDownloadingUrl(null);
    }
  };

  const handleDirectDownload = async () => {
    if (!query.trim()) return;
    setIsDirectDownloading(true);
    try {
      const res = await fetch("/api/search-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast(`Трек "${data.track.title}" добавлен`, "success");
        await refreshLocalTracks(query);
        router.refresh();
      } else if (res.status === 409) {
        showToast(`Трек уже есть в базе.`, "info");
        await refreshLocalTracks(query);
      } else if (res.status === 422) {
        showToast(data.error, "error");
      } else {
        showToast(data.error || "Не найдено в открытых базах", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsDirectDownloading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const hasLocalResults = localTracks.length > 0 || localPlaylists.length > 0;

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-8 mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)]" size={20} />
          <input
            type="text"
            placeholder="Название трека"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="w-full bg-[var(--bg-input)] text-[var(--text-base)] pl-14 pr-4 py-3 rounded-full outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm font-medium"
          />
          {isSearchingLocal && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] animate-spin" size={18} />
          )}

          {isFocused && query.length === 0 && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                <span className="text-xs font-bold text-[var(--text-subdued)] uppercase tracking-wider">История поиска</span>
                <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-400 transition">Очистить</button>
              </div>
              <div className="flex flex-col max-h-60 overflow-y-auto custom-scrollbar">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(h); setIsFocused(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-main)] text-left transition"
                  >
                    <Clock size={16} className="text-[var(--text-subdued)] shrink-0" />
                    <span className="text-sm text-[var(--text-base)] truncate">{h}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(hasLocalResults || showExternal) ? (
          <div className="w-full">
            {localPlaylists.length > 0 && (
              <div className="px-8 pt-4 pb-2">
                <h2 className="text-xl font-bold text-[var(--text-base)] mb-4 flex items-center gap-2">
                  <ListMusic size={20} /> Плейлисты
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {localPlaylists.map((pl) => {
                    const cover = pl.items[0]?.track?.coverUrl;
                    const ownerName = pl.user.name || pl.user.email.split('@')[0];
                    return (
                      <Link key={pl.id} href={`/playlist/${pl.id}`} className="group flex flex-col gap-2 p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] rounded-xl transition-colors border border-[var(--border-color)]">
                        <div className="w-full aspect-square bg-[var(--border-color)] rounded-lg flex items-center justify-center relative overflow-hidden">
                          {cover ? <img src={cover} alt={pl.title} className="w-full h-full object-cover" /> : <ListMusic size={40} className="text-[var(--text-subdued)]" />}
                        </div>
                        <div>
                          <h3 className="text-[var(--text-base)] font-bold text-sm truncate">{pl.title}</h3>
                          <p className="text-[var(--text-subdued)] text-xs mt-0.5 truncate">{ownerName} • {pl._count.items}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {localTracks.length > 0 && (
              <div className="w-full">
                {localPlaylists.length > 0 && (
                  <h2 className="px-8 pt-6 pb-2 text-xl font-bold text-[var(--text-base)]">В библиотеке</h2>
                )}
                <TrackList initialTracks={localTracks} userLikes={userLikes} />
                
                {!showExternal && (
                  <div className="px-8 py-6">
                    <button onClick={handleSearchExternal} className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-base)] font-bold py-3 px-6 rounded-full hover:bg-[var(--bg-main)] transition flex items-center gap-2 text-sm">
                      <Search size={16} /> Нет того, что искали? Поискать в сети
                    </button>
                  </div>
                )}
              </div>
            )}

            {showExternal && (
              <div className="px-4 md:px-8 pt-4 pb-8 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[var(--text-base)] flex items-center gap-2">
                    <DownloadCloud size={20} /> Поиск
                  </h2>
                  <button onClick={() => setShowExternal(false)} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] text-sm transition">
                    Скрыть
                  </button>
                </div>
                
                {isSearchingExternal ? (
                  <div className="flex items-center gap-2 text-[var(--text-subdued)] py-4">
                    <Loader2 className="animate-spin" size={20} /> Ищем по всем базам...
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full max-w-5xl mx-auto">
                    {externalTracks.length > 0 ? (
                      externalTracks.map((track, idx) => {
                        const isDownloading = downloadingUrl === track.title;
                        
                        return (
                          // ПРОСТОЙ FLEX ДЛЯ ТРЕКОВ
                          <div key={idx} className="flex flex-row items-center gap-4 p-3 rounded-lg transition hover:bg-[var(--bg-card)] group w-full border border-transparent hover:border-[var(--border-color)]">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--border-color)] rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                              {track.coverUrl ? (
                                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <ListMusic size={24} className="text-[var(--text-subdued)]" />
                              )}
                            </div>
                            
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[var(--text-base)] font-bold truncate text-base md:text-lg">{track.title}</span>
                              <span className="text-sm text-[var(--text-subdued)] truncate mt-0.5">{track.artist}</span>
                            </div>

                            <span className="text-sm text-[var(--text-subdued)] tabular-nums shrink-0 hidden sm:block">
                              {formatTime(track.duration)}
                            </span>

                            <button
                              onClick={() => handleDownload(track)}
                              disabled={isDownloading}
                              className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold text-sm px-4 py-2.5 rounded-full hover:opacity-80 transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                            >
                              {isDownloading ? (
                                <><Loader2 size={16} className="animate-spin" /> Качаем</>
                              ) : (
                                <><DownloadCloud size={16} /> Скачать</>
                              )}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[var(--text-subdued)] text-sm py-4">В популярных базах (iTunes/Deezer) ничего не найдено.</p>
                    )}

                    <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                      <p className="text-[var(--text-subdued)] text-sm mb-3">
                        Не нашли нужный ремикс или спед-ап? Попробуйте найти напрямую в открытых базах.
                      </p>
                      <button
                        onClick={handleDirectDownload}
                        disabled={isDirectDownloading}
                        className="text-sm font-bold text-[var(--text-base)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-main)] py-3 px-6 rounded-full transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {isDirectDownloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
                        {isDirectDownloading ? "Ищем..." : `Скачать "${query}" напрямую`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : query.length >= 2 && !isSearchingLocal ? (
          <div className="p-8 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3 text-[var(--text-subdued)]">
              <AlertCircle size={18} />
              В твоей библиотеке ничего не найдено.
            </div>
            <button
              onClick={handleSearchExternal}
              disabled={isSearchingExternal}
              className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-2.5 px-6 rounded-full hover:opacity-80 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSearchingExternal ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              {isSearchingExternal ? "Ищем..." : "Поискать в сети"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}