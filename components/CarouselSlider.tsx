"use client";

import { useState, useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { IMusic, IPlay } from "./Icons";

export default function CarouselSlider({ tracks }: { tracks: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const setActiveTrack = usePlayerStore((s) => s.setActiveTrack);

  if (tracks.length === 0) return null;

  const updateCarousel = (newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((newIndex + tracks.length) % tracks.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className="relative w-full max-w-[1200px] h-[450px] mx-auto flex flex-col items-center justify-center overflow-hidden">
      
      {/* Контейнер карточек */}
      <div className="relative w-full h-[380px] flex items-center justify-center" style={{ perspective: "1000px" }}>
        {tracks.map((track, i) => {
          const offset = (i - currentIndex + tracks.length) % tracks.length;
          let className = "hidden";
          
          if (offset === 0) className = "center";
          else if (offset === 1) className = "right-1";
          else if (offset === 2) className = "right-2";
          else if (offset === tracks.length - 1) className = "left-1";
          else if (offset === tracks.length - 2) className = "left-2";

          const cover = track.coverUrl
            ? (track.coverUrl.startsWith('http') || track.coverUrl.startsWith('/') ? track.coverUrl : `/api/stream/${track.coverUrl}`)
            : null;

          return (
            <div 
              key={track.id}
              onClick={() => {
                if (offset === 0) setActiveTrack(track, tracks);
                else updateCarousel(i);
              }}
              className={`absolute w-[280px] h-[380px] bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] card-${className}`}
            >
              {cover ? (
                <img src={cover} alt={track.title} className={`w-full h-full object-cover transition-all duration-700 ${offset !== 0 ? 'grayscale' : ''}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><IMusic size={48} /></div>
              )}
              {offset === 0 && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center shadow-xl">
                    <IPlay size={32} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Инфо о текущем треке */}
      <div className="mt-8 text-center h-[80px]">
        <h3 className="text-2xl font-bold text-[var(--text-base)] transition-opacity duration-300">
          {tracks[currentIndex]?.title}
        </h3>
        <p className="text-[var(--text-subdued)] text-sm uppercase tracking-widest mt-1">
          {tracks[currentIndex]?.artist}
        </p>
      </div>

      {/* Точки */}
      <div className="flex gap-2 mt-4">
        {tracks.map((_, i) => (
          <button
            key={i}
            onClick={() => updateCarousel(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? "bg-[var(--text-base)] scale-125" : "bg-[var(--text-subdued)] opacity-30 hover:opacity-60"
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        .card-center { z-index: 10; transform: scale(1.1) translateZ(0); }
        .card-left-2 { z-index: 1; transform: translateX(-400px) scale(0.8) translateZ(-300px); opacity: 0.7; pointer-events: auto; }
        .card-left-1 { z-index: 5; transform: translateX(-200px) scale(0.9) translateZ(-100px); opacity: 0.9; pointer-events: auto; }
        .card-right-1 { z-index: 5; transform: translateX(200px) scale(0.9) translateZ(-100px); opacity: 0.9; pointer-events: auto; }
        .card-right-2 { z-index: 1; transform: translateX(400px) scale(0.8) translateZ(-300px); opacity: 0.7; pointer-events: auto; }
        .card-hidden { opacity: 0; pointer-events: none; transform: scale(0.5); }
        
        @media (max-width: 768px) {
          .card-left-2 { transform: translateX(-250px) scale(0.8) translateZ(-300px); }
          .card-left-1 { transform: translateX(-120px) scale(0.9) translateZ(-100px); }
          .card-right-1 { transform: translateX(120px) scale(0.9) translateZ(-100px); }
          .card-right-2 { transform: translateX(250px) scale(0.8) translateZ(-300px); }
        }
      `}</style>
    </div>
  );
}