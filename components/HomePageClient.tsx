"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, X, DownloadCloud } from "lucide-react";
import TrackList from "./TrackList";
import { useToast } from "./Toast";
import Link from "next/link";

export default function HomePageClient({ 
  initialTracks, 
  userLikes, 
  userPins 
}: { 
  initialTracks: any[], 
  userLikes: string[], 
  userPins: string[] 
}) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.tracks || []);
      } catch {
        showToast("Ошибка поиска", "error");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, showToast]);

  return (
    <div className="w-full">
      {/* БОЛЬШАЯ ПЛАШКА ПОИСКА ПОД КАРУСЕЛЬЮ */}
      <div className="px-8 md:px-12 lg:px-16 py-8">
        <div className="relative w-full max-w-3xl mx-auto group">
          <div className="absolute inset-0 bg-[var(--text-base)] opacity-0 group-focus-within:opacity-5 blur-xl transition-opacity rounded-full pointer-events-none" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] group-focus-within:text-[var(--text-base)] transition-colors" size={24} />
          <input
            type="text"
            placeholder="Поиск треков..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="relative w-full bg-[var(--bg-card)] text-[var(--text-base)] pl-16 pr-14 py-4 md:py-5 rounded-full outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-base md:text-lg font-medium shadow-lg"
          />
          {isSearching ? (
            <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] animate-spin" size={20} />
          ) : query.length > 0 ? (
            <button onClick={() => setQuery("")} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
              <X size={20} />
            </button>
          ) : null}
        </div>
      </div>

      {/* РЕЗУЛЬТАТЫ ПОИСКА ИЛИ ДЕФОЛТНЫЙ СПИСОК */}
      <div className="w-full">
        {searchResults !== null ? (
          searchResults.length > 0 ? (
            <TrackList initialTracks={searchResults} userLikes={userLikes} />
          ) : (
            <div className="px-8 flex flex-col items-start gap-4 py-8 animate-in fade-in">
              <p className="text-[var(--text-subdued)]">В библиотеке ничего не найдено по запросу "{query}".</p>
              <Link href={`/search?q=${encodeURIComponent(query)}`} className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-2.5 px-6 rounded-full hover:opacity-80 transition flex items-center gap-2 text-sm">
                <DownloadCloud size={16} /> Поискать во внешних базах
              </Link>
            </div>
          )
        ) : (
          <TrackList initialTracks={initialTracks} userLikes={userLikes} userPins={userPins} />
        )}
      </div>
    </div>
  );
}