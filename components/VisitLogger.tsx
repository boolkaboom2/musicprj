"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitLogger() {
  const pathname = usePathname();

  useEffect(() => {
    // Игнорируем админку и API, чтобы не засорять статистику
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname })
    }).catch(console.error);
  }, [pathname]);

  return null;
}