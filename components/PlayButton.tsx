"use client";

import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";

export default function PlayButton({ track }: { track: any }) {
  const setActiveTrack = usePlayerStore((state) => state.setActiveTrack);

  return (
    <button 
      onClick={() => setActiveTrack(track)}
      // Заменили желтый на белый с черным текстом, как в плеере
      className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition flex items-center gap-2"
    >
      <Play size={18} fill="currentColor" /> Слушать
    </button>
  );
}