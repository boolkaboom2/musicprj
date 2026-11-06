"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { useToast } from "./Toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatePlaylistButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast("Введите название", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        showToast("Плейлист создан", "success");
        setIsOpen(false);
        setTitle("");
        router.refresh();
      } else {
        showToast("Ошибка создания", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold text-sm px-5 py-2.5 rounded-full hover:opacity-80 transition flex items-center gap-2 shrink-0"
      >
        <Plus size={18} /> Создать плейлист
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[var(--bg-card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[var(--border-color)]"
            >
              <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-[var(--text-subdued)] hover:text-[var(--text-base)]">
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-[var(--text-base)] mb-4">Новый плейлист</h2>
              <input
                type="text"
                placeholder="Название плейлиста"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 rounded-lg outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] mb-4"
              />
              
              <div className="flex gap-3">
                <button onClick={() => setIsOpen(false)} className="flex-1 bg-[var(--bg-main)] text-[var(--text-base)] font-bold py-3 rounded-md hover:opacity-80 transition border border-[var(--border-color)]">
                  Отмена
                </button>
                <button onClick={handleCreate} disabled={isLoading} className="flex-1 bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3 rounded-md hover:opacity-80 transition flex justify-center items-center">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Создать"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}