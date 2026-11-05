"use client";

import { Menu, Music } from "lucide-react";
import Link from "next/link";
import { useUIStore } from "@/store/uiStore";
import { usePathname } from "next/navigation";

export default function MobileHeader() {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register' || pathname === '/welcome' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return null;
  }

  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-main)] border-b border-[var(--border-color)] shrink-0 z-40 transition-colors">
      <button 
        onClick={() => setSidebarOpen(true)}
        className="text-[var(--text-base)] p-2 hover:bg-[var(--bg-card)] rounded-md transition"
        aria-label="Меню"
      >
        <Menu size={24} />
      </button>
      <Link href="/" className="text-xl font-black uppercase tracking-tighter text-[var(--text-base)]">
        Sadovod
      </Link>
      <Link href="/search" className="text-[var(--text-base)] p-2 hover:bg-[var(--bg-card)] rounded-md transition">
        <Music size={22} />
      </Link>
    </header>
  );
}