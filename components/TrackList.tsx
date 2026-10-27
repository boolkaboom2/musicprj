"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { useModalStore } from "@/store/modalStore";
import { useTrackMenuStore } from "@/store/trackMenuStore";
import { Music, MoreHorizontal, Play, Pin } from "lucide-react";
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
  const openAddToPlaylist = useModalStore((state) => state.openAddToPlaylist);
  const { openTrackMenu, isTrackMenuOpen, trackForMenu } = useTrackMenuStore();

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="flex flex-col gap-1 p-8">
      {tracks.map((track, index) => {
        const isLiked = userLikes.includes(track.id);
        const isPinned = userPins.includes(track.id);
        const isMenuOpenForThisTrack = isTrackMenuOpen && trackForMenu?.id === track.id;

        return (
          <div 
            key={track.id} 
            onClick={() => setActiveTrack(track, tracks)} 
            onContextMenu={(e) => { 
              e.preventDefault();
              openTrackMenu(track, e.currentTarget.getBoundingClientRect());
            }}
            className={`flex items-center gap-4 p-2 rounded-md transition cursor-pointer group ${
              isMenuOpenForThisTrack ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]"
            }`}
          >
            <div className={`w-6 flex justify-center items-center text-sm transition-colors ${
              isMenuOpenForThisTrack ? "text-white" : "text-[#777] group-hover:text-white"
            }`}>
               <span className={isMenuOpenForThisTrack ? "hidden" : "group-hover:hidden"}>{index + 1}</span>
               <Play size={14} fill="currentColor" className={isMenuOpenForThisTrack ? "block" : "hidden group-hover:block"} />
            </div>

            <div className="w-12 h-12 bg-[#333] rounded overflow-hidden shrink-0 flex items-center justify-center text-[#555]">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <Music size={20} /> 
              )}
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/track/${track.id}`} 
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => e.stopPropagation()}
                  className="text-white font-medium truncate hover:underline w-fit"
                >
                  {track.title}
                </Link>
                
                {/* КАСТОМНАЯ ИКОНКА ЗАКРЕПЛЕНИЯ */}
                {isPinned && (
                  <div className="flex items-center justify-center bg-white/10 p-1 rounded-full border border-white/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                    <Pin size={12} className="text-white fill-white rotate-45" />
                  </div>
                )}
              </div>
              <span className="text-sm text-[var(--text-subdued)] truncate">{track.artist}</span>
            </div>

            <div className={`transition-opacity flex items-center gap-4 ${
              isMenuOpenForThisTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openTrackMenu(track, e.currentTarget.getBoundingClientRect());
                }}
                className="text-[var(--text-subdued)] hover:text-white transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>
              <LikeButton trackId={track.id} initialIsLiked={isLiked} />
            </div>

            <span className="text-sm text-[var(--text-subdued)] w-12 text-right tabular-nums">
              {formatTime(track.duration)}
            </span>
          </div>
        );
      })}
    </div>
  );
}