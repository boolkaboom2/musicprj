"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Trash2, ListMusic } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useUIStore } from "@/store/uiStore";
import { IMusic } from "./Icons";

export default function QueueModal() {
  const { queue, currentIndex, setActiveTrack, removeFromQueue, clearQueue } = usePlayerStore();
  const { isQueueOpen, setQueueOpen } = useUIStore();

  if (!isQueueOpen) return null;

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
        onClick={() => setQueueOpen(false)}
      >
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[var(--bg-card)] w-full h-full sm:h-auto sm:max-w-lg sm:rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col sm:max-h-[80vh] transition-colors"
        >
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[var(--border-color)] shrink-0">
            <div className="flex items-center gap-2 text-[var(--text-base)]">
              <ListMusic size={24} />
              <h2 className="text-xl font-bold">Очередь</h2>
            </div>
            <button onClick={() => setQueueOpen(false)} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] p-2 bg-[var(--bg-main)] rounded-full transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 flex flex-col gap-1">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-subdued)] gap-2 py-10">
                <ListMusic size={48} className="opacity-20" />
                <p>Очередь пуста</p>
              </div>
            ) : (
              queue.map((track, idx) => {
                const isActive = idx === currentIndex;
                const cover = track.coverUrl
                  ? (track.coverUrl.startsWith('http') || track.coverUrl.startsWith('/') ? track.coverUrl : `/api/stream/${track.coverUrl}`)
                  : null;

                return (
                  <div 
                    key={track.id}
                    className={`flex items-center gap-3 p-2 rounded-lg group transition cursor-pointer ${
                      isActive ? 'bg-[var(--bg-main)] border border-[var(--border-color)]' : 'hover:bg-[var(--bg-main)] border border-transparent'
                    }`}
                    onClick={() => {
                      if (!isActive) {
                        setActiveTrack(track, queue);
                      }
                    }}
                  >
                    <div className="w-10 h-10 bg-[var(--border-color)] rounded overflow-hidden shrink-0 flex items-center justify-center relative">
                      {cover ? <img src={cover} alt={track.title} className="w-full h-full object-cover" /> : <IMusic size={16} className="text-[var(--text-subdued)]" />}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Play size={16} className="text-white fill-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-sm font-bold truncate ${isActive ? 'text-[var(--text-base)]' : 'text-[var(--text-subdued)] group-hover:text-[var(--text-base)] transition-colors'}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-[var(--text-subdued)] truncate">{track.artist}</span>
                    </div>

                    <span className="text-xs text-[var(--text-subdued)] tabular-nums shrink-0">
                      {formatTime(track.duration)}
                    </span>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(track.id);
                      }}
                      className="text-[var(--text-subdued)] hover:text-red-500 transition p-2 shrink-0 opacity-0 group-hover:opacity-100"
                      title="Удалить из очереди"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {queue.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-[var(--border-color)] shrink-0">
              <button 
                onClick={() => {
                  clearQueue();
                  setQueueOpen(false);
                }}
                className="w-full bg-red-500/10 text-red-500 font-bold py-3 rounded-lg hover:bg-red-500/20 transition text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Очистить очередь
              </button>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}