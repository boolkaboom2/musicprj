"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reorder } from "framer-motion";
import Link from "next/link";
import { usePlayerStore } from "@/store/playerStore";
import { useTrackMenuStore } from "@/store/trackMenuStore";
import { IMusic, IMore, IPlay, IPin } from "@/components/Icons";
import LikeButton from "@/components/LikeButton";
import { useToast } from "@/components/Toast";
import { GripVertical, Trash2 } from "lucide-react";

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
};

export default function PlaylistTrackList({ 
  initialTracks, 
  userLikes, 
  userPins = [],
  playlistId,
  isOwner 
}: { 
  initialTracks: Track[], 
  userLikes: string[], 
  userPins?: string[],
  playlistId: string,
  isOwner: boolean
}) {
  const [tracks, setTracks] = useState(initialTracks);
  const setActiveTrack = usePlayerStore((state) => state.setActiveTrack);
  const { openTrackMenu, isTrackMenuOpen, trackForMenu } = useTrackMenuStore();
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleReorder = async (newOrder: Track[]) => {
    if (!isOwner) return;
    setTracks(newOrder);

    try {
      await fetch(`/api/playlists/${playlistId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds: newOrder.map(t => t.id) })
      });
    } catch (error) {
      showToast("Ошибка сохранения порядка", "error");
    }
  };

  const handleDelete = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!confirm("Удалить этот трек из плейлиста?")) return;

    try {
      const res = await fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTracks(tracks.filter(t => t.id !== trackId));
        showToast("Трек удален из плейлиста", "success");
        router.refresh();
      } else {
        showToast("Ошибка удаления", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    }
  };

  return (
    <div className="flex flex-col gap-1 md:gap-1 p-2 md:p-8">
      <Reorder.Group axis="y" values={tracks} onReorder={handleReorder} className="flex flex-col gap-1">
        {tracks.map((track, index) => {
          const isLiked = userLikes.includes(track.id);
          const isPinned = userPins.includes(track.id);
          const isMenuOpenForThisTrack = isTrackMenuOpen && trackForMenu?.id === track.id;

          return (
            <Reorder.Item
              key={track.id}
              value={track}
              layout // ВАЖНО: Помогает framer-motion правильно считать позиции
              dragListener={isOwner}
              onClick={() => setActiveTrack(track, tracks)} 
              onContextMenu={(e) => { 
                e.preventDefault();
                openTrackMenu(track, e.currentTarget.getBoundingClientRect());
              }}
              // Убрали класс transition, чтобы он не конфликтовал с JS-анимацией
              className={`flex items-center gap-3 md:gap-4 p-2 md:p-2 rounded-md cursor-pointer group relative ${
                isMenuOpenForThisTrack ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]"
              } ${isOwner ? 'cursor-grab active:cursor-grabbing' : ''}`}
              // Добавили красивый эффект при перетаскивании
              whileDrag={{ 
                scale: 1.02, 
                zIndex: 50, 
                backgroundColor: "#2a2a2a",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)" 
              }}
            >
              {/* Drag Handle */}
              {isOwner && (
                <div className="text-white/20 group-hover:text-white transition-colors cursor-grab active:cursor-grabbing p-1">
                  <GripVertical size={20} />
                </div>
              )}

              <div className={`hidden sm:flex w-6 justify-center items-center text-sm transition-colors ${
                isMenuOpenForThisTrack ? "text-white" : "text-[#777] group-hover:text-white"
              }`}>
                 <span className={isMenuOpenForThisTrack ? "hidden" : "group-hover:hidden"}>{index + 1}</span>
                 {isMenuOpenForThisTrack ? <IPlay size={12} /> : <IPlay size={12} className="hidden group-hover:block" />}
              </div>

              <div className="w-14 h-14 md:w-12 md:h-12 bg-[#333] rounded overflow-hidden shrink-0 flex items-center justify-center text-[#555] pointer-events-none">
                {track.coverUrl ? (
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <IMusic size={20} /> 
                )}
              </div>
              
              <div className="flex flex-col flex-1 overflow-hidden min-w-0 pointer-events-none">
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/track/${track.id}`} 
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.stopPropagation()}
                    className="text-white font-medium truncate hover:underline w-fit text-base md:text-base pointer-events-auto"
                  >
                    {track.title}
                  </Link>
                  
                  {isPinned && (
                    <div className="hidden sm:flex items-center justify-center bg-white/10 p-1 rounded-full border border-white/5">
                      <IPin size={12} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                <span className="text-sm md:text-sm text-[var(--text-subdued)] truncate">{track.artist}</span>
              </div>

              {/* Кнопки управления не должны мешать Drag & Drop */}
              <div className={`transition-opacity flex items-center gap-1 md:gap-4 ${
                isMenuOpenForThisTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100 md:opacity-100 md:group-hover:opacity-100"
              }`}>
                {isOwner && (
                  <button 
                    onClick={(e) => handleDelete(e, track.id)}
                    className="text-red-500 hover:text-red-400 transition-colors p-1 md:p-0"
                    title="Удалить из плейлиста"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openTrackMenu(track, e.currentTarget.getBoundingClientRect());
                  }}
                  className="text-[var(--text-subdued)] hover:text-white transition-colors p-1 md:p-0"
                >
                  <IMore size={20} />
                </button>
                <div className="hidden md:block">
                  <LikeButton trackId={track.id} initialIsLiked={isLiked} />
                </div>
              </div>

              <span className="text-sm md:text-sm text-[var(--text-subdued)] w-10 md:w-12 text-right tabular-nums pointer-events-none">
                {formatTime(track.duration)}
              </span>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}