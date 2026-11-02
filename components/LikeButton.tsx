"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "./Toast";

interface LikeButtonProps {
  trackId: string;
  initialIsLiked: boolean;
}

export default function LikeButton({ trackId, initialIsLiked }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked, trackId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsLiked(!isLiked);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });

      if (!res.ok) {
        setIsLiked(isLiked);
        if (res.status === 401) {
          showToast("Войдите, чтобы лайкать треки", "error");
        } else {
          showToast("Ошибка при лайке", "error");
        }
      } else {
        router.refresh(); 
      }
    } catch (error) {
      setIsLiked(isLiked);
      showToast("Ошибка сети", "error");
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