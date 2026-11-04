"use client";

import { motion } from "framer-motion";
import { useUIStore } from "@/store/uiStore";
import { usePathname } from "next/navigation";
import { ReactNode, Suspense } from "react";

function MobileSwipeHandlerInner({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register' || pathname === '/welcome' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return <>{children}</>;
  }

  const handlePanEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const startX = info.point.x - info.offset.x; // Вычисляем, где палец коснулся экрана
    
    // Свайп вправо (открыть), если начали у левого края (до 60px)
    if (info.offset.x > swipeThreshold && !isSidebarOpen && startX < 60) {
      setSidebarOpen(true);
    }
    
    // Свайп влево (закрыть)
    if (info.offset.x < -swipeThreshold && isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <motion.div
      className="h-full w-full flex flex-col touch-pan-y" // touch-pan-y разрешает вертикальный скролл, но ловит горизонтальный свайп
      onPanEnd={handlePanEnd}
    >
      {children}
    </motion.div>
  );
}

export default function MobileSwipeHandler({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-full w-full flex flex-col">{children}</div>}>
      <MobileSwipeHandlerInner>{children}</MobileSwipeHandlerInner>
    </Suspense>
  );
}