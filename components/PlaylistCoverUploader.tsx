"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { Camera, ListMusic, Loader2, Trash2, X } from "lucide-react";

export default function PlaylistCoverUploader({ 
  playlistId, 
  coverUrl 
}: { 
  playlistId: string; 
  coverUrl: string | null;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  const displaySrc = coverUrl
    ? (coverUrl.startsWith('http') || coverUrl.startsWith('/') ? coverUrl : `/api/stream/${coverUrl}`)
    : null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/playlists/${playlistId}/cover`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Обложка обновлена", "success");
        router.refresh();
      } else {
        showToast(data.error || "Ошибка загрузки", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setShowDeleteConfirm(false);
    setIsUploading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/cover`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Обложка удалена", "success");
        router.refresh();
      } else {
        showToast("Ошибка удаления", "error");
      }
    } catch {
      showToast("Ошибка сети", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div 
        className="w-48 h-48 md:w-56 md:h-56 bg-[#282828] rounded-lg shadow-2xl shrink-0 overflow-hidden flex items-center justify-center relative group cursor-pointer"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />

        {displaySrc ? (
          <img src={displaySrc} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <ListMusic size={64} className="text-white/20" />
        )}

        {/* Overlay: появляется только при наведении */}
        <div 
          className={`absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
            isHover && !isUploading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Camera size={32} className="text-white" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">
            {displaySrc ? "Изменить" : "Загрузить"}
          </span>
          {displaySrc && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="mt-2 flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-bold transition"
            >
              <Trash2 size={12} /> Удалить
            </button>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Кастомная модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition p-1 rounded-full hover:bg-white/5"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold text-white mb-2">Удалить обложку?</h2>
            <p className="text-[var(--text-subdued)] text-sm mb-6">
              Плейлист вернется к стандартной обложке с нотами.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-white/10 text-white font-bold py-3 rounded-md hover:bg-white/20 transition"
              >
                Отмена
              </button>
              <button 
                onClick={handleRemove}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-md hover:bg-red-600 transition"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}