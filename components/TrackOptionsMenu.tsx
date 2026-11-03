"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrackMenuStore } from "@/store/trackMenuStore";
import { usePlayerStore } from "@/store/playerStore";
import { useModalStore } from "@/store/modalStore";
import { useToast } from "@/components/Toast";
import { IPin, IRadio, IShare, IHeart } from "./Icons";
import { ListMusic, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackOptionsMenu() {
  const { isTrackMenuOpen, trackForMenu, menuPosition, closeTrackMenu } = useTrackMenuStore();
  const { setActiveTrack, likedTrackIds, toggleLikedTrack } = usePlayerStore();
  const { openAddToPlaylist } = useModalStore();
  const [isLoadingWave, setIsLoadingWave] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isTrackMenuOpen && trackForMenu) {
      fetch(`/api/pins?trackId=${trackForMenu.id}`)
        .then(res => res.json())
        .then(data => setIsPinned(data.pinned))
        .catch(console.error);
    }
  }, [isTrackMenuOpen, trackForMenu]);

  if (!trackForMenu) return null;

  const isLiked = likedTrackIds.includes(trackForMenu.id);

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

  const handleLike = async () => {
    toggleLikedTrack(trackForMenu.id);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: trackForMenu.id }),
      });
      if (!res.ok) {
        toggleLikedTrack(trackForMenu.id);
        if (res.status === 401) showToast("Войдите, чтобы лайкать треки", "error");
      } else {
        router.refresh();
      }
    } catch (error) {
      toggleLikedTrack(trackForMenu.id);
      showToast("Ошибка сети", "error");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${trackForMenu.id}`;
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) showToast("Ссылка скопирована", "success");
      closeTrackMenu();
    } catch (error) {
      showToast("Ошибка при копировании", "error");
    }
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

  const menuItems = (
    <>
      <button onClick={() => { openAddToPlaylist(trackForMenu); closeTrackMenu(); }} className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium">
        <ListMusic size={18} /> Добавить в плейлист
      </button>
      <button onClick={handlePin} disabled={isPinning} className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium disabled:opacity-50">
        {isPinning ? <Loader2 size={18} className="animate-spin" /> : <IPin size={18} />} 
        {isPinned ? "Открепить" : "Закрепить"}
      </button>
      <button onClick={handleLike} className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium">
        <IHeart size={18} filled={isLiked} /> 
        {isLiked ? "Убрать лайк" : "Нравится"}
      </button>
      <button onClick={handleStartWave} disabled={isLoadingWave} className="flex items-center gap-4 w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium disabled:opacity-50">
        {isLoadingWave ? <Loader2 size={18} className="animate-spin" /> : <IRadio size={18} />} 
        Моя волна по треку
      </button>
      <button onClick={handleShare} className="flex items-center justify-between w-full p-3 hover:bg-white/5 rounded-lg transition text-left text-white/80 hover:text-white text-sm font-medium">
        <div className="flex items-center gap-4"><IShare size={18} /> Поделиться</div>
        <span className="text-white/40">›</span>
      </button>
    </>
  );

  return (
    <AnimatePresence>
      {isTrackMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[999]"
          onClick={closeTrackMenu}
        >
          {isMobile ? (
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-end">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()} 
                className="w-full bg-[#232323] rounded-t-2xl p-4 pb-6 shadow-2xl border-t border-white/5"
              >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-white font-bold text-sm truncate">{trackForMenu.title}</span>
                    <span className="text-[var(--text-subdued)] text-xs truncate">{trackForMenu.artist}</span>
                  </div>
                  <button onClick={closeTrackMenu} className="text-white/40 hover:text-white p-1 shrink-0"><X size={20} /></button>
                </div>
                <div className="flex flex-col gap-1">{menuItems}</div>
              </motion.div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                top: Math.min(menuPosition.top, (typeof window !== 'undefined' ? window.innerHeight - 260 : menuPosition.top)), 
                left: Math.min(menuPosition.left, (typeof window !== 'undefined' ? window.innerWidth - 276 : menuPosition.left)) 
              }}
              className="absolute w-[260px] bg-[#232323] rounded-xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5"
            >
              {menuItems}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}