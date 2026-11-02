"use client";

import { create } from "zustand";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    }, 2500);
  },
  hide: () => set({ message: null }),
}));

export default function Toast() {
  const { message, type, hide } = useToast();

  const colorClasses = 
    type === "success" ? "border-green-500/50 text-green-400" :
    type === "error" ? "border-red-500/50 text-red-400" :
    "border-white/20 text-white";

  return (
    <div className="fixed top-3 left-3 right-3 md:left-auto md:top-6 md:right-6 md:max-w-sm z-[9999] pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-3 px-4 py-3 bg-[#1c1c1c] rounded-xl shadow-2xl border ${colorClasses} pointer-events-auto`}
          >
            <span className="font-medium text-sm flex-1 min-w-0 break-words">{message}</span>
            <button 
              onClick={hide} 
              className="text-white/40 hover:text-white transition-colors shrink-0 p-1"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}