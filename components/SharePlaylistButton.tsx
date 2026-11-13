"use client";

import { Share2 } from "lucide-react";
import { useToast } from "./Toast";

export default function SharePlaylistButton({ playlistId }: { playlistId: string }) {
  const showToast = useToast((s) => s.show);

  const handleShare = () => {
    const url = `${window.location.origin}/playlist/${playlistId}`;
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showToast("Ссылка скопирована", "success");
      } else {
        showToast("Не удалось скопировать", "error");
      }
    } catch (error) {
      showToast("Ошибка при копировании", "error");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-base)] hover:bg-[var(--bg-card)]"
    >
      <Share2 size={16} /> Поделиться
    </button>
  );
}