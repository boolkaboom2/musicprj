"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useRouter } from "next/navigation";

export default function PlayerLikeButton({ trackId }: { trackId: string }) {
  const { likedTrackIds, toggleLikedTrack } = usePlayerStore();
  const isLiked = likedTrackIds.includes(trackId);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Оптимистичный UI
    toggleLikedTrack(trackId);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (!res.ok) {
        toggleLikedTrack(trackId); // Откат
        if (res.status === 401) router.push("/login");
      } else {
        router.refresh(); // Обновляем серверные данные
      }
    } catch (error) {
      toggleLikedTrack(trackId); // Откат
    }
  };

  return (
    <button 
      onClick={handleLike}
      className={`transition-all duration-300 ${
        isLiked ? "text-white" : "text-[var(--text-subdued)] hover:text-white"
      } ${isAnimating ? "scale-125" : "scale-100"}`}
    >
      <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
    </button>
  );
}