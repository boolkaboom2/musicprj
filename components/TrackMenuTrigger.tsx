"use client";

import { MoreHorizontal } from "lucide-react";
import { useTrackMenuStore } from "@/store/trackMenuStore";

export default function TrackMenuTrigger({ track }: { track: any }) {
  const openTrackMenu = useTrackMenuStore((state) => state.openTrackMenu);

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        // Передаем прямоугольник кнопки
        openTrackMenu(track, e.currentTarget.getBoundingClientRect());
      }}
      className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
    >
      <MoreHorizontal size={20} />
    </button>
  );
}