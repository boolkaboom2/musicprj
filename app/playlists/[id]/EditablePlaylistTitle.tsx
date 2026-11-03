"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function EditablePlaylistTitle({ 
  playlistId, 
  initialTitle, 
  isOwner 
}: { 
  playlistId: string; 
  initialTitle: string; 
  isOwner: boolean 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const handleSave = async () => {
    if (!title.trim() || title === initialTitle) {
      setIsEditing(false);
      setTitle(initialTitle);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        showToast("Название обновлено", "success");
        setIsEditing(false);
        router.refresh();
      } else {
        showToast("Ошибка обновления", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setIsEditing(false); setTitle(initialTitle); }
          }}
          autoFocus
          className="bg-transparent text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter border-b-2 border-white/30 outline-none w-full"
        />
        <button onClick={handleSave} disabled={isLoading} className="text-green-500 hover:text-green-400 p-2 bg-green-500/10 rounded-md">
          {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
        </button>
        <button onClick={() => { setIsEditing(false); setTitle(initialTitle); }} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-md">
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter break-words">
        {title}
      </h1>
      {isOwner && (
        <button 
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition p-2"
          title="Редактировать название"
        >
          <Edit2 size={24} />
        </button>
      )}
    </div>
  );
}