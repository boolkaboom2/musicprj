"use client";

import { useState, useEffect } from "react";
import { X, Link as LinkIcon, Loader2, Check, DownloadCloud, Code2, XCircle } from "lucide-react";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";
import InfoTooltip from "./InfoTooltip";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  confidence: 'high' | 'low';
}

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string | null) => void;
}

export default function ImportPlaylistModal({ 
  isOpen, 
  onClose,
  onSuccess 
}: ImportPlaylistModalProps) {
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ total: number, done: number, failed: number, isFinished: boolean } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    if (isOpen) {
      const savedBatch = localStorage.getItem('sadovod_import_batch');
      if (savedBatch) {
        setBatchId(savedBatch);
      } else {
        setBatchId(null);
        setProgress(null);
        setTracks([]); 
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!batchId || !isOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/import-queue/status?batchId=${batchId}`);
        const data = await res.json();
        if (res.ok) {
          setProgress(data);
          if (data.isFinished) {
            clearInterval(interval);
            localStorage.removeItem('sadovod_import_batch'); 
            showToast(`Импорт завершен! Скачано: ${data.done}, Не найдено: ${data.failed}`, data.failed > 0 ? "error" : "success");
            if (onSuccess) onSuccess(null);
            setTimeout(() => {
              setBatchId(null);
              setProgress(null);
              setTracks([]);
              onClose();
            }, 2000);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [batchId, isOpen, onSuccess, onClose, showToast]);

  const handleParse = async () => {
    if (!url.trim()) return;
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
        setSelectedIds(data.tracks.map((t: Track) => t.id));
      } else {
        showToast(data.error || "Ошибка парсинга", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedTracks = tracks.filter(t => selectedIds.includes(t.id));
    if (selectedTracks.length === 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/import-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: selectedTracks }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatchId(data.batchId);
        localStorage.setItem('sadovod_import_batch', data.batchId);
        showToast("Треки добавлены в очередь", "success");
      } else {
        showToast(data.error || "Ошибка", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelImport = async () => {
    if (!batchId) return;
    setIsCancelling(true);
    try {
      await fetch("/api/import-queue/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      localStorage.removeItem('sadovod_import_batch');
      setBatchId(null);
      setProgress(null);
      setTracks([]);
      showToast("Импорт отменен", "info");
      onClose();
    } catch {
      showToast("Ошибка отмены", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full h-full sm:h-auto sm:max-w-2xl bg-[var(--bg-card)] sm:rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col sm:max-h-[90vh] transition-colors"
        >
          
          <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-base)]">Импорт плейлиста</h2>
              <div className="flex items-center mt-1">
                <p className="text-xs sm:text-sm text-[var(--text-subdued)]">Скачивание идет в фоне.</p>
                <InfoTooltip text="Почему так долго? Мы качаем треки по одному, чтобы не попасть в бан. Если закрыть вкладку, загрузка продолжится." />
              </div>
            </div>
            <button onClick={onClose} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2 bg-[var(--bg-main)] rounded-full shrink-0 ml-2">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {batchId ? (
              <div className="flex flex-col items-center justify-center py-10 gap-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-[var(--bg-main)] rounded-full flex items-center justify-center">
                  <DownloadCloud size={40} className="text-[var(--text-base)] animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[var(--text-base)] mb-2">Скачиваем треки...</h3>
                  <p className="text-[var(--text-subdued)] text-sm max-w-xs mx-auto">Вы можете закрыть эту вкладку. Загрузка продолжится в фоне.</p>
                </div>
                
                {progress && (
                  <div className="w-full max-w-md bg-[var(--bg-main)] p-5 rounded-xl border border-[var(--border-color)]">
                    <div className="flex justify-between text-sm mb-3 font-bold">
                      <span className="text-[var(--text-base)]">Прогресс</span>
                      <span className="text-green-500">{progress.done} / {progress.total}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-green-500" 
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress.done / progress.total) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    {progress.failed > 0 && (
                      <p className="text-red-500 text-xs mt-3 flex items-center gap-1">
                        <XCircle size={12} /> Не найдено: {progress.failed}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCancelImport}
                  disabled={isCancelling || progress?.isFinished}
                  className="mt-2 text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-6 py-2.5 rounded-full transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  {isCancelling ? "Отменяем..." : "Отменить импорт"}
                </button>
              </div>
            ) : tracks.length === 0 ? (
              
              <div className="flex flex-col gap-6 items-center py-6 sm:py-10">
                <div className="flex bg-[var(--bg-main)] p-1 rounded-full relative w-full max-w-[280px] border border-[var(--border-color)]">
                  <motion.div 
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--text-base)] rounded-full z-0"
                    animate={{ x: inputMode === 'url' ? '0%' : '100%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <button 
                    onClick={() => setInputMode('url')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold z-10 transition-colors ${inputMode === 'url' ? 'text-[var(--bg-main)]' : 'text-[var(--text-subdued)] hover:text-[var(--text-base)]'}`}
                  >
                    <LinkIcon size={16} /> Ссылка
                  </button>
                  <button 
                    onClick={() => setInputMode('html')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold z-10 transition-colors ${inputMode === 'html' ? 'text-[var(--bg-main)]' : 'text-[var(--text-subdued)] hover:text-[var(--text-base)]'}`}
                  >
                    <Code2 size={16} /> HTML-код
                  </button>
                </div>

                <div className="w-full relative">
                  {inputMode === 'url' ? (
                    <input
                      type="text"
                      placeholder="https://music.yandex.ru/playlists/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-4 rounded-xl outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm"
                    />
                  ) : (
                    <textarea
                      placeholder="Вставьте <iframe ... src='...'> код"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      rows={4}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-4 rounded-xl outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition-all text-sm resize-none custom-scrollbar"
                    />
                  )}
                </div>

                <button
                  onClick={handleParse}
                  disabled={isLoading || !url.trim()}
                  className="w-full bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-4 rounded-xl hover:opacity-80 transition flex justify-center items-center gap-2 disabled:opacity-30"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                  {isLoading ? "Парсим..." : "Продолжить"}
                </button>
              </div>
            ) : (
              
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[var(--text-base)] font-bold text-sm sm:text-base">Найдено треков: {tracks.length}</span>
                  <button 
                    onClick={() => setSelectedIds(selectedIds.length === tracks.length ? [] : tracks.map(t => t.id))}
                    className="text-xs sm:text-sm text-[var(--text-subdued)] hover:text-[var(--text-base)] transition"
                  >
                    {selectedIds.length === tracks.length ? "Снять все" : "Выбрать все"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {tracks.map(track => (
                    <div 
                      key={track.id} 
                      onClick={() => setSelectedIds(prev => prev.includes(track.id) ? prev.filter(i => i !== track.id) : [...prev, track.id])}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition cursor-pointer ${
                        selectedIds.includes(track.id) ? 'bg-[var(--bg-main)] border-[var(--border-color)]' : 'bg-[var(--bg-input)] border-transparent hover:border-[var(--border-color)]'
                      }`}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center shrink-0 transition ${
                        selectedIds.includes(track.id) ? 'bg-[var(--text-base)]' : 'border border-[var(--border-color)]'
                      }`}>
                        {selectedIds.includes(track.id) && <Check size={14} className="text-[var(--bg-main)]" />}
                      </div>
                      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <span className="text-[var(--text-base)] font-bold truncate text-sm sm:text-base">{track.title}</span>
                        <span className="text-xs sm:text-sm text-[var(--text-subdued)] truncate">{track.artist}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tracks.length > 0 && !batchId && (
            <div className="p-4 sm:p-6 border-t border-[var(--border-color)] flex justify-between items-center gap-2 shrink-0">
              <button onClick={() => setTracks([])} className="text-xs sm:text-sm text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
                Назад
              </button>
              <button
                onClick={handleImport}
                disabled={selectedIds.length === 0 || isLoading}
                className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-2.5 sm:py-3 px-4 sm:px-8 rounded-full hover:opacity-80 transition disabled:opacity-30 flex items-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
                {isLoading ? "Добавляем..." : `В очередь (${selectedIds.length})`}
              </button>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
