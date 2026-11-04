"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Loader2 } from "lucide-react";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DeletePlaylistButton({ playlistId }: { playlistId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Плейлист удален", "success");
        router.push("/library");
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || "Ошибка удаления", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
      >
        <Trash2 size={16} />
        Удалить
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/5 flex flex-col items-center text-center"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Удалить плейлист?</h2>
              <p className="text-[var(--text-subdued)] text-sm mb-6">
                Это действие нельзя отменить. Все треки останутся в базе, но плейлист будет удален.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-md hover:bg-white/20 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-md hover:bg-red-600 transition flex justify-center items-center"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Удалить"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}