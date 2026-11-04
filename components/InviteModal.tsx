"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Key, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

export default function InviteModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      if (res.ok) {
        localStorage.setItem('sadovod_invite_code', code.trim().toUpperCase());
        showToast("Код принят", "success");
        router.push("/register");
      } else {
        const data = await res.json();
        showToast(data.error || "Неверный код", "error");
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/5"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition">
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} className="text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-white text-center mb-2">Вход по коду</h2>
            <p className="text-[var(--text-subdued)] text-sm text-center mb-6">
              Введите персональный инвайт-код, который выдал администратор.
            </p>
            
            <input
              type="text"
              placeholder="Например: A1B2C3D4"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="w-full bg-[#2a2a2a] text-white text-center tracking-widest text-lg font-mono p-4 rounded-xl outline-none focus:ring-1 focus:ring-white/30 mb-4"
            />
            
            <button
              onClick={handleSubmit}
              disabled={isLoading || !code.trim()}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex justify-center items-center disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Продолжить"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}