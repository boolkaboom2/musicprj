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
        <Link href="/login" className="bg-[var(--text-base)] text-[var(--bg-main)] font-bold text-center py-2 3xl:py-3 rounded-md hover:opacity-80 transition-opacity text-sm 3xl:text-lg">Войти</Link>
        <Link href="/register" className="bg-transparent text-[var(--text-base)] border border-[var(--border-color)] font-bold text-center py-2 3xl:py-3 rounded-md hover:bg-[var(--bg-main)] transition-colors text-sm 3xl:text-lg">Регистрация</Link>
      </div>
    );
  }

  const avatarSrc = user.avatarUrl 
    ? (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('/') ? user.avatarUrl : `/api/stream/${user.avatarUrl}`)
    : null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/welcome"); 
    } catch (error) {
      console.error("Ошибка выхода", error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between animate-in fade-in bg-[var(--bg-main)] p-2 3xl:p-4 rounded-xl border border-[var(--border-color)] transition-colors">
        <Link href={`/user/${user.id}`} className="flex items-center gap-3 3xl:gap-4 overflow-hidden hover:opacity-80 transition text-left">
          {/* УВЕЛИЧЕН АВАТАР */}
          <div className="w-12 h-12 3xl:w-16 3xl:h-16 4xl:w-20 4xl:h-20 rounded-full flex items-center justify-center shrink-0 relative">
            <AvatarEffect effect={user.avatarEffect || "none"}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--border-color)]">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={24} className="text-[var(--text-base)] m-auto mt-3 3xl:mt-5 3xl:w-8 3xl:h-8" />
                )}
              </div>
            </AvatarEffect>
          </div>
          <div className="flex flex-col min-w-0">
            {/* УВЕЛИЧЕН ТЕКСТ */}
            <span className="text-[var(--text-base)] font-bold text-base 3xl:text-xl 4xl:text-2xl truncate">{user.name || "Пользователь"}</span>
            <span className="text-[var(--text-subdued)] text-xs 3xl:text-sm 4xl:text-base truncate">Профиль</span>
          </div>
        </Link>
        
        <div className="flex flex-col gap-1 shrink-0 ml-2">
          <button onClick={() => setIsModalOpen(true)} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-1.5 3xl:p-2.5 bg-[var(--bg-card)] rounded-md" title="Настройки">
            <Settings size={16} className="3xl:w-6 3xl:h-6" />
          </button>
          <button onClick={handleLogout} className="text-[var(--text-subdued)] hover:text-red-500 transition p-1.5 3xl:p-2.5 bg-[var(--bg-card)] rounded-md" title="Выйти">
            <LogOut size={16} className="3xl:w-6 3xl:h-6" />
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