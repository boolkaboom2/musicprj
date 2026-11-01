"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { Globe, Lock } from "lucide-react";

export default function PlaylistPrivacyToggle({ 
  playlistId, 
  isPublic 
}: { 
  playlistId: string; 
  isPublic: boolean;
}) {
  const [isPub, setIsPub] = useState(isPublic);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const handleToggle = async () => {
    setIsLoading(true);
    const newValue = !isPub;
    setIsPub(newValue);

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newValue }),
      });
      if (res.ok) {
        showToast(newValue ? "Плейлист теперь публичный" : "Плейлист теперь приватный", "success");
        router.refresh();
      } else {
        setIsPub(!newValue);
        showToast("Ошибка", "error");
      }
    } catch {
      setIsPub(!newValue);
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition disabled:opacity-50 ${
        isPub 
          ? 'bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20' 
          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
      }`}
    >
      {isPub ? <Globe size={16} /> : <Lock size={16} />}
      {isPub ? "Публичный" : "Приватный"}
    </button>
  );
}