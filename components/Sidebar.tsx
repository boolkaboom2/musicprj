"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { Suspense, useEffect } from "react";
import UserProfileClient from "./UserProfileClient";

interface SidebarProps {
  user: any;
  isAdmin: boolean;
}

function SidebarContent({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const linkClass = (href: string) => 
    `transition font-medium text-sm tracking-wide ${
      pathname === href ? "text-white" : "text-[var(--text-subdued)] hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="text-2xl font-black uppercase tracking-tighter text-white"
            onClick={() => setSidebarOpen(false)}
          >
            Sadovod
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/50 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex flex-col gap-4">
          <Link href="/" onClick={() => setSidebarOpen(false)} className={linkClass('/')}>
            Главная
          </Link>
          <Link href="/search" onClick={() => setSidebarOpen(false)} className={linkClass('/search')}>
            Поиск
          </Link>
          <Link href="/library" onClick={() => setSidebarOpen(false)} className={linkClass('/library')}>
            Моя медиатека
          </Link>
          <Link href="/playlists" onClick={() => setSidebarOpen(false)} className={linkClass('/playlists')}>
            Публичные плейлисты
          </Link>
          
          {isAdmin && (
            <Link 
              href="/admin" 
              onClick={() => setSidebarOpen(false)} 
              className={`${linkClass('/admin')} mt-4 pt-4 border-t border-[#333]`}
            >
              Админ-панель
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t border-[#333] pt-4">
        <UserProfileClient user={user} />
      </div>
    </div>
  );
}

export default function Sidebar({ user, isAdmin }: SidebarProps) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  // Закрываем сайдбар при смене страницы на мобилке
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-[280px] bg-[#121212] rounded-lg flex-col p-6 shrink-0 h-full">
        <Suspense fallback={null}>
          <SidebarContent user={user} isAdmin={isAdmin} />
        </Suspense>
      </aside>

      {/* Mobile drawer */}
      {isSidebarOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/70 z-[200] animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-[#121212] z-[201] p-6 animate-in slide-in-from-left-full duration-300">
            <Suspense fallback={null}>
              <SidebarContent user={user} isAdmin={isAdmin} />
            </Suspense>
          </aside>
        </>
      )}
    </>
  );
}