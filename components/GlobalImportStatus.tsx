"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

export default function GlobalImportStatus() {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ total: number, done: number, isFinished: boolean, failed: number } | null>(null);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    // Проверяем localStorage при загрузке
    const checkBatch = () => {
      const saved = localStorage.getItem('sadovod_import_batch');
      setBatchId(saved);
    };
    checkBatch();

    // Слушаем изменения localStorage (если юзер открыл модалку в другой вкладке)
    window.addEventListener('storage', checkBatch);
    return () => window.removeEventListener('storage', checkBatch);
  }, []);

  useEffect(() => {
    if (!batchId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/import-queue/status?batchId=${batchId}`);
        const data = await res.json();
        if (res.ok) {
          setProgress(data);
          if (data.isFinished) {
            clearInterval(interval);
            localStorage.removeItem('sadovod_import_batch');
            showToast(`Импорт завершен! Скачано: ${data.done} из ${data.total}`, data.failed > 0 ? "error" : "success");
            setBatchId(null);
            setProgress(null);
            router.refresh(); // Обновляем страницу, чтобы показать новые треки
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [batchId, router, showToast]);

  if (!batchId || !progress) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 right-4 md:bottom-28 md:right-8 z-[90] bg-[#1c1c1c] border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-4"
      >
        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0">
          <DownloadCloud size={20} className="text-white animate-bounce" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Импорт в фоне</p>
          <p className="text-[var(--text-subdued)] text-xs mt-0.5">
            Скачано {progress.done} из {progress.total}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}