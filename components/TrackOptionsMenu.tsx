"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrackMenuStore } from "@/store/trackMenuStore";
import { usePlayerStore } from "@/store/playerStore";
import { Share2, Pin, Heart, Radio, Loader2, PinOff } from "lucide-react";

export default function TrackOptionsMenu() {
  const { isTrackMenuOpen, trackForMenu, menuPosition, closeTrackMenu } = useTrackMenuStore();
  const { setActiveTrack } = usePlayerStore();
  const [shareStatus, setShareStatus] = useState("");
  const [isLoadingWave, setIsLoadingWave] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isTrackMenuOpen && trackForMenu) {
      fetch(`/api/pins?trackId=${trackForMenu.id}`)
        .then(res => res.json())
        .then(data => setIsPinned(data.pinned))
        .catch(console.error);
    }
  }, [isTrackMenuOpen, trackForMenu]);

  if (!isTrackMenuOpen || !trackForMenu) return null;

  const handlePin = async () => {
    setIsPinning(true);
    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: trackForMenu.id })
      });
      const data = await res.json();
      setIsPinned(data.pinned);
      router.refresh();
    } catch (error) {
      console.error("Ошибка закрепления", error);
    } finally {
      setIsPinning(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${trackForMenu.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: trackForMenu.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Скопировано!");
        setTimeout(() => setShareStatus(""), 2000);
      }
    } catch (error) {}
  };

  const handleStartWave = async () => {
    setIsLoadingWave(true);
    try {
      const res = await fetch(`/api/recommendations?trackId=${trackForMenu.id}`);
      if (res.ok) {
        const recommendations = await res.json();
        if (recommendations.length > 0) {
          const queue = [trackForMenu, ...recommendations];
          setActiveTrack(trackForMenu, queue, true);
          closeTrackMenu();
        }
      }
    } catch (error) {
      console.error("Ошибка запуска волны", error);
    } finally {
      setIsLoadingWave(false);
    }
  };

  const menuWidth = 260;
  const menuHeight = 240; // Чуть уменьшили высоту, так как убрали кнопку
  let top = menuPosition.top;
  let left = menuPosition.left;

  if (typeof window !== "undefined") {
    if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 16;
    if (top + menuHeight > window.innerHeight) top = menuPosition.top - menuHeight - 40; 
  }

  return (
    <div className="fixed inset-0 z-[999]" onClick={closeTrackMenu}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        style={{ top, left }}
        className="absolute w-[260px] bg-[#232323] rounded-xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-150 border border-white/5"
      >
        <button 
            onClick={handlePin}
            disabled={isPinning}
            className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium disabled:opacity-50"
        >
            {isPinning ? <Loader2 size={18} className="animate-spin" /> : (isPinned ? <PinOff size={18} /> : <Pin size={18} />)} 
            {isPinned ? "Открепить" : "Закрепить"}
        </button>
        
        <button className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium">
            <Heart size={18} /> Нравится
        </button>

        <button 
            onClick={handleStartWave}
            disabled={isLoadingWave}
            className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium disabled:opacity-50"
        >
            {isLoadingWave ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />} 
            Моя волна по треку
        </button>
        
        <button 
            onClick={handleShare}
            className="flex items-center justify-between w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium"
        >
            <div className="flex items-center gap-4">
               <Share2 size={18} /> 
               {shareStatus ? <span className="text-green-500">{shareStatus}</span> : "Поделиться"}
            </div>
            <span className="text-white/40">›</span>
        </button>
      </div>
    </div>
  );
}