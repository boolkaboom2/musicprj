"use client";

import { useState, useRef } from "react";
import { useSoundStore } from "@/store/soundStore";

export default function VolumeSlider() {
  const { volume, setVolume, isMuted } = useSoundStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateVolume(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateVolume(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateVolume = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = clientY - rect.top;
    let percent = 1 - clickY / rect.height;
    percent = Math.max(0, Math.min(1, percent));
    setVolume(Math.round(percent * 100));
  };

  const displayVolume = isMuted ? 0 : volume;

  return (
    // Увеличили высоту до 180px, чтобы шарику было куда расти
    <div className="flex items-center justify-center h-[180px] w-10">
      <div 
        className="relative h-[160px] w-2 bg-white/10 rounded-full cursor-pointer flex flex-col justify-end"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div 
          className="w-full bg-white rounded-full absolute bottom-0 left-0"
          style={{ height: `${displayVolume}%` }}
        />
        <div 
          className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform duration-100 ease-out ${
            isDragging ? "scale-125" : "hover:scale-110"
          }`}
          // Немного скорректировали позиционирование
          style={{ bottom: `calc(${displayVolume}% - 8px)` }} 
        />
      </div>
    </div>
  );
}