"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud, XCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

export default function GlobalImportNotification() {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ total: number, done: number, failed: number, isFinished: boolean } | null>(null);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    const checkBatch = () => setBatchId(localStorage.getItem('sadovod_import_batch'));
    checkBatch();
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
            setTimeout(() => {
              localStorage.removeItem('sadovod_import_batch');
              setBatchId(null);
              setProgress(null);
              router.refresh();
              showToast(`Импорт завершен! Скачано: ${data.done}`, data.failed > 0 ? "error" : "success");
            }, 3000);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [batchId, router, showToast]);

  const handleCancel = async () => {
    if (!batchId) return;
    try {
      await fetch("/api/import-queue/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      localStorage.removeItem('sadovod_import_batch');
      setBatchId(null);
      setProgress(null);
      showToast("Импорт отменен", "info");
    } catch {
      showToast("Ошибка отмены", "error");
    }
  };

  if (!batchId || !progress) return null;

  const percent = Math.round((progress.done / progress.total) * 100);
  const isDone = progress.isFinished;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDone ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : (
              <DownloadCloud size={20} className="text-[var(--text-base)] animate-pulse" />
            )}
            <span className="text-sm font-bold text-[var(--text-base)]">
              {isDone ? "Импорт завершен!" : `Импорт: ${percent}%`}
            </span>
          </div>
          
          {!isDone && (
            <button onClick={handleCancel} className="text-red-500 hover:text-red-400 transition p-1">
              <XCircle size={18} />
            </button>
          )}
        </div>

        {!isDone && (
          <>
            <div className="w-full h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500" 
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--text-subdued)] font-medium">
              <span>Скачано: {progress.done} из {progress.total}</span>
              {progress.failed > 0 && <span className="text-red-500">Ошибок: {progress.failed}</span>}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}