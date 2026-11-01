"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IHeart } from "./Icons";

interface LikeButtonProps {
  trackId: string;
  initialIsLiked: boolean;
}

export default function LikeButton({ trackId, initialIsLiked }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

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
          router.push("/login");
        }
      } else {
        router.refresh(); 
      }
    } catch (error) {
      setIsLiked(isLiked);
    }
  };

  return (
    <button 
      onClick={handleLike}
      className={`transition-all duration-300 ${
        isLiked ? "text-white" : "text-[var(--text-subdued)] hover:text-white"
      } ${isAnimating ? "scale-125" : "scale-100"}`}
    >
      <IHeart size={18} filled={isLiked} />
    </button>
  );
}