"use client";

import { create } from "zustand";
import { X } from "lucide-react";

interface ToastState {
  message: string | null;
  type: "success" | "error" | "info";
  show: (message: string, type?: "success" | "error" | "info") => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: "info",
  show: (message, type = "info") => {
    set({ message, type });
    setTimeout(() => set({ message: null }), 4000);
  },
  hide: () => set({ message: null }),
}));

export default function Toast() {
  const { message, type, hide } = useToast();

  if (!message) return null;

  return (
    <div className={`fixed z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all duration-300 ${
      type === "success" ? "bg-[#121212] border-green-500/50 text-green-500" :
      type === "error" ? "bg-[#121212] border-red-500/50 text-red-500" :
      "bg-[#121212] border-white/20 text-white"
    }`} style={{ bottom: '120px', right: '20px' }}> {/* <--- Подняли на 120px */}
      <span className="font-bold text-sm">{message}</span>
      <button onClick={hide} className="ml-4 text-white/50 hover:text-white transition-colors"><X size={16} /></button>
    </div>
  );
}
