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

interface SidebarProps {
  user: any;
  isAdmin: boolean;
}

function SidebarContent({ user, isAdmin, onClose }: SidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const isGuest = !user;

  const linkClass = (href: string) => 
    `transition-all duration-300 block py-2.5 lg:py-3 font-medium text-sm md:text-base lg:text-lg tracking-wide hover:translate-x-1 ${
      pathname === href ? "text-[var(--text-base)] font-bold" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"
    }`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="flex flex-col h-full justify-between overflow-y-auto no-scrollbar"
    >
      <div>
        <div className="flex items-center justify-between mb-8 lg:mb-12">
          <Link 
            href="/" 
            className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-[var(--text-base)]"
            onClick={onClose}
          >
            Sadovod
          </Link>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-[var(--text-subdued)] hover:text-[var(--text-base)] p-1 transition">
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex flex-col w-full">
          <motion.div variants={itemVariants}><Link href="/" onClick={onClose} className={linkClass('/')}>Главная</Link></motion.div>
          <motion.div variants={itemVariants}><Link href="/search" onClick={onClose} className={linkClass('/search')}>Поиск</Link></motion.div>

          {!isGuest && (
            <>
              <motion.div variants={itemVariants}><Link href="/library" onClick={onClose} className={linkClass('/library')}>Моя медиатека</Link></motion.div>
              <motion.div variants={itemVariants}><Link href="/playlists" onClick={onClose} className={linkClass('/playlists')}>Публичные плейлисты</Link></motion.div>
              
              <motion.div variants={itemVariants} className="w-full h-px bg-[var(--border-color)] my-4" />
              
              <motion.div variants={itemVariants}><ImportPlaylistButton /></motion.div>
              <motion.div variants={itemVariants}><FeedbackButton /></motion.div>
              <motion.div variants={itemVariants}><Link href="/faq" onClick={onClose} className={linkClass('/faq')}>FAQ</Link></motion.div>
            </>
          )}
          
          {isAdmin && (
            <motion.div variants={itemVariants}>
              <div className="w-full h-px bg-[var(--border-color)] my-4" />
              <Link href="/admin" onClick={onClose} className={linkClass('/admin')}>
                Админ-панель
              </Link>
            </motion.div>
          )}
        </nav>
      </div>

      <div className="w-full mt-6 flex flex-col gap-4">
        <div className="w-full h-px bg-[var(--border-color)]" />
        <UserProfileClient user={user} />
        
        <div className="text-[10px] lg:text-xs text-[var(--text-subdued)] leading-tight pb-2">
          <Link href="/privacy" className="hover:text-[var(--text-base)] underline transition mb-1 inline-block">
            Политика конфиденциальности
          </Link>
          <p>Учебный проект. Все права на аудиозаписи принадлежат их правообладателям.</p>
        </div>
      </div>
    </motion.div>
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

  if (pathname === '/login' || pathname === '/register' || pathname === '/welcome' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return null;
  }

  return (
    <>
      <aside className="hidden md:flex w-[280px] lg:w-[320px] bg-transparent flex-col p-6 lg:p-8 shrink-0 h-full transition-all duration-300">
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
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: "easeOut" }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-[var(--bg-card)] z-[201] p-6 transition-colors duration-300 shadow-2xl"
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