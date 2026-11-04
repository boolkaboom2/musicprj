"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./Toast";

export default function AdminLoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const handleSubmit = async () => {
    if (!password) return;
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/admin-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        showToast("Добро пожаловать, Администратор", "success");
        window.location.href = "/admin";
      } else {
        const data = await res.json();
        showToast(data.error || "Доступ запрещен", "error");
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
            className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-red-500/20"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition">
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={32} className="text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-white text-center mb-2">Для администрации</h2>
            <p className="text-[var(--text-subdued)] text-sm text-center mb-6">
              Введите мастер-пароль для доступа к панели управления.
            </p>
            
            <input
              type="password"
              placeholder="Мастер-пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="w-full bg-[#2a2a2a] text-white text-center tracking-widest text-lg font-mono p-4 rounded-xl outline-none focus:ring-1 focus:ring-red-500/50 mb-4"
            />
            
            <button
              onClick={handleSubmit}
              disabled={isLoading || !password}
              className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition flex justify-center items-center disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Войти как Админ"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}