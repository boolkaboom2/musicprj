"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, UploadCloud, Loader2, User as UserIcon } from "lucide-react";

export default function ProfileModal({ 
  isOpen, onClose, currentAvatar, userName 
}: { isOpen: boolean, onClose: () => void, currentAvatar: string | null, userName: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      // 1. Загружаем файл локально
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error("Ошибка загрузки");

      // 2. Сохраняем ссылку в базу
      const dbRes = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadData.url }),
      });

      if (!dbRes.ok) throw new Error("Ошибка сохранения");

      router.refresh(); // Обновляем страницу
      onClose();
    } catch (err) {
      setError("Не удалось обновить аватар");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#1c1c1c] w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 border border-white/5 flex flex-col items-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
        
        <h2 className="text-xl font-bold text-white mb-6">Профиль</h2>
        
        <div className="w-24 h-24 rounded-full bg-[#2a2a2a] mb-4 overflow-hidden border-2 border-white/10 flex items-center justify-center">
          {currentAvatar ? (
            <img src={currentAvatar} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <UserIcon size={40} className="text-white/20" />
          )}
        </div>
        <p className="text-white font-bold text-lg mb-6">{userName}</p>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition flex justify-center items-center gap-2"
        >
          {isUploading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
          {isUploading ? "Загрузка..." : "Изменить аватар"}
        </button>
      </div>
    </div>
  );
}