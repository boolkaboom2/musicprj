"use client";

import Link from "next/link";
import { usePlayerStore } from "@/store/playerStore";
import { IMusic, IPlay } from "./Icons";
import { motion } from "framer-motion";

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
};

export default function RecentlyPlayed({ tracks }: { tracks: Track[] }) {
  const setActiveTrack = usePlayerStore((state) => state.setActiveTrack);

  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="px-4 md:px-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
        Недавно прослушанное
      </h2>
      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x">
        {tracks.map((track) => (
          <motion.div
            key={track.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTrack(track, tracks)}
            className="w-[140px] md:w-[160px] shrink-0 group cursor-pointer snap-start"
          >
            <div className="relative w-full aspect-square bg-[#282828] rounded-lg overflow-hidden mb-3">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#555]">
                  <IMusic size={32} />
                </div>
              )}
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <IPlay size={20} className="text-black ml-1" />
              </div>
            </div>
            <Link 
              href={`/track/${track.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-white font-bold text-sm truncate hover:underline block"
            >
              {track.title}
            </Link>
            <p className="text-[var(--text-subdued)] text-xs mt-1 truncate">{track.artist}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}