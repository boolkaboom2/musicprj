"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import ProfileModal from "./ProfileModal";
import AvatarEffect from "./AvatarEffect";

export default function UserProfileClient({ user }: { user: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col gap-2 animate-in fade-in">
        <Link href="/login" className="bg-white text-black font-bold text-center py-2 rounded-md hover:bg-gray-200 transition-colors text-sm">Войти</Link>
        <Link href="/register" className="bg-transparent text-white border border-white/20 font-bold text-center py-2 rounded-md hover:bg-white/5 transition-colors text-sm">Регистрация</Link>
      </div>
    );
  }

  const avatarSrc = user.avatarUrl 
    ? (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('/') ? user.avatarUrl : `/api/stream/${user.avatarUrl}`)
    : null;

  // Замени функцию handleLogout:
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear(); // Очищаем всё
      sessionStorage.clear();
      // Принудительный редирект
      window.location.replace("/welcome"); 
    } catch (error) {
      console.error("Ошибка выхода", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between animate-in fade-in">
        <Link href={`/user/${user.id}`} className="flex items-center gap-3 overflow-hidden hover:bg-white/5 p-1 rounded-md transition text-left">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            {avatarSrc ? (
              <AvatarEffect effect={user.avatarEffect}>
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              </AvatarEffect>
            ) : (
              <UserIcon size={16} className="text-white" />
            )}
          </div>
          <span className="text-white text-sm font-medium truncate">{user.name || user.email}</span>
        </Link>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setIsModalOpen(true)} className="text-[var(--text-subdued)] hover:text-white transition p-2" title="Настройки">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="text-[var(--text-subdued)] hover:text-white transition p-2" title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <ProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentUser={user} 
      />
    </>
  );
}