"use client";

import { useState } from "react";
import { X, Link as LinkIcon, Loader2, Check, AlertTriangle } from "lucide-react";
import { useToast } from "./Toast";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  confidence: 'high' | 'low';
}

export default function ImportPlaylistModal({ 
  isOpen, 
  onClose,
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void,
  onSuccess?: () => void 
}) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const showToast = useToast((s) => s.show);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!url.trim()) {
      showToast("Вставьте ссылку на плейлист", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/parse-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (res.ok) {
        setTracks(data.tracks);
        setSelectedIds(data.tracks.map((t: Track) => t.id)); // Выбираем все
      } else {
        showToast(data.error || "Ошибка парсинга", "error");
      }
    } catch (error) {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrack = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      showToast("Выберите хотя бы один трек", "error");
      return;
    }

    setIsImporting(true);
    const selectedTracks = tracks.filter(t => selectedIds.includes(t.id));

    try {
      const res = await fetch("/api/import-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: selectedTracks }),
      });
      
      const data = await res.json();

      if (res.ok) {
        const successCount = data.results.filter((r: any) => r.success && !r.skipped).length;
        const skippedCount = data.results.filter((r: any) => r.skipped).length;
        const failedCount = data.results.filter((r: any) => !r.success).length;

        let msg = `Импортировано: ${successCount}. `;
        if (skippedCount > 0) msg += `Пропущено (уже в базе): ${skippedCount}. `;
        if (failedCount > 0) msg += `Ошибок: ${failedCount}.`;

        showToast(msg, failedCount > 0 ? 'error' : 'success');
        
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.error || "Ошибка импорта", "error");
      }
    } catch (error) {
      showToast("Ошибка сети при импорте", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#121212] rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Импорт плейлиста</h2>
            <p className="text-sm text-[var(--text-subdued)] mt-1">Вставьте ссылку из Spotify, Яндекс.Музыки или VK</p>
          </div>
          <button onClick={onClose} disabled={isImporting} className="text-white/50 hover:text-white transition p-2 bg-white/5 rounded-full disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {tracks.length === 0 ? (
            <div className="flex flex-col gap-4 items-center justify-center py-10">
              <div className="w-full relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subdued)]" size={20} />
                <input
                  type="text"
                  placeholder="https://music.yandex.ru/playlists/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white pl-12 pr-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-white/20 border border-transparent transition-all"
                />
              </div>
              <button
                onClick={handleParse}
                disabled={isLoading}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition flex justify-center items-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                {isLoading ? "Парсим плейлист..." : "Продолжить"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Найдено треков: {tracks.length}</span>
                <button 
                  onClick={() => setSelectedIds(selectedIds.length === tracks.length ? [] : tracks.map(t => t.id))}
                  className="text-sm text-[var(--text-subdued)] hover:text-white transition"
                  disabled={isImporting}
                >
                  {selectedIds.length === tracks.length ? "Снять все" : "Выбрать все"}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {tracks.map(track => (
                  <div 
                    key={track.id} 
                    onClick={() => !isImporting && toggleTrack(track.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition cursor-pointer ${
                      selectedIds.includes(track.id) 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-[#1a1a1a] border-transparent hover:border-white/10'
                    } ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition ${
                      selectedIds.includes(track.id) ? 'bg-white' : 'border border-white/30'
                    }`}>
                      {selectedIds.includes(track.id) && <Check size={16} className="text-black" />}
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                      <span className="text-white font-bold truncate">{track.title}</span>
                      <span className="text-sm text-[var(--text-subdued)] truncate">{track.artist}</span>
                    </div>

                    {track.confidence === 'low' ? (
                      <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold px-2 py-1 bg-yellow-500/10 rounded">
                        <AlertTriangle size={12} /> Низкая точность
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded">
                        <Check size={12} /> Точно
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {tracks.length > 0 && (
          <div className="p-6 border-t border-white/10 flex justify-between items-center">
            <button 
              onClick={() => setTracks([])} 
              disabled={isImporting}
              className="text-sm text-[var(--text-subdued)] hover:text-white transition disabled:opacity-50"
            >
              Назад
            </button>
            <button
              onClick={handleImport}
              disabled={selectedIds.length === 0 || isImporting}
              className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? <Loader2 className="animate-spin" size={18} /> : null}
              {isImporting ? "Скачиваем треки..." : `Импортировать выбранные (${selectedIds.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}