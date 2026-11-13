"use client";

import { create } from "zustand";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";

interface ToastState {
  message: string | null;
  type: "success" | "error" | "info";
  toastId: number;
  show: (message: string, type?: "success" | "error" | "info") => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: "info",
  toastId: 0,
  show: (message, type = "info") => {
    const newId = Date.now();
    set({ message, type, toastId: newId });
    
    setTimeout(() => {
      useToast.setState((state) => {
        if (state.toastId === newId) {
          return { message: null };
        }
        return state;
      });
    }, 3500); // Увеличили время до 3.5 секунд
  },
  hide: () => set({ message: null }),
}));

function ToastContent() {
  const { message, type, hide } = useToast();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const colorClasses = 
    type === "success" ? "border-green-500/50 text-green-500" :
    type === "error" ? "border-red-500/50 text-red-500" :
    "border-[var(--border-color)] text-[var(--text-base)]";

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/welcome' || pathname === '/forgot-password' || pathname === '/reset-password';

  let positionClass = "";
  if (isAuthPage) {
    positionClass = "top-[15vh] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm 3xl:max-w-md";
  } else if (isMobile) {
    positionClass = "top-3 left-3 right-3";
  } else {
    positionClass = "bottom-28 right-6 max-w-sm 3xl:max-w-md 4xl:max-w-lg";
  }

  const offsetY = isMobile || isAuthPage ? -20 : 20;
  const exitY = isMobile || isAuthPage ? -20 : 20;

  return (
    <div className={`fixed z-[9999] pointer-events-none ${positionClass}`}>
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: offsetY, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: exitY, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-3 px-4 py-3 3xl:px-6 3xl:py-4 bg-[var(--bg-card)] rounded-xl 3xl:rounded-2xl shadow-2xl border ${colorClasses} pointer-events-auto`}
          >
            <span className="font-medium text-sm 3xl:text-lg 4xl:text-xl flex-1 min-w-0 break-words">{message}</span>
            <button 
              onClick={hide} 
              className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition-colors shrink-0 p-1"
            >
              <X size={16} className="3xl:w-6 3xl:h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Toast() {
  return (
    <Suspense fallback={null}>
      <ToastContent />
    </Suspense>
  );
}