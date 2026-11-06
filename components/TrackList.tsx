"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/store/playerStore";
import { useModalStore } from "@/store/modalStore";
import { useTrackMenuStore } from "@/store/trackMenuStore";
import { IMusic, IMore, IPlay, IPin } from "./Icons";
import LikeButton from "./LikeButton";
import Link from "next/link";

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
};

export default function TrackList({ 
  initialTracks, 
  userLikes, 
  userPins = [] 
}: { 
  initialTracks: Track[], 
  userLikes: string[], 
  userPins?: string[] 
}) {
  const [tracks] = useState(initialTracks);
  const setActiveTrack = usePlayerStore((state) => state.setActiveTrack);
  const { openTrackMenu, isTrackMenuOpen, trackForMenu } = useTrackMenuStore();

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="flex flex-col gap-1 md:gap-1 p-2 md:p-8">
      {tracks.map((track, index) => {
        const isLiked = userLikes.includes(track.id);
        const isPinned = userPins.includes(track.id);
        const isMenuOpenForThisTrack = isTrackMenuOpen && trackForMenu?.id === track.id;

        return (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: Math.min(index * 0.03, 0.5),
              ease: [0.22, 1, 0.36, 1]
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTrack(track, tracks)} 
            onContextMenu={(e) => { 
              e.preventDefault();
              openTrackMenu(track, e.currentTarget.getBoundingClientRect());
            }}
            className={`flex items-center gap-3 md:gap-4 p-2 md:p-2 rounded-md transition cursor-pointer group active:bg-[var(--bg-card)] md:active:bg-transparent ${
              isMenuOpenForThisTrack ? "bg-[var(--bg-card)]" : "hover:bg-[var(--bg-card)]"
            }`}
          >
            <div className={`hidden sm:flex w-6 justify-center items-center text-sm transition-colors ${
              isMenuOpenForThisTrack ? "text-[var(--text-base)]" : "text-[var(--text-subdued)] group-hover:text-[var(--text-base)]"
            }`}>
               <span className={isMenuOpenForThisTrack ? "hidden" : "group-hover:hidden"}>{index + 1}</span>
               {isMenuOpenForThisTrack ? <IPlay size={12} /> : <IPlay size={12} className="hidden group-hover:block" />}
            </div>

            <div className="w-14 h-14 md:w-12 md:h-12 bg-[var(--border-color)] rounded overflow-hidden shrink-0 flex items-center justify-center text-[var(--text-subdued)]">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <IMusic size={20} /> 
              )}
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/track/${track.id}`} 
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => e.stopPropagation()}
                  className="text-[var(--text-base)] font-medium truncate hover:underline w-fit text-base md:text-base"
                >
                  {track.title}
                </Link>
                
                {isPinned && (
                  <div className="hidden sm:flex items-center justify-center bg-[var(--bg-main)] p-1 rounded-full border border-[var(--border-color)]">
                    <IPin size={12} className="text-[var(--text-base)] fill-current" />
                  </div>
                )}
              </div>
              <span className="text-sm md:text-sm text-[var(--text-subdued)] truncate">{track.artist}</span>
            </div>

            <div className={`transition-opacity flex items-center gap-1 md:gap-4 ${
              isMenuOpenForThisTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100 md:opacity-100 md:group-hover:opacity-100"
            }`}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openTrackMenu(track, e.currentTarget.getBoundingClientRect());
                }}
                className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition-colors p-1 md:p-0"
              >
                <IMore size={20} />
              </button>
              <div className="hidden md:block">
                <LikeButton trackId={track.id} initialIsLiked={isLiked} />
              </div>
            </div>

            <span className="text-sm md:text-sm text-[var(--text-subdued)] w-10 md:w-12 text-right tabular-nums">
              {formatTime(track.duration)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}