"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportPlaylistModal({ isOpen, onClose }: ImportPlaylistModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] p-8 text-center"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-subdued)] hover:text-[var(--text-base)] p-2 bg-[var(--bg-main)] rounded-full transition">
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-base)] mb-3">Технические работы</h2>
          <p className="text-[var(--text-subdued)] text-sm mb-6 leading-relaxed">
            Импорт плейлистов временно недоступен из-за блокировок со стороны стриминговых платформ.
            <br /><br />
            Пока вы можете <b>искать треки по одному</b> через обычный поиск. Мы уже работаем над решением!
          </p>

          <button onClick={onClose} className="w-full bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3.5 rounded-xl hover:opacity-80 transition">
            Понятно
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}