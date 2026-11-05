"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/store/playerStore";
import { IMusic, IPlay } from "./Icons";

export default function CarouselSlider({ tracks }: { tracks: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const setActiveTrack = usePlayerStore((s) => s.setActiveTrack);

  if (!tracks || tracks.length === 0) return null;

  if (tracks.length === 1) {
    const track = tracks[0];
    const cover = track.coverUrl
      ? (track.coverUrl.startsWith('http') || track.coverUrl.startsWith('/') ? track.coverUrl : `/api/stream/${track.coverUrl}`)
      : null;
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div 
          onClick={() => setActiveTrack(track, tracks)}
          className="relative w-[280px] h-[380px] bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
        >
          {cover ? <img src={cover} alt={track.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><IMusic size={48} /></div>}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-xl">
              <IPlay size={32} />
            </div>
          </div>
        </div>
        <div className="mt-8 text-center px-4 w-full">
          <h3 className="text-xl md:text-2xl font-bold text-[var(--text-base)] line-clamp-2">{track.title}</h3>
          <p className="text-[var(--text-subdued)] text-sm uppercase tracking-widest mt-1 truncate">{track.artist}</p>
        </div>
      </div>
    );
  }

  const updateCarousel = (newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((newIndex + tracks.length) % tracks.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePanEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      if (info.offset.x < -swipeThreshold) {
        updateCarousel(currentIndex + 1);
      } else if (info.offset.x > swipeThreshold) {
        updateCarousel(currentIndex - 1);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center overflow-hidden pb-8 pt-4">
      
      <motion.div 
        className="relative w-full h-[420px] flex items-center justify-center cursor-grab active:cursor-grabbing" 
        style={{ perspective: "1200px" }}
        onPanEnd={handlePanEnd}
      >
        {tracks.map((track, i) => {
          let offset = (i - currentIndex + tracks.length) % tracks.length;
          if (offset > Math.floor(tracks.length / 2)) offset -= tracks.length;

          // ФИКС СИММЕТРИИ: Если четное количество, скрываем крайнюю правую карточку
          if (tracks.length % 2 === 0 && offset === tracks.length / 2) return null;
          
          if (offset > 3 || offset < -3) return null; 

          let x = 0, scale = 1, z = 0, opacity = 1, filter = "grayscale(0%)", zIndex = 10;

          // Увеличены отступы для красоты
          if (offset === 0) { x = 0; scale = 1.05; z = 0; opacity = 1; filter = "grayscale(0%)"; zIndex = 20; }
          else if (offset === 1) { x = 260; scale = 0.85; z = -100; opacity = 0.8; filter = "grayscale(100%)"; zIndex = 15; }
          else if (offset === 2) { x = 480; scale = 0.7; z = -200; opacity = 0.5; filter = "grayscale(100%)"; zIndex = 10; }
          else if (offset === 3) { x = 680; scale = 0.55; z = -350; opacity = 0.2; filter = "grayscale(100%)"; zIndex = 5; }
          else if (offset === -1) { x = -260; scale = 0.85; z = -100; opacity = 0.8; filter = "grayscale(100%)"; zIndex = 15; }
          else if (offset === -2) { x = -480; scale = 0.7; z = -200; opacity = 0.5; filter = "grayscale(100%)"; zIndex = 10; }
          else if (offset === -3) { x = -680; scale = 0.55; z = -350; opacity = 0.2; filter = "grayscale(100%)"; zIndex = 5; }

          const cover = track.coverUrl
            ? (track.coverUrl.startsWith('http') || track.coverUrl.startsWith('/') ? track.coverUrl : `/api/stream/${track.coverUrl}`)
            : null;

          return (
            <motion.div 
              key={track.id}
              onClick={(e) => {
                if (Math.abs(e.movementX) > 10) return; 
                if (offset === 0) setActiveTrack(track, tracks);
                else updateCarousel(i);
              }}
              animate={{ x, scale, z, opacity, filter }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute w-[280px] h-[380px] bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
              // ФИКС ЦЕНТРИРОВАНИЯ: жестко ставим по центру контейнера
              style={{ 
                zIndex, 
                left: '50%', 
                top: '50%', 
                marginLeft: '-140px', // половина ширины (280/2)
                marginTop: '-190px'  // половина высоты (380/2)
              }}
            >
              {cover ? (
                <img src={cover} alt={track.title} className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)] pointer-events-none"><IMusic size={48} /></div>
              )}
              {offset === 0 && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-xl">
                    <IPlay size={32} />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        key={tracks[currentIndex]?.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center h-[70px] w-full max-w-lg px-4 pointer-events-none flex flex-col justify-center"
      >
        <h3 className="text-xl md:text-2xl font-bold text-[var(--text-base)] line-clamp-2 leading-tight">
          {tracks[currentIndex]?.title}
        </h3>
        <p className="text-[var(--text-subdued)] text-sm uppercase tracking-widest mt-1 truncate">
          {tracks[currentIndex]?.artist}
        </p>
      </motion.div>

      <div className="flex items-center gap-2 mt-2 z-30">
        {tracks.map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={i}
              onClick={() => updateCarousel(i)}
              className="relative flex items-center justify-center w-4 h-4"
            >
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isActive ? "bg-transparent" : "bg-[var(--text-subdued)] opacity-30 hover:opacity-60"
              }`} />
              
              {isActive && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute inset-0 bg-[var(--text-base)] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}