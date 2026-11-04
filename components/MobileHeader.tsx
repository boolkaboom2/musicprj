"use client";

import { Menu, Music } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/store/uiStore";
import { usePathname } from "next/navigation";

export default function MobileHeader() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const pathname = usePathname();

  // Скрываем шапку на страницах авторизации
    if (pathname === '/login' || pathname === '/register' || pathname === '/welcome' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return null;
  }

  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-black border-b border-white/10 shrink-0 z-40">
      <button 
        onClick={() => setSidebarOpen(true)}
        className="text-white p-2 hover:bg-white/5 rounded-md transition"
        aria-label="Меню"
      >
        <Menu size={24} />
      </button>
      <Link href="/" className="text-xl font-black uppercase tracking-tighter text-white">
        Sadovod
      </Link>
      <Link href="/search" className="text-white p-2 hover:bg-white/5 rounded-md transition">
        <Music size={22} />
      </Link>
    </header>
  );
}