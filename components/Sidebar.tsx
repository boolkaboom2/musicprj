"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserProfileClient from "./UserProfileClient";
import FeedbackButton from "./FeedbackButton";
import ImportPlaylistButton from "./ImportPlaylistButton";
import InstallPWA from "./InstallPWA";

interface SidebarProps {
  user: any;
  isAdmin: boolean;
}

function SidebarContent({ user, isAdmin, onClose }: SidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const isGuest = !user;

  const linkClass = (href: string) => 
    `transition font-medium text-sm tracking-wide ${
      pathname === href ? "text-white" : "text-[var(--text-subdued)] hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full justify-between overflow-y-auto custom-scrollbar">
      <div>
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="text-2xl font-black uppercase tracking-tighter text-white"
            onClick={onClose}
          >
            Sadovod
          </Link>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-white/50 hover:text-white p-1 transition">
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex flex-col gap-4">
          <Link href="/" onClick={onClose} className={linkClass('/')}>
            Главная
          </Link>
          <Link href="/search" onClick={onClose} className={linkClass('/search')}>
            Поиск
          </Link>

          {!isGuest && (
            <>
              <Link href="/library" onClick={onClose} className={linkClass('/library')}>
                Моя медиатека
              </Link>
              <Link href="/playlists" onClick={onClose} className={linkClass('/playlists')}>
                Публичные плейлисты
              </Link>
              
              <div className="mt-4 pt-4 border-t border-[#333]">
                <ImportPlaylistButton />
                <InstallPWA />
              </div>
              <FeedbackButton />
              <Link href="/faq" onClick={onClose} className={linkClass('/faq')}>
                FAQ
              </Link>
            </>
          )}
          
          {isAdmin && (
            <Link 
              href="/admin" 
              onClick={onClose} 
              className={`${linkClass('/admin')} mt-4 pt-4 border-t border-[#333]`}
            >
              Админ-панель
            </Link>
          )}
        </nav>
      </div>

      <div className="border-t border-[#333] pt-4 flex flex-col gap-4">
        <UserProfileClient user={user} />
        
        <div className="text-[10px] text-white/30 leading-tight pb-2">
          <Link href="/privacy" className="hover:text-white/60 underline transition mb-1 inline-block">
            Политика конфиденциальности
          </Link>
          <p>Учебный проект. Все права на аудиозаписи принадлежат их правообладателям. Сайт не предназначен для коммерческого использования.</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (isSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <>
      <aside className="hidden md:flex w-[280px] bg-[#121212] rounded-lg flex-col p-6 shrink-0 h-full">
        <Suspense fallback={null}>
          <SidebarContent user={user} isAdmin={isAdmin} />
        </Suspense>
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/70 z-[200]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-[#121212] z-[201] p-6"
            >
              <Suspense fallback={null}>
                <SidebarContent user={user} isAdmin={isAdmin} onClose={() => setSidebarOpen(false)} />
              </Suspense>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}