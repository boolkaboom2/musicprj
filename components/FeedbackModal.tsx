"use client";

import { useState } from "react";
import { X, Bug, Lightbulb, HelpCircle, MessageSquare, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

const TYPES = [
  { id: 'BUG', label: 'Баг / ошибка', icon: Bug },
  { id: 'FEATURE', label: 'Пожелание', icon: Lightbulb },
  { id: 'QUESTION', label: 'Вопрос', icon: HelpCircle },
  { id: 'OTHER', label: 'Другое', icon: MessageSquare },
];

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [type, setType] = useState('BUG');
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useToast((s) => s.show);

  const handleSubmit = async () => {
    if (message.trim().length < 10) {
      showToast("Сообщение слишком короткое (мин 10 символов)", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });

      if (res.ok) {
        showToast("Спасибо! Сообщение отправлено", "success");
        setMessage("");
        setType('BUG');
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || "Ошибка отправки", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--bg-card)] w-full h-full sm:h-auto sm:max-w-md sm:rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col"
          >
            <div className="p-4 sm:p-6 border-b border-[var(--border-color)] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-base)]">Обратная связь</h2>
                <p className="text-xs text-[var(--text-subdued)] mt-1">Сообщение уйдёт в админ-панель</p>
              </div>
              <button onClick={onClose} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] p-2 bg-[var(--bg-main)] rounded-full transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs text-[var(--text-subdued)] uppercase tracking-wider font-bold mb-2 block">Тип</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => {
                    const Icon = t.icon;
                    const isActive = type === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition border-2 ${
                          isActive 
                            ? 'bg-[var(--text-base)] text-[var(--bg-main)] border-[var(--text-base)]' 
                            : 'bg-[var(--bg-input)] text-[var(--text-subdued)] border-[var(--border-color)] hover:text-[var(--text-base)]'
                        }`}
                      >
                        <Icon size={16} /> {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-subdued)] uppercase tracking-wider font-bold mb-2 block">Сообщение</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите баг, предложение или вопрос..."
                  rows={6}
                  className="w-full bg-[var(--bg-input)] text-[var(--text-base)] p-3 rounded-lg outline-none border-2 border-[var(--border-color)] focus:border-[var(--text-subdued)] transition resize-none text-sm"
                />
                <p className="text-[10px] text-[var(--text-subdued)] mt-1 text-right">{message.length} / 2000</p>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-[var(--border-color)] flex gap-3 shrink-0">
              <button onClick={onClose} disabled={isLoading} className="flex-1 bg-[var(--bg-main)] text-[var(--text-base)] border border-[var(--border-color)] font-bold py-3 rounded-lg hover:opacity-80 transition disabled:opacity-50">
                Отмена
              </button>
              <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-[var(--text-base)] text-[var(--bg-main)] font-bold py-3 rounded-lg hover:opacity-80 transition flex justify-center items-center disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Отправить"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}