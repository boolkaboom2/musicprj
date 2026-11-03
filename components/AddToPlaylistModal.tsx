"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/modalStore";
import { X, Plus, Loader2, ListMusic } from "lucide-react";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

export default function AddToPlaylistModal() {
  const { isAddToPlaylistOpen, trackToAdd, closeAddToPlaylist } = useModalStore();
  const [playlists, setPlaylists] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const showToast = useToast((s) => s.show);
  const router = useRouter();

  useEffect(() => {
    if (isAddToPlaylistOpen) {
      fetch("/api/playlists")
        .then((res) => res.json())
        .then((data) => setPlaylists(data))
        .catch((err) => console.error(err));
      setNewTitle("");
      setIsCreating(false);
    }
  }, [isAddToPlaylistOpen]);

  const handleAdd = async (playlistId: string) => {
    if (!trackToAdd) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/playlists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, trackId: trackToAdd.id }),
      });
      if (res.ok) {
        showToast("Трек добавлен в плейлист", "success");
        router.refresh(); // Авто-рефреш
        closeAddToPlaylist();
      }
    } catch (error) {
      showToast("Ошибка добавления", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (res.ok) {
        await handleAdd(data.id);
      }
    } catch (error) {
      showToast("Ошибка создания", "error");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isAddToPlaylistOpen && trackToAdd && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4"
          onClick={closeAddToPlaylist}
        >
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-[85vh] sm:h-auto sm:max-h-[80vh] max-w-[480px] bg-[#1a1a1a] rounded-t-[24px] sm:rounded-[20px] p-6 shadow-2xl border border-white/5 flex flex-col"
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">Добавить трек</h2>
                <p className="text-[var(--text-subdued)] text-sm truncate max-w-[300px]">
                  {trackToAdd.artist} — {trackToAdd.title}
                </p>
              </div>
              <button onClick={closeAddToPlaylist} className="text-[var(--text-subdued)] hover:text-white transition bg-[#2a2a2a] p-2 rounded-full hover:bg-[#333]">
                <X size={20} />
              </button>
            </div>

            {isCreating ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-3 animate-in fade-in">
                <input
                  autoFocus
                  type="text"
                  placeholder="Название плейлиста"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#282828] text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-white/20 border border-transparent transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition flex justify-center mt-2 text-sm"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Создать и добавить"}
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="text-sm text-[var(--text-subdued)] hover:text-white mt-2 transition">
                  Отмена
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-4 w-full p-2.5 hover:bg-white/5 rounded-xl transition text-left group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-white/20 transition">
                    <Plus size={22} className="text-white" />
                  </div>
                  <span className="text-white font-bold text-[15px]">Создать новый плейлист</span>
                </button>

                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    disabled={isLoading}
                    onClick={() => handleAdd(pl.id)}
                    className="flex items-center gap-4 w-full p-2.5 hover:bg-white/5 rounded-xl transition text-left disabled:opacity-50 group"
                  >
                    <div className="w-12 h-12 bg-[#282828] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#333] transition border border-white/5">
                      <ListMusic size={20} className="text-[var(--text-subdued)] group-hover:text-white transition" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-[15px] truncate">{pl.title}</span>
                      <span className="text-[var(--text-subdued)] text-xs mt-0.5">Плейлист</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}