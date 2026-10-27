"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  trackId: string;
  initialIsLiked: boolean;
}

export default function LikeButton({ trackId, initialIsLiked }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  // Синхронизируем стейт, если пропсы изменились (например, при смене трека в плеере)
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked, trackId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы клик по сердечку не запускал сам трек

    // Оптимистичный UI (меняем цвет до ответа сервера для скорости)
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
        // Если ошибка (например, 401), откатываем назад
        setIsLiked(isLiked);
        if (res.status === 401) {
          router.push("/login");
        }
      } else {
        // Обновляем серверные данные (чтобы медиатека обновилась)
        router.refresh(); 
      }
    } catch (error) {
      setIsLiked(isLiked); // Откат при ошибке сети
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