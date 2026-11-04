"use client";

import { motion } from "framer-motion";
import { useUIStore } from "@/store/uiStore";
import { usePathname } from "next/navigation";
import { ReactNode, Suspense } from "react";

function MobileSwipeHandlerInner({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  const handlePanEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold && !isSidebarOpen && info.point.x < 100) {
      setSidebarOpen(true);
    }
    
    if (info.offset.x < -swipeThreshold && isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <motion.div
      className="h-full w-full flex flex-col" // <-- УБРАЛИ md:hidden
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